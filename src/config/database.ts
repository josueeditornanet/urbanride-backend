import { Pool, Client } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT as string, 10) || 5432,
  user: process.env.DB_USER || 'urbanride',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'urbanride_db',
});

// Função para executar queries
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Função para obter um client (para transações)
export const getClient = async () => {
  return await pool.connect();
};