-- Database initialization script for Feature Flag Lifecycle System
CREATE DATABASE IF NOT EXISTS feature_flags;
USE feature_flags;

-- Flags table
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

-- Flag Audit Logs table
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

-- Truncate existing data to allow clean re-seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE flag_audit_logs;
TRUNCATE TABLE flags;
SET FOREIGN_KEY_CHECKS = 1;

-- 10 Realistic Feature Flags with varying states
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
);

-- Initial audit logs for the seeded flags
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
(10, 'USAGE_PING', 'api-gateway', NULL, NULL, 'Evaluated by API gateway', DATE_SUB(NOW(), INTERVAL 1 HOUR));
