import { Router } from 'express';
import { WalletController } from '../controllers/WalletController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const walletRoutes = Router();
const walletController = new WalletController();

walletRoutes.get('/history', ensureAuthenticated, walletController.getHistory);
walletRoutes.post('/recharge', ensureAuthenticated, walletController.generatePix);

export { walletRoutes };