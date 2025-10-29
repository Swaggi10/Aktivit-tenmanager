import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  frontendUrl: string;
  corsOrigins: string[];
  azure: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    redirectUri: string;
  };
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const config: EnvConfig = {
  port: parseInt(getEnv('PORT', '4000'), 10),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  databaseUrl: getEnv('DATABASE_URL'),
  jwtSecret: getEnv('JWT_SECRET'),
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:3000'),
  corsOrigins: getEnv('CORS_ORIGINS', 'http://localhost:3000').split(','),
  azure: {
    clientId: getEnv('AZURE_CLIENT_ID', ''),
    clientSecret: getEnv('AZURE_CLIENT_SECRET', ''),
    tenantId: getEnv('AZURE_TENANT_ID', ''),
    redirectUri: getEnv('AZURE_REDIRECT_URI', 'http://localhost:4000/auth/microsoft/callback'),
  },
};

export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development';
