import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';

const webhookRoutes = Router();
const webhookController = new WebhookController();

// Webhook do Mercado Pago (sem autenticação, validação por assinatura)
webhookRoutes.post('/pix', webhookController.handlePixNotification);

export { webhookRoutes };