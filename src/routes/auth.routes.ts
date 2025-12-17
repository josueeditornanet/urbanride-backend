import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/me', ensureAuthenticated, authController.me);
authRoutes.put('/profile', ensureAuthenticated, authController.updateProfile);

export { authRoutes };