import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z.string().trim().min(1).optional(),
  WEB_ORIGIN: z.string().trim().url().default('http://localhost:3000'),
  DATA_FILE: z.string().trim().min(1).optional(),
  DATA_BACKEND: z.enum(['json', 'mongodb']).optional(),
});

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  isProduction: boolean;
  port: number;
  dataFile: string;
  dataBackend: 'json' | 'mongodb';
  mongoUri?: string;
  mongoDb: string;
  webOrigins: string[];
  cookie: {
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    name: string;
    ttlHours: number;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuración de entorno inválida: ${detail}`);
  }
  const values = parsed.data;
  const dataBackend = values.DATA_BACKEND ?? (values.MONGODB_URI ? 'mongodb' : 'json');
  if (dataBackend === 'mongodb' && !values.MONGODB_URI) {
    throw new Error('MONGODB_URI es obligatorio para usar MongoDB');
  }
  const isProduction = values.NODE_ENV === 'production';
  return {
    nodeEnv: values.NODE_ENV,
    isProduction,
    port: values.PORT,
    dataFile: values.DATA_FILE
      ? path.resolve(values.DATA_FILE)
      : path.resolve(__dirname, '../../data/data.json'),
    dataBackend,
    mongoUri: values.MONGODB_URI,
    mongoDb: 'plaza_espana',
    webOrigins: [values.WEB_ORIGIN],
    cookie: {
      secure: isProduction,
      sameSite: 'lax',
      name: 'plaza_session',
      ttlHours: 12,
    },
  };
}
