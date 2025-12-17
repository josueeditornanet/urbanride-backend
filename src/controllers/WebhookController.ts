import { Request, Response } from 'express';
import { query, getClient } from '../config/database';
import crypto from 'crypto';

export class WebhookController {
  async handlePixNotification(req: Request, res: Response) {
    try {
      // 1. Validar assinatura do webhook (Mercado Pago)
      const signature = req.headers['x-signature'] as string;
      const requestId = req.headers['x-request-id'] as string;

      if (!signature || !requestId) {
        return res.status(401).json({
          success: false,
          message: 'Assinatura inválida'
        });
      }

      // TODO: Validar assinatura real
      /*
      const isValid = this.validateSignature(
        signature,
        requestId,
        req.body,
        process.env.WEBHOOK_SECRET as string
      );

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Assinatura inválida'
        });
      }
      */

      // 2. Processar notificação
      const { data } = req.body;

      if (!data || !data.id) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos'
        });
      }

      // TODO: Buscar informações do pagamento no Mercado Pago
      /*
      const payment = await mercadopago.payment.get(data.id);

      if (payment.status !== 'approved') {
        return res.status(200).json({ success: true });
      }

      const userId = payment.external_reference;
      const amount = payment.transaction_amount;
      */

      // Mock para testes (remover em produção)
      const userId = data.external_reference;
      const amount = data.amount || 50.00;

      // 3. Verificar idempotência
      const existingTransaction = await query(
        `SELECT id FROM transactions 
         WHERE metadata->>'payment_id' = $1`,
        [data.id]
      );

      if (existingTransaction.rows.length > 0) {
        // Já processamos este pagamento
        return res.status(200).json({ success: true });
      }

      // 4. Atualizar saldo do usuário (com transação)
      const client = await getClient();

      try {
        await client.query('BEGIN');

        await client.query(
          `UPDATE users 
           SET prepaid_credits = prepaid_credits + $1 
           WHERE id = $2`,
          [amount, userId]
        );

        await client.query(
          `INSERT INTO transactions (user_id, amount, type, description, metadata)
           VALUES ($1, $2, 'CREDIT', 'Recarga via PIX', $3)`,
          [userId, amount, JSON.stringify({ payment_id: data.id })]
        );

        await client.query('COMMIT');

        return res.status(200).json({
          success: true,
          data: null
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar webhook'
      });
    }
  }

  private validateSignature(
    signature: string,
    requestId: string,
    body: any,
    secret: string
  ): boolean {
    const payload = `${requestId}${JSON.stringify(body)}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }
}