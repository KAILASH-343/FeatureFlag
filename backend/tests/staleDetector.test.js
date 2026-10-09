import { evaluateFlagStaleness } from '../src/services/staleDetector.js';

describe('Stale Flag Detection Engine', () => {
  const referenceTime = new Date('2026-09-21T12:00:00Z');

  test('Rule 1: Flag not used for >60 days is marked STALE with increased risk score', () => {
    const flag = {
      name: 'old-feature-test',
      status: 'ACTIVE',
      cleanup_status: 'REVIEW',
      created_at: new Date('2026-05-01T12:00:00Z'),
      updated_at: new Date('2026-08-01T12:00:00Z'),
      last_used_at: new Date('2026-07-01T12:00:00Z'), // ~82 days ago (>60 days)
      expiry_date: new Date('2026-12-01T12:00:00Z')
    };

    const evaluated = evaluateFlagStaleness(flag, referenceTime);
    expect(evaluated.stale_status).toBe('STALE');
    expect(evaluated.days_since_used).toBeGreaterThan(60);
    expect(evaluated.stale_score).toBeGreaterThanOrEqual(40);
    expect(evaluated.stale_reason_summary).toMatch(/60-day/);
  });

  test('Rule 2: Flag not modified for >90 days increases risk score', () => {
    const flagRecentlyUsed = {
      name: 'stagnant-config-flag',
      status: 'ACTIVE',
      cleanup_status: 'REVIEW',
      created_at: new Date('2026-04-01T12:00:00Z'),
      updated_at: new Date('2026-05-01T12:00:00Z'), // ~143 days ago (>90 days)
      last_used_at: new Date('2026-09-20T12:00:00Z'), // used yesterday
      expiry_date: null
    };

    const evaluated = evaluateFlagStaleness(flagRecentlyUsed, referenceTime);
    expect(evaluated.days_since_modified).toBeGreaterThan(90);
    expect(evaluated.stale_score).toBeGreaterThanOrEqual(25);
    expect(evaluated.stale_reason_summary).toMatch(/90-day threshold/);
  });

  test('Rule 3: Expiry date passed is marked EXPIRED', () => {
    const flag = {
      name: 'expired-marketing-campaign',
      status: 'INACTIVE',
      cleanup_status: 'CLEANUP_PENDING',
      created_at: new Date('2026-06-01T12:00:00Z'),
      updated_at: new Date('2026-08-01T12:00:00Z'),
      last_used_at: new Date('2026-08-01T12:00:00Z'),
      expiry_date: new Date('2026-09-01T12:00:00Z') // passed 20 days ago
    };

    const evaluated = evaluateFlagStaleness(flag, referenceTime);
    expect(evaluated.is_expired).toBe(true);
    expect(evaluated.stale_status).toBe('EXPIRED');
    expect(evaluated.days_expired).toBeGreaterThanOrEqual(20);
    expect(evaluated.risk_level).toBe('HIGH');
    expect(evaluated.suggested_cleanup).toBe('CLEANUP_PENDING');
  });

  test('Healthy flag: Active, recently used, not expired', () => {
    const flag = {
      name: 'live-payment-gateway',
      status: 'ACTIVE',
      cleanup_status: 'KEEP',
      created_at: new Date('2026-09-01T12:00:00Z'),
      updated_at: new Date('2026-09-20T12:00:00Z'),
      last_used_at: new Date('2026-09-21T10:00:00Z'), // 2 hours ago
      expiry_date: new Date('2026-11-01T12:00:00Z')
    };

    const evaluated = evaluateFlagStaleness(flag, referenceTime);
    expect(evaluated.stale_status).toBe('HEALTHY');
    expect(evaluated.stale_score).toBe(0);
    expect(evaluated.risk_level).toBe('LOW');
    expect(evaluated.suggested_cleanup).toBe('KEEP');
  });

  test('Cleanup recommendation never auto-deletes and respects KEEP safeguard', () => {
    const permanentFlag = {
      name: 'killswitch-emergency',
      status: 'ACTIVE',
      cleanup_status: 'KEEP',
      created_at: new Date('2025-01-01T12:00:00Z'),
      updated_at: new Date('2025-05-01T12:00:00Z'), // > 90 days modified
      last_used_at: new Date('2026-09-15T12:00:00Z'),
      expiry_date: null
    };

    const evaluated = evaluateFlagStaleness(permanentFlag, referenceTime);
    // Explicitly kept flags retain KEEP recommendation
    expect(evaluated.suggested_cleanup).toBe('KEEP');
  });
});
