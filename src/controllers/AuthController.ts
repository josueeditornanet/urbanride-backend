import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

// Tipos JWT
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['PASSENGER', 'DRIVER'])
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
});

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);

      // Verifica se email já existe
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email já cadastrado'
        });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Cria usuário
      const result = await query(
        `INSERT INTO users (name, email, password_hash, role, prepaid_credits) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, name, email, role, prepaid_credits, payable_balance, rating, created_at`,
        [data.name, data.email, passwordHash, data.role, data.role === 'DRIVER' ? 50.00 : 0.00]
      );

      const user = result.rows[0];

      // Se for motorista, registra o bônus inicial
      if (data.role === 'DRIVER') {
        await query(
          `INSERT INTO transactions (user_id, amount, type, description) 
           VALUES ($1, $2, $3, $4)`,
          [user.id, 50.00, 'CREDIT', 'Bônus de boas-vindas']
        );
      }

      // Gera token
      const token = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      return res.status(201).json({
        success: true,
        data: {
          token,
          user
        }
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

  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);

      // Busca usuário
      const result = await query(
        `SELECT id, name, email, password_hash, role, prepaid_credits, 
                payable_balance, rating, created_at 
         FROM users WHERE email = $1`,
        [data.email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      const user = result.rows[0];

      // Verifica senha
      const passwordMatch = await bcrypt.compare(data.password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Email ou senha incorretos'
        });
      }

      // Remove hash da resposta
      delete user.password_hash;

      // Gera token
      const token = jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      return res.json({
        success: true,
        data: {
          token,
          user
        }
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

  async me(req: Request, res: Response) {
    try {
      const result = await query(
        `SELECT id, name, email, role, prepaid_credits, payable_balance,
                rating, created_at, car_model, license_plate, verification_status,
                cnh_document, crlv_document, profile_photo,
                -- Campos opcionais para perfis completos
                cpf, phone, birth_date
         FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const user = result.rows[0];

      // Formatando a resposta para bater com o formato do frontend
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'PASSENGER' | 'DRIVER',
        prepaidCredits: user.prepaid_credits,
        payableBalance: user.payable_balance,
        rating: user.rating,
        createdAt: user.created_at,
        carModel: user.car_model,
        licensePlate: user.license_plate,
        verificationStatus: user.verification_status,
        documents: {
          cnh: user.cnh_document,
          crlv: user.crlv_document,
          profile: user.profile_photo
        },
        // Campos para perfis completos (progressive profiling)
        cpf: user.cpf,
        phone: user.phone,
        birthDate: user.birth_date
      };

      return res.json({
        success: true,
        data: {
          user: formattedUser
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const { name, car_model, license_plate, cpf, phone, birth_date } = req.body;

      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 2; // Começa em 2 porque o primeiro parâmetro é req.user.id

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(name);
        paramIndex++;
      }
      if (car_model !== undefined) {
        updateFields.push(`car_model = $${paramIndex}`);
        updateValues.push(car_model);
        paramIndex++;
      }
      if (license_plate !== undefined) {
        updateFields.push(`license_plate = $${paramIndex}`);
        updateValues.push(license_plate);
        paramIndex++;
      }
      if (cpf !== undefined) {
        updateFields.push(`cpf = $${paramIndex}`);
        updateValues.push(cpf);
        paramIndex++;
      }
      if (phone !== undefined) {
        updateFields.push(`phone = $${paramIndex}`);
        updateValues.push(phone);
        paramIndex++;
      }
      if (birth_date !== undefined) {
        updateFields.push(`birth_date = $${paramIndex}`);
        updateValues.push(birth_date);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar'
        });
      }

      updateValues.unshift(req.user.id); // Adiciona o ID do usuário como primeiro parâmetro

      const queryStr = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
      const result = await query(queryStr, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const user = result.rows[0];

      // Formatando a resposta para bater com o formato do frontend
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'PASSENGER' | 'DRIVER',
        prepaidCredits: user.prepaid_credits,
        payableBalance: user.payable_balance,
        rating: user.rating,
        createdAt: user.created_at,
        carModel: user.car_model,
        licensePlate: user.license_plate,
        verificationStatus: user.verification_status,
        documents: {
          cnh: user.cnh_document,
          crlv: user.crlv_document,
          profile: user.profile_photo
        },
        cpf: user.cpf,
        phone: user.phone,
        birthDate: user.birth_date
      };

      return res.json({
        success: true,
        data: {
          user: formattedUser
        }
      });
    } catch (error) {
      throw error;
    }
  }
}