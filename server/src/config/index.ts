import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({path: path.resolve(__dirname, '../../.env')});

const config ={
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL as string,
  frondendBuildPath: path.join(__dirname, '..','..','..','client', 'dist'),
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (!config.databaseUrl) {
  console.error('FATAL ERROR: DATABASE_URL is not defined in .env');
  process.exit(1);
}

if (!process.env.NODE_ENV) {
  console.warn('WARNING: NODE_ENV is not set. Defaulting to "development".');
}

export default config;