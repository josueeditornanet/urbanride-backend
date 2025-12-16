import { Router } from 'express';
import { RideController } from '../controllers/RideController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { authorizeRole } from '../middlewares/authorizeRole';

const rideRoutes = Router();
const rideController = new RideController();

// Qualquer usuário autenticado pode solicitar uma corrida
rideRoutes.post('/', ensureAuthenticated, rideController.requestRide);

// Apenas passageiros podem buscar corridas ativas
rideRoutes.get('/active', ensureAuthenticated, rideController.getActive);

// Apenas motoristas podem ver corridas disponíveis
rideRoutes.get('/available', ensureAuthenticated, authorizeRole(['DRIVER']), rideController.getAvailable);

// Apenas motoristas podem aceitar corridas
rideRoutes.post('/:id/accept', ensureAuthenticated, authorizeRole(['DRIVER']), rideController.acceptRide);

// Apenas motoristas podem atualizar o status das corridas
rideRoutes.patch('/:id/status', ensureAuthenticated, authorizeRole(['DRIVER']), rideController.updateStatus);

// Ambos passageiros e motoristas podem cancelar corridas
rideRoutes.patch('/:id/cancel', ensureAuthenticated, rideController.cancelRide);

// Ambos passageiros e motoristas podem ver detalhes da corrida
rideRoutes.get('/:id', ensureAuthenticated, rideController.getRide);

// Ambos passageiros e motoristas podem enviar mensagens
rideRoutes.post('/:id/messages', ensureAuthenticated, rideController.sendMessage);

export { rideRoutes };