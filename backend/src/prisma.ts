import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Si no existe DATABASE_URL explícita, se construye dinámicamente a partir de DB_HOST, DB_USER, etc.
export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : '';
  const database = process.env.DB_NAME || 'taller_mina';

  const authPart = password ? `${user}:${password}` : user;
  const url = `mysql://${authPart}@${host}:${port}/${database}`;
  process.env.DATABASE_URL = url;
  return url;
}

// Inicializar DATABASE_URL en process.env para que Prisma la reconozca
getDatabaseUrl();

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});
