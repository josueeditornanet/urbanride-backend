import { Request, Response } from 'express';
import { z } from 'zod';
import { query, getClient } from '../config/database';

const requestRideSchema = z.object({
  origin: z.string().min(5),
  destination: z.string().min(5),
  price: z.number().positive(),
  distanceKm: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD'])
});

const updateStatusSchema = z.object({
  status: z.enum(['DRIVER_ARRIVED', 'RUNNING', 'COMPLETED'])
});

export class RideController {
  async requestRide(req: Request, res: Response) {
    try {
      const data = requestRideSchema.parse(req.body);

      const result = await query(
        `INSERT INTO rides (passenger_id, origin_address, destination_address, price, distance_km, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, data.origin, data.destination, data.price, data.distanceKm, data.paymentMethod]
      );

      return res.status(201).json({
        success: true,
        ride: result.rows[0]
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
      }
      throw error;
    }
  }

  async getAvailable(req: Request, res: Response) {
    try {
      const result = await query(
        `SELECT r.*, u.name as passenger_name 
         FROM rides r
         JOIN users u ON u.id = r.passenger_id
         WHERE r.status = 'REQUESTED'
         ORDER BY r.created_at DESC
         LIMIT 20`
      );

      return res.json({
        success: true,
        rides: result.rows
      });
    } catch (error) {
      throw error;
    }
  }

  async getActive(req: Request, res: Response) {
    try {
      const result = await query(
        `SELECT r.*, 
                CASE 
                  WHEN r.passenger_id = $1 THEN u2.name
                  ELSE u1.name
                END as other_user_name
         FROM rides r
         LEFT JOIN users u1 ON u1.id = r.passenger_id
         LEFT JOIN users u2 ON u2.id = r.driver_id
         WHERE (r.passenger_id = $1 OR r.driver_id = $1)
           AND r.status IN ('ACCEPTED', 'DRIVER_ARRIVED', 'RUNNING')
         LIMIT 1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          ride: null
        });
      }

      return res.json({
        success: true,
        ride: result.rows[0]
      });
    } catch (error) {
      throw error;
    }
  }

  async acceptRide(req: Request, res: Response) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // 1. Trava a corrida (Row Locking)
      const rideResult = await client.query(
        `SELECT * FROM rides WHERE id = $1 FOR UPDATE`,
        [req.params.id]
      );

      if (rideResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Corrida não encontrada'
        });
      }

      const ride = rideResult.rows[0];

      // 2. Valida status
      if (ride.status !== 'REQUESTED') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Esta corrida já foi aceita por outro motorista'
        });
      }

      // 3. Verifica saldo do motorista
      const driverResult = await client.query(
        `SELECT prepaid_credits, name, car_model, license_plate 
         FROM users WHERE id = $1 FOR UPDATE`,
        [req.user.id]
      );

      const driver = driverResult.rows[0];
      const fee = ride.price * 0.10; // Taxa de 10%

      if (driver.prepaid_credits < fee) {
        await client.query('ROLLBACK');
        return res.status(402).json({
          success: false,
          message: `Saldo insuficiente. Necessário: R$ ${fee.toFixed(2)}`
        });
      }

      // 4. Atualiza a corrida
      await client.query(
        `UPDATE rides 
         SET status = 'ACCEPTED', 
             driver_id = $1,
             driver_name = $2,
             driver_car_model = $3,
             driver_license_plate = $4
         WHERE id = $5`,
        [req.user.id, driver.name, driver.car_model, driver.license_plate, req.params.id]
      );

      await client.query('COMMIT');

      // Busca corrida atualizada
      const updatedRide = await query(
        'SELECT * FROM rides WHERE id = $1',
        [req.params.id]
      );

      return res.json({
        success: true,
        ride: updatedRide.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatus(req: Request, res: Response) {
    const client = await getClient();

    try {
      const data = updateStatusSchema.parse(req.body);

      await client.query('BEGIN');

      const rideResult = await client.query(
        `SELECT * FROM rides WHERE id = $1 FOR UPDATE`,
        [req.params.id]
      );

      if (rideResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Corrida não encontrada'
        });
      }

      const ride = rideResult.rows[0];

      // Se for completar, debita a taxa
      if (data.status === 'COMPLETED' && ride.status !== 'COMPLETED') {
        const fee = ride.price * 0.10;

        // Debita taxa do motorista
        await client.query(
          `UPDATE users 
           SET prepaid_credits = prepaid_credits - $1,
               payable_balance = payable_balance + $2
           WHERE id = $3`,
          [fee, ride.price - fee, ride.driver_id]
        );

        // Registra transação de taxa
        await client.query(
          `INSERT INTO transactions (user_id, ride_id, amount, type, description)
           VALUES ($1, $2, $3, 'FEE', 'Taxa da corrida')`,
          [ride.driver_id, ride.id, fee]
        );

        // Registra ganho
        await client.query(
          `INSERT INTO transactions (user_id, ride_id, amount, type, description)
           VALUES ($1, $2, $3, 'EARNING', 'Corrida concluída')`,
          [ride.driver_id, ride.id, ride.price]
        );
      }

      // Atualiza status
      const timestamp = data.status === 'RUNNING' ? 'started_at' : 
                       data.status === 'COMPLETED' ? 'completed_at' : null;

      let updateQuery = `UPDATE rides SET status = $1`;
      const params: any[] = [data.status];

      if (timestamp) {
        updateQuery += `, ${timestamp} = NOW()`;
      }

      updateQuery += ` WHERE id = $${params.length + 1} RETURNING *`;
      params.push(req.params.id);

      const result = await client.query(updateQuery, params);

      await client.query('COMMIT');

      return res.json({
        success: true,
        ride: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelRide(req: Request, res: Response) {
    try {
      const { reason } = req.body;

      const result = await query(
        `UPDATE rides 
         SET status = 'CANCELLED', cancel_reason = $1 
         WHERE id = $2 
         RETURNING *`,
        [reason || 'Cancelado pelo usuário', req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Corrida não encontrada'
        });
      }

      return res.json({
        success: true,
        ride: result.rows[0]
      });
    } catch (error) {
      throw error;
    }
  }

  async getRide(req: Request, res: Response) {
    try {
      const rideResult = await query(
        'SELECT * FROM rides WHERE id = $1',
        [req.params.id]
      );

      if (rideResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Corrida não encontrada'
        });
      }

      const messagesResult = await query(
        `SELECT m.*, u.name as sender_name 
         FROM chat_messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.ride_id = $1
         ORDER BY m.created_at ASC`,
        [req.params.id]
      );

      return res.json({
        success: true,
        ride: {
          ...rideResult.rows[0],
          messages: messagesResult.rows
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Mensagem não pode ser vazia'
        });
      }

      const result = await query(
        `INSERT INTO chat_messages (ride_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.params.id, req.user.id, content]
      );

      return res.status(201).json({
        success: true,
        message: result.rows[0]
      });
    } catch (error) {
      throw error;
    }
  }
}