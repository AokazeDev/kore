import 'dotenv/config';
import { z } from 'zod';

interface EnvVars {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  // CORS
  BACKEND_URL?: string;
  CORS_ORIGIN?: string;

  // Database
  DATABASE_URL: string;

  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;

  // Auth (Better Auth Secret)
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;

  // Google OAuth
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;

  // Microsoft OAuth
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;

  // Riot OAuth
  RIOT_CLIENT_ID?: string;
  RIOT_CLIENT_SECRET?: string;

  // Epic Games OAuth
  EPIC_GAMES_CLIENT_ID?: string;
  EPIC_GAMES_CLIENT_SECRET?: string;

  // AWS (LocalStack)
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_ENDPOINT?: string;
}

const envsSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // CORS
  BACKEND_URL: z.url().optional(),
  CORS_ORIGIN: z.string().optional(),

  // Database
  DATABASE_URL: z.url(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  // Auth (Better Auth Secret)
  BETTER_AUTH_SECRET: z.string().min(10),
  BETTER_AUTH_URL: z.url(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Microsoft OAuth
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),

  // Riot OAuth
  RIOT_CLIENT_ID: z.string().optional(),
  RIOT_CLIENT_SECRET: z.string().optional(),

  // Epic Games OAuth
  EPIC_GAMES_CLIENT_ID: z.string().optional(),
  EPIC_GAMES_CLIENT_SECRET: z.string().optional(),

  // AWS (LocalStack)
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_S3_ENDPOINT: z.url().optional(), // http://localhost:4566
});

const result = envsSchema.safeParse({
  ...process.env,
});

if (!result.success) {
  throw new Error(`Config validation error: ${result.error.message}`);
}

const envVars: EnvVars = result.data;

export const envs = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  cors: {
    origin: envVars.CORS_ORIGIN
      ? envVars.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : undefined,
  },
  backendUrl: envVars.BACKEND_URL,
  databaseUrl: envVars.DATABASE_URL,
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
  },
  auth: {
    secret: envVars.BETTER_AUTH_SECRET,
    url: envVars.BETTER_AUTH_URL,
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
    },
    microsoft: {
      clientId: envVars.MICROSOFT_CLIENT_ID,
      clientSecret: envVars.MICROSOFT_CLIENT_SECRET,
    },
    riot: {
      clientId: envVars.RIOT_CLIENT_ID,
      clientSecret: envVars.RIOT_CLIENT_SECRET,
    },
    epicGames: {
      clientId: envVars.EPIC_GAMES_CLIENT_ID,
      clientSecret: envVars.EPIC_GAMES_CLIENT_SECRET,
    },
  },
  aws: {
    region: envVars.AWS_REGION,
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    s3Endpoint: envVars.AWS_S3_ENDPOINT,
  },
};
