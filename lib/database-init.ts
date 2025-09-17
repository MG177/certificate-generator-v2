import { getDatabase } from './mongodb';
import {
  runEmailMigrations,
  validateEmailDataIntegrity,
} from './database-migrations';

/**
 * Initialize database with email functionality
 * This should be called when the application starts
 */
export async function initializeEmailDatabase(): Promise<{
  success: boolean;
  message: string;
  migrations: any[];
  validation: any;
}> {
  try {
    console.log('Initializing email database functionality...');

    const db = await getDatabase();

    // Run email migrations
    console.log('Running email migrations...');
    const migrationResults = await runEmailMigrations(db);

    // Validate data integrity
    console.log('Validating email data integrity...');
    const validationResult = await validateEmailDataIntegrity(db);

    // Check if all migrations were successful
    const allMigrationsSuccessful = migrationResults.every(
      (result) => result.success
    );

    if (allMigrationsSuccessful) {
      console.log('✅ Email database initialization completed successfully');
      return {
        success: true,
        message: 'Email database initialized successfully',
        migrations: migrationResults,
        validation: validationResult,
      };
    } else {
      console.error('❌ Some email migrations failed');
      return {
        success: false,
        message: 'Email database initialization completed with errors',
        migrations: migrationResults,
        validation: validationResult,
      };
    }
  } catch (error) {
    console.error('❌ Email database initialization failed:', error);
    return {
      success: false,
      message: `Email database initialization failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      migrations: [],
      validation: {
        isValid: false,
        issues: ['Initialization failed'],
        recommendations: [],
      },
    };
  }
}

/**
 * Check if email functionality is properly set up
 */
export async function checkEmailDatabaseSetup(): Promise<{
  isSetup: boolean;
  issues: string[];
  recommendations: string[];
}> {
  try {
    const db = await getDatabase();

    // Check if email logs collection exists
    const collections = await db.listCollections().toArray();
    const hasEmailLogs = collections.some((col) => col.name === 'emailLogs');

    if (!hasEmailLogs) {
      return {
        isSetup: false,
        issues: ['Email logs collection does not exist'],
        recommendations: [
          'Run database migrations to create email logs collection',
        ],
      };
    }

    // Validate data integrity
    const validation = await validateEmailDataIntegrity(db);

    return {
      isSetup: validation.isValid,
      issues: validation.issues,
      recommendations: validation.recommendations,
    };
  } catch (error) {
    return {
      isSetup: false,
      issues: [
        `Database check failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      ],
      recommendations: ['Check database connection and try again'],
    };
  }
}
