import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'feature_flags',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  timezone: '+00:00'
};

let pool = null;

export async function getPool() {
  if (!pool) {
    // First ensure the database exists
    try {
      const tempConn = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        connectTimeout: 5000
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
      await tempConn.end();
    } catch (err) {
      console.warn(`[DB] Database pre-check warning: ${err.message}`);
    }

    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function query(sql, params = []) {
  const p = await getPool();
  const [rows] = await p.query(sql, params);
  return rows;
}

export async function execute(sql, params = []) {
  const p = await getPool();
  const [result] = await p.execute(sql, params);
  return result;
}

/**
 * Initializes tables and seeds initial flags if empty
 */
export async function initDb() {
  try {
    const p = await getPool();

    // Create flags table
    await p.query(`
      CREATE TABLE IF NOT EXISTS flags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        owner VARCHAR(100) NOT NULL,
        environment ENUM('production', 'staging', 'development') DEFAULT 'production',
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        cleanup_status ENUM('KEEP', 'REVIEW', 'CLEANUP_PENDING') DEFAULT 'REVIEW',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_used_at DATETIME NULL,
        expiry_date DATETIME NULL,
        INDEX idx_environment (environment),
        INDEX idx_status (status),
        INDEX idx_cleanup (cleanup_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create flag_audit_logs table
    await p.query(`
      CREATE TABLE IF NOT EXISTS flag_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flag_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        actor VARCHAR(100) DEFAULT 'system',
        old_value TEXT NULL,
        new_value TEXT NULL,
        details TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (flag_id) REFERENCES flags(id) ON DELETE CASCADE,
        INDEX idx_flag_id (flag_id),
        INDEX idx_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check count of flags
    const [counts] = await p.query('SELECT COUNT(*) as count FROM flags');
    if (counts[0].count === 0) {
      console.log('[DB] No flags found in database. Seeding realistic dataset...');
      await resetSeeds();
    } else {
      console.log(`[DB] Database ready with ${counts[0].count} flags.`);
    }

    return true;
  } catch (error) {
    console.error('[DB] Database initialization error:', error.message);
    throw error;
  }
}

/**
 * Reset and reload 10 realistic seed flags with audit logs
 */
export async function resetSeeds() {
  const p = await getPool();
  
  // Disable FK check and clear
  await p.query('SET FOREIGN_KEY_CHECKS = 0');
  await p.query('TRUNCATE TABLE flag_audit_logs');
  await p.query('TRUNCATE TABLE flags');
  await p.query('SET FOREIGN_KEY_CHECKS = 1');

  // Insert 10 realistic flags
  const insertFlagsSql = `
    INSERT INTO flags (id, name, description, owner, environment, status, cleanup_status, created_at, updated_at, last_used_at, expiry_date)
    VALUES
    (
      1,
      'checkout-v2-redesign',
      'Multi-step checkout revamp with address autocompletion and simplified one-click pay',
      'alex.miller@company.com',
      'production',
      'ACTIVE',
      'CLEANUP_PENDING',
      DATE_SUB(NOW(), INTERVAL 120 DAY),
      DATE_SUB(NOW(), INTERVAL 95 DAY),
      DATE_SUB(NOW(), INTERVAL 95 DAY),
      DATE_SUB(NOW(), INTERVAL 10 DAY)
    ),
    (
      2,
      'new-payment-stripe',
      'Stripe Elements integration replacing legacy payment gateway API',
      'sarah.chen@company.com',
      'production',
      'ACTIVE',
      'KEEP',
      DATE_SUB(NOW(), INTERVAL 45 DAY),
      DATE_SUB(NOW(), INTERVAL 5 DAY),
      DATE_SUB(NOW(), INTERVAL 2 DAY),
      DATE_ADD(NOW(), INTERVAL 60 DAY)
    ),
    (
      3,
      'summer-promo-banner-2025',
      'Seasonal promotional banner displayed on homepage and search results',
      'marketing.lead@company.com',
      'staging',
      'INACTIVE',
      'CLEANUP_PENDING',
      DATE_SUB(NOW(), INTERVAL 100 DAY),
      DATE_SUB(NOW(), INTERVAL 40 DAY),
      DATE_SUB(NOW(), INTERVAL 40 DAY),
      DATE_SUB(NOW(), INTERVAL 35 DAY)
    ),
    (
      4,
      'killswitch-sms-twilio',
      'Emergency circuit breaker to bypass Twilio SMS and fallback to email verification',
      'devops-core@company.com',
      'production',
      'ACTIVE',
      'KEEP',
      DATE_SUB(NOW(), INTERVAL 200 DAY),
      DATE_SUB(NOW(), INTERVAL 110 DAY),
      DATE_SUB(NOW(), INTERVAL 8 DAY),
      NULL
    ),
    (
      5,
      'beta-ai-search',
      'Vector embeddings search endpoint for product catalog semantic matching',
      'data-platform@company.com',
      'staging',
      'ACTIVE',
      'REVIEW',
      DATE_SUB(NOW(), INTERVAL 110 DAY),
      DATE_SUB(NOW(), INTERVAL 92 DAY),
      DATE_SUB(NOW(), INTERVAL 72 DAY),
      DATE_ADD(NOW(), INTERVAL 30 DAY)
    ),
    (
      6,
      'user-onboarding-v4',
      'Interactive product tour modal for newly registered enterprise users',
      'growth-team@company.com',
      'production',
      'ACTIVE',
      'KEEP',
      DATE_SUB(NOW(), INTERVAL 30 DAY),
      DATE_SUB(NOW(), INTERVAL 8 DAY),
      DATE_SUB(NOW(), INTERVAL 1 DAY),
      DATE_ADD(NOW(), INTERVAL 90 DAY)
    ),
    (
      7,
      'legacy-csv-exporter',
      'Old synchronous background worker CSV export (deprecated in favor of S3 pre-signed links)',
      'backend-guild@company.com',
      'production',
      'INACTIVE',
      'CLEANUP_PENDING',
      DATE_SUB(NOW(), INTERVAL 180 DAY),
      DATE_SUB(NOW(), INTERVAL 150 DAY),
      DATE_SUB(NOW(), INTERVAL 145 DAY),
      DATE_SUB(NOW(), INTERVAL 60 DAY)
    ),
    (
      8,
      'debug-telemetry-logs',
      'Verbose SQL query and network tracing header injector for development debugging',
      'jordan.lee@company.com',
      'development',
      'INACTIVE',
      'REVIEW',
      DATE_SUB(NOW(), INTERVAL 90 DAY),
      DATE_SUB(NOW(), INTERVAL 85 DAY),
      DATE_SUB(NOW(), INTERVAL 85 DAY),
      NULL
    ),
    (
      9,
      'dark-mode-global',
      'OLED dark theme toggle across web application and customer dashboard',
      'ui-team@company.com',
      'production',
      'ACTIVE',
      'REVIEW',
      DATE_SUB(NOW(), INTERVAL 25 DAY),
      DATE_SUB(NOW(), INTERVAL 15 DAY),
      DATE_SUB(NOW(), INTERVAL 3 DAY),
      DATE_ADD(NOW(), INTERVAL 45 DAY)
    ),
    (
      10,
      'graphql-caching-v1',
      'Response caching on GraphQL query gateway using normalized schema entities',
      'api-infra@company.com',
      'development',
      'ACTIVE',
      'REVIEW',
      DATE_SUB(NOW(), INTERVAL 12 DAY),
      DATE_SUB(NOW(), INTERVAL 2 DAY),
      DATE_SUB(NOW(), INTERVAL 1 HOUR),
      DATE_ADD(NOW(), INTERVAL 120 DAY)
    )
  `;
  await p.query(insertFlagsSql);

  // Insert audit records
  const insertLogsSql = `
    INSERT INTO flag_audit_logs (flag_id, action, actor, old_value, new_value, details, created_at)
    VALUES
    (1, 'FLAG_CREATED', 'alex.miller@company.com', NULL, 'ACTIVE', 'Flag created for multi-step checkout rollout', DATE_SUB(NOW(), INTERVAL 120 DAY)),
    (1, 'CONFIG_UPDATED', 'alex.miller@company.com', '50% rollout', '100% rollout', 'Increased traffic to 100% in production', DATE_SUB(NOW(), INTERVAL 95 DAY)),
    (1, 'CLEANUP_STATUS_CHANGED', 'system', 'REVIEW', 'CLEANUP_PENDING', 'Marked for cleanup recommendation: stale > 60 days', DATE_SUB(NOW(), INTERVAL 10 DAY)),

    (2, 'FLAG_CREATED', 'sarah.chen@company.com', NULL, 'ACTIVE', 'Initialized Stripe payment integration', DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (2, 'USAGE_PING', 'checkout-service', NULL, NULL, 'Evaluated by checkout service in production', DATE_SUB(NOW(), INTERVAL 2 DAY)),

    (3, 'FLAG_CREATED', 'marketing.lead@company.com', NULL, 'ACTIVE', 'Seasonal promo banner campaign', DATE_SUB(NOW(), INTERVAL 100 DAY)),
    (3, 'STATUS_TOGGLED', 'marketing.lead@company.com', 'ACTIVE', 'INACTIVE', 'Deactivated after campaign finished', DATE_SUB(NOW(), INTERVAL 40 DAY)),
    (3, 'CLEANUP_STATUS_CHANGED', 'system', 'REVIEW', 'CLEANUP_PENDING', 'Marked for cleanup: expiry date passed', DATE_SUB(NOW(), INTERVAL 35 DAY)),

    (4, 'FLAG_CREATED', 'devops-core@company.com', NULL, 'ACTIVE', 'Created operational killswitch for Twilio', DATE_SUB(NOW(), INTERVAL 200 DAY)),
    (4, 'CLEANUP_STATUS_CHANGED', 'devops-core@company.com', 'REVIEW', 'KEEP', 'Configured as permanent operational safeguard', DATE_SUB(NOW(), INTERVAL 110 DAY)),

    (5, 'FLAG_CREATED', 'data-platform@company.com', NULL, 'ACTIVE', 'Staging test for semantic search vector embeddings', DATE_SUB(NOW(), INTERVAL 110 DAY)),

    (6, 'FLAG_CREATED', 'growth-team@company.com', NULL, 'ACTIVE', 'Created onboarding v4 walkthrough flow', DATE_SUB(NOW(), INTERVAL 30 DAY)),
    (6, 'USAGE_PING', 'web-client', NULL, NULL, 'Evaluated during new user sign-in', DATE_SUB(NOW(), INTERVAL 1 DAY)),

    (7, 'FLAG_CREATED', 'backend-guild@company.com', NULL, 'ACTIVE', 'Legacy export worker flag', DATE_SUB(NOW(), INTERVAL 180 DAY)),
    (7, 'STATUS_TOGGLED', 'backend-guild@company.com', 'ACTIVE', 'INACTIVE', 'Flag deactivated after S3 async migrator deployed', DATE_SUB(NOW(), INTERVAL 150 DAY)),
    (7, 'CLEANUP_STATUS_CHANGED', 'system', 'REVIEW', 'CLEANUP_PENDING', 'Marked for cleanup: inactive > 140 days and expired', DATE_SUB(NOW(), INTERVAL 60 DAY)),

    (8, 'FLAG_CREATED', 'jordan.lee@company.com', NULL, 'ACTIVE', 'Dev environment SQL trace flag', DATE_SUB(NOW(), INTERVAL 90 DAY)),
    (8, 'STATUS_TOGGLED', 'jordan.lee@company.com', 'ACTIVE', 'INACTIVE', 'Deactivated telemetry in dev', DATE_SUB(NOW(), INTERVAL 85 DAY)),

    (9, 'FLAG_CREATED', 'ui-team@company.com', NULL, 'ACTIVE', 'Global dark mode roll out flag', DATE_SUB(NOW(), INTERVAL 25 DAY)),
    (9, 'USAGE_PING', 'web-app', NULL, NULL, 'Evaluated by user theme preference service', DATE_SUB(NOW(), INTERVAL 3 DAY)),

    (10, 'FLAG_CREATED', 'api-infra@company.com', NULL, 'ACTIVE', 'GraphQL caching layer test', DATE_SUB(NOW(), INTERVAL 12 DAY)),
    (10, 'USAGE_PING', 'api-gateway', NULL, NULL, 'Evaluated by API gateway', DATE_SUB(NOW(), INTERVAL 1 HOUR))
  `;
  await p.query(insertLogsSql);

  console.log('[DB] Database seeded successfully with 10 realistic flags and audit history.');
  return true;
}
