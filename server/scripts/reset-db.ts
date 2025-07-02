import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// --- Environment Setup ---
// This allows you to specify whether to reset the 'development' or 'test' database.
const environment = process.argv[2] || 'development';
const envPath = environment === 'test' ? '.env.test' : '.env';

// Load the correct environment variables before doing anything else
dotenv.config({ path: path.resolve(process.cwd(), envPath) });

const prisma = new PrismaClient();

/**
 * The main function to reset the database.
 */
async function resetDatabase() {
  console.log(`Starting to reset the '${environment}' database...`);

  try {
    // Connect to the database
    await prisma.$connect();
    console.log(`Database connection established for '${environment}' database.`);

    // --- Deletion Order is Important ---
    // Delete records from dependent models first to avoid foreign key constraint issues.
    // The order should be: Item -> Receipt -> User-related summaries -> User.

    console.log('Deleting Item records...');
    await prisma.item.deleteMany({});

    console.log('Deleting Receipt records...');
    await prisma.receipt.deleteMany({});

    console.log('Deleting UserNutritionSummary records...');
    await prisma.userNutritionSummary.deleteMany({});

    console.log('Deleting GroceryList records...');
    await prisma.groceryList.deleteMany({});

    // Optional: Uncomment the following lines if you also want to delete all users.
    // Be careful with this in a development environment.
    console.log('Deleting User records...');
    await prisma.user.deleteMany({});

    console.log('✅ Database reset completed successfully.');

  } catch (error) {
    console.error('❌ An error occurred during the database reset:', error);
    process.exit(1); // Exit with an error code
  } finally {
    // --- Ensure the database connection is closed ---
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

// Run the reset function
resetDatabase();
