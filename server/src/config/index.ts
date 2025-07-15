import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL as string,
  frontendBuildPath: path.join(__dirname, '..', '..', '..', 'client', 'dist'),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Langchain Google integration
  googleApiKey: process.env.GOOGLE_API_KEY as string,
  geminiModelName: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash',

  // Auth0 config
  auth0Domain: process.env.AUTH0_DOMAIN as string,
  auth0Audience: process.env.AUTH0_AUDIENCE as string,
}

if (!config.databaseUrl) {
  console.error('FATAL ERROR: DATABASE_URL is not defined in .env')
  process.exit(1)
}

if (!config.googleApiKey) {
  console.error('FATAL ERROR: GOOGLE_API_KEY is not defined in .env. Required for AI processing.')
  process.exit(1)
}


if (!config.auth0Domain) {
  console.error('FATAL ERROR: AUTH0_DOMAIN is not defined in .env')
  process.exit(1)
}
if (!config.auth0Audience) {
  console.error('FATAL ERROR: AUTH0_AUDIENCE is not defined in .env')
  process.exit(1)
}

if (!process.env.NODE_ENV) {
  console.warn('WARNING: NODE_ENV is not set. Defaulting to "development".')
}

export default config

export const auth0Audience = config.auth0Audience;
export const auth0Domain   = config.auth0Domain;