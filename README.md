# UrbanRide Backend API

Backend completo para aplicativo de mobilidade urbana construído com Node.js, Express e PostgreSQL.

## 🚀 Stack Tecnológica

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Auth**: JWT (JSON Web Tokens)
- **Validação**: Zod
- **Containerização**: Docker & Docker Compose

## 📋 Pré-requisitos

- Docker e Docker Compose instalados na VPS
- Domínio configurado (para CORS e webhook)
- Conta no Mercado Pago (para integração de pagamentos)

## 🛠️ Instalação na VPS

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/urbanride-backend.git
cd urbanride-backend
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

**Variáveis obrigatórias:**

```env
PORT=3333
NODE_ENV=production
API_URL=https://api.seudominio.com.br

DB_PASSWORD=SUA_SENHA_POSTGRESQL_FORTE

JWT_SECRET=sua_chave_jwt_super_secreta_min_32_caracteres
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://seuapp.com.br

MP_ACCESS_TOKEN=seu_token_mercado_pago
WEBHOOK_SECRET=seu_secret_webhook
```

### 3. Suba os containers

```bash
docker-compose up -d
```

### 4. Verifique os logs

```bash
docker-compose logs -f app
```

### 5. Teste a API

```bash
curl https://api.seudominio.com.br/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

## 📡 Endpoints da API

### Autenticação

- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário logado

### Corridas

- `POST /api/rides` - Solicitar corrida (Passageiro)
- `GET /api/rides/available` - Listar corridas disponíveis (Motorista)
- `GET /api/rides/active` - Buscar corrida ativa
- `POST /api/rides/:id/accept` - Aceitar corrida (Motorista)
- `PATCH /api/rides/:id/status` - Atualizar status
- `PATCH /api/rides/:id/cancel` - Cancelar corrida
- `GET /api/rides/:id` - Buscar corrida específica
- `POST /api/rides/:id/messages` - Enviar mensagem

### Carteira

- `GET /api/wallet/history` - Histórico de transações
- `POST /api/wallet/recharge` - Gerar QR Code PIX

### Webhooks

- `POST /api/webhooks/pix` - Notificação de pagamento (Mercado Pago)

## 🔧 Comandos Úteis

### Ver logs em tempo real
```bash
docker-compose logs -f app
```

### Reiniciar apenas a aplicação
```bash
docker-compose restart app
```

### Acessar o banco de dados
```bash
docker-compose exec db psql -U urbanride -d urbanride_db
```

### Parar todos os containers
```bash
docker-compose down
```

### Parar e remover volumes (CUIDADO: apaga o banco)
```bash
docker-compose down -v
```

## 🔐 Segurança

- ✅ Rate limiting (100 requisições por 15 minutos)
- ✅ Helmet.js (headers de segurança)
- ✅ CORS configurado
- ✅ JWT com expiração
- ✅ Senhas com bcrypt
- ✅ Validação de dados com Zod
- ✅ Transações SQL com row locking

## 🧪 Testando com o Frontend

No seu projeto frontend, configure:

```typescript
// api.ts
const BASE_URL = 'https://api.seudominio.com.br/api'
```

## 🐛 Troubleshooting

### Container não inicia

```bash
docker-compose logs app
```

### Erro de conexão com banco

Verifique se o banco está rodando:
```bash
docker-compose ps
docker-compose logs db
```

### Erro de CORS

Verifique se o `CORS_ORIGIN` no `.env` está correto e corresponde ao domínio do frontend.

### Webhook não funciona

1. Certifique-se de que a URL do webhook está configurada no Mercado Pago
2. Use uma ferramenta como ngrok para testar localmente
3. Verifique os logs: `docker-compose logs -f app`

## 📦 Estrutura do Projeto

```
urbanride-backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   ├── RideController.ts
│   │   ├── WalletController.ts
│   │   └── WebhookController.ts
│   ├── middlewares/
│   │   ├── ensureAuthenticated.ts
│   │   ├── authorizeRole.ts
│   │   ├── camelCase.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── ride.routes.ts
│   │   ├── wallet.routes.ts
│   │   └── webhook.routes.ts
│   └── server.ts
├── docker-compose.yml
├── Dockerfile
├── init.sql
├── package.json
├── tsconfig.json
└── .env.example
```

## 🚀 Próximos Passos

1. ✅ Implementar integração real com Mercado Pago
2. ⏳ Adicionar Google Maps API para rotas
3. ⏳ Implementar WebSocket para chat em tempo real
4. ⏳ Adicionar testes automatizados
5. ⏳ Implementar CI/CD

## 📝 Licença

MIT

## 👨‍💻 Autor

Desenvolvido para UrbanRide - App de Mobilidade Urbana