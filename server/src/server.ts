import app from './app';
import config from './config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


// --- Connect to Database ---
const connectToDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB.', error);
    process.exit(1);
  }
};


// --- Start the Server ---
const startServer = async() => {
  await connectToDatabase();

  const server = app.listen(config.port, () => {
    console.log (`🛰 Server running on http://localhost:${config.port} in ${config.nodeEnv} mode`);
    console.log (`Serving frontend from: ${config.frontendBuildPath}`);
  })

  // --- Shutdown the Server ---
  process.on('SIGTERM', async () => {
    console.log('👋 SIGTERM signal received: Closing HTTP server ...');
    server.close( async () => {
      console.log('HTTP server closed.');
      await prisma.$disconnect();
      console.log('Prisma disconnected.');
      process.exit(0); //Exit successfull
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason: ', reason);
  })

  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception: ', error);
    process.exit(1);
  })
};

startServer();




