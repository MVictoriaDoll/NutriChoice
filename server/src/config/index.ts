import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL as string,
  frontendBuildPath: path.join(__dirname, '..', '..', '..', 'client', 'dist'),
  nodeEnv: process.env.NODE_ENV || 'development',
  //Langchain Google integration
  googleApiKey: process.env.GOOGLE_API_KEY as string,
  geminiModelName: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash',
};

if (!config.databaseUrl) {
  console.error('FATAL ERROR: DATABASE_URL is not defined in .env');
  process.exit(1);
}

if (!config.googleApiKey) {
  console.error('FATAL ERROR: GOOGLE_API_KEY is not defined in .env. Required for AI processing.');
  process.exit(1);
}

if (!process.env.NODE_ENV) {
  console.warn('WARNING: NODE_ENV is not set. Defaulting to "development".');
}

export default config;
