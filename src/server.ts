import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { routes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { camelCaseMiddleware } from './middlewares/camelCase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

// Configuração para trabalhar com proxy reverso (Traefik)
app.set('trust proxy', 1);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos'
});

// Middlewares de Segurança
app.use(helmet());

// Configuração CORS para lidar com requisições pré-vôo (preflight) OPTIONS
const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN,
    'https://app.melevabr.com.br'  // Nova origem permitida
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Para lidar com requisições OPTIONS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false
};

app.use(cors(corsOptions));
app.options('*', cors()); // Manipular requisições OPTIONS para todas as rotas
app.use(limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conversão CamelCase nas respostas
app.use(camelCaseMiddleware);

// Rotas - REMOVIDO '/api' para compatibilidade com frontend
app.use('/', routes);  // ⬅️ ÚNICA ALTERAÇÃO NECESSÁRIA

// Depuração: verifique se routes existe
console.log('🔍 Routes object:', routes);
console.log('🔍 Routes stack:', routes.stack);

// Rota de teste manual
app.post('/debug-register', (req, res) => {
  console.log('✅ Debug route called');
  res.json({ working: true, time: Date.now() });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Error Handler (sempre por último)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});