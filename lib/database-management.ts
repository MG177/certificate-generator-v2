import { getDatabase } from './mongodb';
import {
  runEmailMigrations,
  validateEmailDataIntegrity,
  cleanupOldEmailLogs,
} from './database-migrations';

/**
 * Database management utilities for email functionality
 */

export interface DatabaseStats {
  events: {
    total: number;
    withEmailConfig: number;
    withParticipants: number;
    withEmailEnabled: number;
  };
  emailLogs: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    bounced: number;
  };
  participants: {
    total: number;
    withEmails: number;
    withoutEmails: number;
    emailStatusCounts: Record<string, number>;
  };
}

/**
 * Get comprehensive database statistics
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');
    const emailLogsCollection = db.collection('emailLogs');

    // Events statistics
    const totalEvents = await eventsCollection.countDocuments();
    const eventsWithEmailConfig = await eventsCollection.countDocuments({
      emailConfig: { $exists: true },
    });
    const eventsWithParticipants = await eventsCollection.countDocuments({
      participants: { $exists: true, $not: { $size: 0 } },
    });
    const eventsWithEmailEnabled = await eventsCollection.countDocuments({
      'emailSettings.enabled': true,
    });

    // Email logs statistics
    const totalEmailLogs = await emailLogsCollection.countDocuments();
    const sentEmails = await emailLogsCollection.countDocuments({
      status: 'sent',
    });
    const failedEmails = await emailLogsCollection.countDocuments({
      status: 'failed',
    });
    const pendingEmails = await emailLogsCollection.countDocuments({
      status: 'pending',
    });
    const bouncedEmails = await emailLogsCollection.countDocuments({
      status: 'bounced',
    });

    // Participants statistics
    const participantsPipeline = [
      { $unwind: '$participants' },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withEmails: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$participants.email', ''] },
                    { $ne: ['$participants.email', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          withoutEmails: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$participants.email', ''] },
                    { $eq: ['$participants.email', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          emailStatusCounts: {
            $push: {
              $ifNull: ['$participants.emailStatus', 'not_sent'],
            },
          },
        },
      },
    ];

    const participantsResult = await eventsCollection
      .aggregate(participantsPipeline)
      .toArray();
    const participantsData = participantsResult[0] || {
      total: 0,
      withEmails: 0,
      withoutEmails: 0,
      emailStatusCounts: [],
    };

    // Count email statuses
    const emailStatusCounts: Record<string, number> = {};
    participantsData.emailStatusCounts.forEach((status: string) => {
      emailStatusCounts[status] = (emailStatusCounts[status] || 0) + 1;
    });

    return {
      events: {
        total: totalEvents,
        withEmailConfig: eventsWithEmailConfig,
        withParticipants: eventsWithParticipants,
        withEmailEnabled: eventsWithEmailEnabled,
      },
      emailLogs: {
        total: totalEmailLogs,
        sent: sentEmails,
        failed: failedEmails,
        pending: pendingEmails,
        bounced: bouncedEmails,
      },
      participants: {
        total: participantsData.total,
        withEmails: participantsData.withEmails,
        withoutEmails: participantsData.withoutEmails,
        emailStatusCounts,
      },
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw new Error('Failed to get database statistics');
  }
}

/**
 * Run database maintenance tasks
 */
export async function runDatabaseMaintenance(): Promise<{
  success: boolean;
  message: string;
  tasks: Array<{
    name: string;
    success: boolean;
    message: string;
    recordsAffected: number;
  }>;
}> {
  const tasks: Array<{
    name: string;
    success: boolean;
    message: string;
    recordsAffected: number;
  }> = [];

  try {
    const db = await getDatabase();

    // Task 1: Run email migrations
    try {
      const migrationResults = await runEmailMigrations(db);
      migrationResults.forEach((result) => {
        tasks.push({
          name: 'Email Migrations',
          success: result.success,
          message: result.message,
          recordsAffected: result.recordsUpdated,
        });
      });
    } catch (error) {
      tasks.push({
        name: 'Email Migrations',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        recordsAffected: 0,
      });
    }

    // Task 2: Clean up old email logs
    try {
      const cleanupResult = await cleanupOldEmailLogs(db, 90); // 90 days
      tasks.push({
        name: 'Cleanup Old Email Logs',
        success: cleanupResult.success,
        message: cleanupResult.message,
        recordsAffected: cleanupResult.recordsUpdated,
      });
    } catch (error) {
      tasks.push({
        name: 'Cleanup Old Email Logs',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        recordsAffected: 0,
      });
    }

    // Task 3: Validate data integrity
    try {
      const validationResult = await validateEmailDataIntegrity(db);
      tasks.push({
        name: 'Data Integrity Validation',
        success: validationResult.isValid,
        message: validationResult.isValid
          ? 'Data integrity check passed'
          : `Found ${validationResult.issues.length} issues`,
        recordsAffected: 0,
      });
    } catch (error) {
      tasks.push({
        name: 'Data Integrity Validation',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        recordsAffected: 0,
      });
    }

    const allTasksSuccessful = tasks.every((task) => task.success);
    const totalRecordsAffected = tasks.reduce(
      (sum, task) => sum + task.recordsAffected,
      0
    );

    return {
      success: allTasksSuccessful,
      message: `Maintenance completed. ${totalRecordsAffected} records affected.`,
      tasks,
    };
  } catch (error) {
    return {
      success: false,
      message: `Maintenance failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      tasks,
    };
  }
}

/**
 * Optimize database performance
 */
export async function optimizeDatabase(): Promise<{
  success: boolean;
  message: string;
  optimizations: Array<{
    name: string;
    success: boolean;
    message: string;
  }>;
}> {
  const optimizations: Array<{
    name: string;
    success: boolean;
    message: string;
  }> = [];

  try {
    const db = await getDatabase();

    // Optimization 1: Create missing indexes
    try {
      const eventsCollection = db.collection('events');
      const emailLogsCollection = db.collection('emailLogs');

      // Create compound indexes for common queries
      await eventsCollection.createIndex({
        'participants.emailStatus': 1,
        updatedAt: -1,
      });
      await emailLogsCollection.createIndex({
        eventId: 1,
        status: 1,
        createdAt: -1,
      });
      await emailLogsCollection.createIndex({ participantId: 1, status: 1 });

      optimizations.push({
        name: 'Create Performance Indexes',
        success: true,
        message: 'Performance indexes created successfully',
      });
    } catch (error) {
      optimizations.push({
        name: 'Create Performance Indexes',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Optimization 2: Analyze collection sizes
    try {
      const stats = await getDatabaseStats();
      const largeCollections = [];

      if (stats.emailLogs.total > 10000) {
        largeCollections.push('emailLogs');
      }
      if (stats.participants.total > 50000) {
        largeCollections.push('participants');
      }

      optimizations.push({
        name: 'Collection Size Analysis',
        success: true,
        message:
          largeCollections.length > 0
            ? `Large collections detected: ${largeCollections.join(', ')}`
            : 'All collections are within optimal size limits',
      });
    } catch (error) {
      optimizations.push({
        name: 'Collection Size Analysis',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    const allOptimizationsSuccessful = optimizations.every(
      (opt) => opt.success
    );

    return {
      success: allOptimizationsSuccessful,
      message: `Database optimization completed. ${optimizations.length} optimizations performed.`,
      optimizations,
    };
  } catch (error) {
    return {
      success: false,
      message: `Optimization failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      optimizations,
    };
  }
}
