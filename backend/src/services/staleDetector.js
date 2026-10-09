/**
 * Stale Flag Detection Engine
 * 
 * Rules applied:
 * 1. Last used > 60 days -> STALE (+40 risk points)
 * 2. Last modified > 90 days -> Increase risk (+25 risk points)
 * 3. Expiry date passed -> EXPIRED (+50 risk points)
 * 4. Inactive status -> (+15 risk points)
 * 5. Generates human-readable reason & risk score (0-100)
 */

export function evaluateFlagStaleness(flag, referenceTime = new Date()) {
  const now = new Date(referenceTime).getTime();

  const createdTime = flag.created_at ? new Date(flag.created_at).getTime() : now;
  const updatedTime = flag.updated_at ? new Date(flag.updated_at).getTime() : createdTime;
  const lastUsedTime = flag.last_used_at ? new Date(flag.last_used_at).getTime() : createdTime;
  const expiryTime = flag.expiry_date ? new Date(flag.expiry_date).getTime() : null;

  const msInDay = 1000 * 60 * 60 * 24;

  const daysSinceUsed = Math.max(0, Math.floor((now - lastUsedTime) / msInDay));
  const daysSinceModified = Math.max(0, Math.floor((now - updatedTime) / msInDay));
  const daysSinceCreated = Math.max(0, Math.floor((now - createdTime) / msInDay));

  const isExpired = expiryTime ? now > expiryTime : false;
  const daysExpired = isExpired ? Math.max(1, Math.floor((now - expiryTime) / msInDay)) : 0;
  const daysUntilExpiry = (!isExpired && expiryTime) ? Math.max(0, Math.ceil((expiryTime - now) / msInDay)) : null;

  let score = 0;
  const reasons = [];
  let staleStatus = 'HEALTHY';

  // Rule 1: Expiry date passed
  if (isExpired) {
    staleStatus = 'EXPIRED';
    score += 50;
    reasons.push(`Target expiry date passed by ${daysExpired} day${daysExpired === 1 ? '' : 's'}`);
  }

  // Rule 2: Last used > 60 days -> STALE
  if (daysSinceUsed > 60) {
    if (staleStatus !== 'EXPIRED') {
      staleStatus = 'STALE';
    }
    score += 40;
    reasons.push(`Not used/evaluated for ${daysSinceUsed} days (exceeds 60-day threshold)`);

    if (daysSinceUsed > 120) {
      score += 15;
      reasons.push(`Severe inactivity: over 120 days since last evaluation`);
    }
  }

  // Rule 3: Last modified > 90 days -> Increase risk
  if (daysSinceModified > 90) {
    score += 25;
    reasons.push(`Configuration unchanged for ${daysSinceModified} days (exceeds 90-day threshold)`);
  }

  // Factor: Flag status is INACTIVE
  if (flag.status === 'INACTIVE') {
    score += 10;
    reasons.push(`Flag is currently disabled (INACTIVE) in ${flag.environment || 'environment'}`);
  }

  // If completely healthy
  if (reasons.length === 0) {
    reasons.push(`Flag active and used recently (${daysSinceUsed === 0 ? 'today' : `${daysSinceUsed} day${daysSinceUsed === 1 ? '' : 's'} ago`}). Operating normally.`);
  }

  const staleScore = Math.min(100, Math.max(0, score));

  let riskLevel = 'LOW';
  if (staleScore >= 70 || staleStatus === 'EXPIRED') {
    riskLevel = 'HIGH';
  } else if (staleScore >= 35 || staleStatus === 'STALE') {
    riskLevel = 'MEDIUM';
  }

  // Suggested cleanup action (Never auto-deletes)
  let suggestedCleanup = 'KEEP';
  if (flag.cleanup_status === 'KEEP') {
    suggestedCleanup = 'KEEP';
  } else if (staleStatus === 'EXPIRED' || (staleStatus === 'STALE' && daysSinceUsed > 90)) {
    suggestedCleanup = 'CLEANUP_PENDING';
  } else if (staleStatus === 'STALE' || daysSinceModified > 90) {
    suggestedCleanup = 'REVIEW';
  } else {
    suggestedCleanup = 'KEEP';
  }

  return {
    ...flag,
    days_since_used: daysSinceUsed,
    days_since_modified: daysSinceModified,
    days_since_created: daysSinceCreated,
    is_expired: isExpired,
    days_expired: daysExpired,
    days_until_expiry: daysUntilExpiry,
    stale_status: staleStatus,
    stale_score: staleScore,
    risk_level: riskLevel,
    stale_reasons: reasons,
    stale_reason_summary: reasons.join(' • '),
    suggested_cleanup: suggestedCleanup
  };
}
