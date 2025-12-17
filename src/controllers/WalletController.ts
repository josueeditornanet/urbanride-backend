import { Request, Response } from 'express';
import { z } from 'zod';
import { query, getClient } from '../config/database';
import crypto from 'crypto';

const rechargeSchema = z.object({
  amount: z.number().positive().min(10, 'Valor mínimo: R$ 10,00')
});

export class WalletController {
  async getHistory(req: Request, res: Response) {
    try {
      const result = await query(
        `SELECT * FROM transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [req.user.id]
      );

      return res.json({
        success: true,
        data: {
          transactions: result.rows
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async generatePix(req: Request, res: Response) {
    try {
      const data = rechargeSchema.parse(req.body);

      // Criar transação de recarga pendente
      const client = await getClient();

      try {
        await client.query('BEGIN');

        // Criar transação pendente
        const transactionResult = await client.query(
          `INSERT INTO transactions (user_id, amount, type, description, status)
           VALUES ($1, $2, 'CREDIT', 'Recarga via PIX', 'PENDING')
           RETURNING id`,
          [req.user.id, data.amount]
        );

        // Gerar QR Code falso para testes (em produção, usar API do Mercado Pago)
        const fakeQrCode = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}520400005303986540${data.amount.toFixed(2)}5802BR5925URBANRIDE6009SAO PAULO`;

        await client.query('COMMIT');

        return res.json({
          success: true,
          data: {
            payment: {
              qrCode: fakeQrCode,
              qrCodeBase64: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
              copyPaste: fakeQrCode,
              amount: data.amount,
              transactionId: transactionResult.rows[0].id,
              expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutos
            }
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
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

  // Endpoint para confirmar pagamento PIX (simulação)
  async confirmPixPayment(req: Request, res: Response) {
    try {
      const { transactionId, amount } = req.body;

      if (!transactionId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'transactionId e amount são obrigatórios'
        });
      }

      const client = await getClient();

      try {
        await client.query('BEGIN');

        // Atualizar transação para COMPLETED
        const updateResult = await client.query(
          `UPDATE transactions
           SET status = 'COMPLETED'
           WHERE id = $1 AND user_id = $2 AND amount = $3 AND status = 'PENDING'
           RETURNING *`,
          [transactionId, req.user.id, amount]
        );

        if (updateResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Transação não encontrada ou já processada'
          });
        }

        // Atualizar saldo do usuário
        await client.query(
          `UPDATE users
           SET prepaid_credits = prepaid_credits + $1
           WHERE id = $2`,
          [amount, req.user.id]
        );

        await client.query('COMMIT');

        // Retornar dados atualizados do usuário
        const updatedUser = await query(
          'SELECT prepaid_credits, payable_balance FROM users WHERE id = $1',
          [req.user.id]
        );

        return res.json({
          success: true,
          data: updatedUser.rows[0]
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw error;
    }
  }
}