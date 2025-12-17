import { Router } from 'express';
import { DriverDocumentController } from '../controllers/DriverDocumentController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import multer from 'multer';

const driverDocumentRoutes = Router();
const driverDocumentController = new DriverDocumentController();

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage(); // Em produção, armazenar em serviço de nuvem
const upload = multer({ storage });

driverDocumentRoutes.post('/upload-document', 
  ensureAuthenticated, 
  upload.single('file'),
  driverDocumentController.uploadDocument
);

driverDocumentRoutes.post('/submit-for-review', 
  ensureAuthenticated, 
  driverDocumentController.submitForReview
);

export { driverDocumentRoutes };