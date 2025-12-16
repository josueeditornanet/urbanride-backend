import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
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
        transactions: result.rows
      });
    } catch (error) {
      throw error;
    }
  }

  async generatePix(req: Request, res: Response) {
    try {
      const data = rechargeSchema.parse(req.body);

      // TODO: Integração real com Mercado Pago
      // Por enquanto, gera QR Code falso para testes

      const fakeQrCode = `00020126580014br.gov.bcb.pix0136${crypto.randomUUID()}520400005303986540${data.amount.toFixed(2)}5802BR5925URBANRIDE6009SAO PAULO`;
      
      const fakeCopyPaste = fakeQrCode;

      return res.json({
        success: true,
        payment: {
          qrCode: fakeQrCode,
          qrCodeBase64: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
          copyPaste: fakeCopyPaste,
          amount: data.amount,
          expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutos
        }
      });

      /* 
      // IMPLEMENTAÇÃO REAL COM MERCADO PAGO:
      const payment = await mercadopago.payment.create({
        transaction_amount: data.amount,
        description: 'Recarga UrbanRide',
        payment_method_id: 'pix',
        payer: {
          email: req.user.email
        },
        external_reference: req.user.id,
        notification_url: `${process.env.API_URL}/webhooks/pix`
      });

      return res.json({
        success: true,
        payment: {
          qrCode: payment.point_of_interaction.transaction_data.qr_code,
          qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64,
          copyPaste: payment.point_of_interaction.transaction_data.qr_code,
          amount: data.amount,
          paymentId: payment.id
        }
      });
      */
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
}