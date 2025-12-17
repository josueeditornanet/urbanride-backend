import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { rideRoutes } from './ride.routes';
import { walletRoutes } from './wallet.routes';
import { webhookRoutes } from './webhook.routes';
import { mapsRouter } from './maps.routes';
import { driverDocumentRoutes } from './driver-document.routes';

const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/rides', rideRoutes);
routes.use('/wallet', walletRoutes);
routes.use('/webhooks', webhookRoutes);
routes.use('/maps', mapsRouter);
routes.use('/driver-documents', driverDocumentRoutes);

export { routes };