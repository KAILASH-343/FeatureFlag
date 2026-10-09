import { query, execute, resetSeeds as dbResetSeeds } from '../db/db.js';
import { evaluateFlagStaleness } from '../services/staleDetector.js';

export async function getAllFlags(req, res) {
  try {
    const { search, environment, status, stale_status, cleanup_status } = req.query;

    let sql = 'SELECT * FROM flags ORDER BY created_at DESC';
    const rows = await query(sql);

    // Compute staleness dynamically for every flag
    let evaluatedFlags = rows.map(f => evaluateFlagStaleness(f));

    // In-memory / dynamic filtering
    if (search) {
      const q = search.toLowerCase();
      evaluatedFlags = evaluatedFlags.filter(f => 
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (f.owner && f.owner.toLowerCase().includes(q))
      );
    }

    if (environment && environment !== 'all') {
      evaluatedFlags = evaluatedFlags.filter(f => f.environment === environment);
    }

    if (status && status !== 'all') {
      evaluatedFlags = evaluatedFlags.filter(f => f.status === status);
    }

    if (stale_status && stale_status !== 'all') {
      evaluatedFlags = evaluatedFlags.filter(f => f.stale_status === stale_status);
    }

    if (cleanup_status && cleanup_status !== 'all') {
      evaluatedFlags = evaluatedFlags.filter(f => f.cleanup_status === cleanup_status);
    }

    res.json(evaluatedFlags);
  } catch (err) {
    console.error('Error fetching flags:', err);
    res.status(500).json({ error: 'Failed to retrieve feature flags', details: err.message });
  }
}

export async function getFlagById(req, res) {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM flags WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Feature flag not found' });
    }

    const flag = evaluateFlagStaleness(rows[0]);

    // Fetch audit trail
    const auditLogs = await query(
      'SELECT * FROM flag_audit_logs WHERE flag_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({
      flag,
      audit_logs: auditLogs
    });
  } catch (err) {
    console.error('Error fetching flag details:', err);
    res.status(500).json({ error: 'Failed to retrieve flag details', details: err.message });
  }
}

export async function createFlag(req, res) {
  try {
    const { name, description, owner, environment = 'production', status = 'ACTIVE', expiry_date, cleanup_status = 'REVIEW' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Flag name is required' });
    }
    if (!owner || !owner.trim()) {
      return res.status(400).json({ error: 'Flag owner is required' });
    }

    // Check duplicate name
    const existing = await query('SELECT id FROM flags WHERE name = ?', [name.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: `Flag name "${name.trim()}" already exists` });
    }

    const sql = `
      INSERT INTO flags (name, description, owner, environment, status, cleanup_status, last_used_at, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
    `;
    const expiryVal = expiry_date ? new Date(expiry_date) : null;
    const result = await execute(sql, [
      name.trim(),
      description || null,
      owner.trim(),
      environment,
      status,
      cleanup_status,
      expiryVal
    ]);

    const newFlagId = result.insertId;

    // Record audit log
    await execute(
      `INSERT INTO flag_audit_logs (flag_id, action, actor, old_value, new_value, details)
       VALUES (?, 'FLAG_CREATED', ?, NULL, ?, ?)`,
      [
        newFlagId,
        owner.trim(),
        status,
        `Created flag "${name.trim()}" in ${environment} environment`
      ]
    );

    const [created] = await query('SELECT * FROM flags WHERE id = ?', [newFlagId]);
    res.status(201).json(evaluateFlagStaleness(created));
  } catch (err) {
    console.error('Error creating flag:', err);
    res.status(500).json({ error: 'Failed to create feature flag', details: err.message });
  }
}

export async function updateFlag(req, res) {
  try {
    const { id } = req.params;
    const { description, owner, environment, expiry_date, cleanup_status } = req.body;

    const [current] = await query('SELECT * FROM flags WHERE id = ?', [id]);
    if (!current) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    const expiryVal = expiry_date !== undefined ? (expiry_date ? new Date(expiry_date) : null) : current.expiry_date;
    const descVal = description !== undefined ? description : current.description;
    const ownerVal = owner !== undefined ? owner.trim() : current.owner;
    const envVal = environment !== undefined ? environment : current.environment;
    const cleanupVal = cleanup_status !== undefined ? cleanup_status : current.cleanup_status;

    await execute(
      `UPDATE flags SET description = ?, owner = ?, environment = ?, expiry_date = ?, cleanup_status = ? WHERE id = ?`,
      [descVal, ownerVal, envVal, expiryVal, cleanupVal, id]
    );

    // Audit log
    await execute(
      `INSERT INTO flag_audit_logs (flag_id, action, actor, old_value, new_value, details)
       VALUES (?, 'CONFIG_UPDATED', ?, ?, ?, ?)`,
      [
        id,
        ownerVal || 'system',
        JSON.stringify({ owner: current.owner, env: current.environment }),
        JSON.stringify({ owner: ownerVal, env: envVal }),
        'Updated flag configuration parameters'
      ]
    );

    const [updated] = await query('SELECT * FROM flags WHERE id = ?', [id]);
    res.json(evaluateFlagStaleness(updated));
  } catch (err) {
    console.error('Error updating flag:', err);
    res.status(500).json({ error: 'Failed to update feature flag', details: err.message });
  }
}

export async function toggleFlag(req, res) {
  try {
    const { id } = req.params;
    const [flag] = await query('SELECT * FROM flags WHERE id = ?', [id]);

    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    const nextStatus = flag.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    await execute('UPDATE flags SET status = ? WHERE id = ?', [nextStatus, id]);

    // Record audit log
    await execute(
      `INSERT INTO flag_audit_logs (flag_id, action, actor, old_value, new_value, details)
       VALUES (?, 'STATUS_TOGGLED', ?, ?, ?, ?)`,
      [
        id,
        req.body.actor || 'admin@company.com',
        flag.status,
        nextStatus,
        `Flag state switched to ${nextStatus}`
      ]
    );

    const [updated] = await query('SELECT * FROM flags WHERE id = ?', [id]);
    res.json(evaluateFlagStaleness(updated));
  } catch (err) {
    console.error('Error toggling flag status:', err);
    res.status(500).json({ error: 'Failed to toggle flag status', details: err.message });
  }
}

export async function updateCleanupStatus(req, res) {
  try {
    const { id } = req.params;
    const { cleanup_status, actor = 'reviewer@company.com', note } = req.body;

    const validStatuses = ['KEEP', 'REVIEW', 'CLEANUP_PENDING'];
    if (!validStatuses.includes(cleanup_status)) {
      return res.status(400).json({ error: `Invalid cleanup status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const [flag] = await query('SELECT * FROM flags WHERE id = ?', [id]);
    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    const oldStatus = flag.cleanup_status;
    await execute('UPDATE flags SET cleanup_status = ? WHERE id = ?', [cleanup_status, id]);

    // Record audit log
    await execute(
      `INSERT INTO flag_audit_logs (flag_id, action, actor, old_value, new_value, details)
       VALUES (?, 'CLEANUP_STATUS_CHANGED', ?, ?, ?, ?)`,
      [
        id,
        actor,
        oldStatus,
        cleanup_status,
        note || `Cleanup recommendation set to ${cleanup_status}`
      ]
    );

    const [updated] = await query('SELECT * FROM flags WHERE id = ?', [id]);
    res.json(evaluateFlagStaleness(updated));
  } catch (err) {
    console.error('Error updating cleanup status:', err);
    res.status(500).json({ error: 'Failed to update cleanup status', details: err.message });
  }
}

export async function simulateUsage(req, res) {
  try {
    const { id } = req.params;
    const { service = 'client-application', actor = 'runtime-evaluator' } = req.body;

    const [flag] = await query('SELECT * FROM flags WHERE id = ?', [id]);
    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    const previousUsedAt = flag.last_used_at;

    // Touch last_used_at to current timestamp
    await execute('UPDATE flags SET last_used_at = NOW() WHERE id = ?', [id]);

    // Record usage ping in audit trail
    await execute(
      `INSERT INTO flag_audit_logs (flag_id, action, actor, old_value, new_value, details)
       VALUES (?, 'USAGE_PING', ?, ?, 'NOW()', ?)`,
      [
        id,
        actor,
        previousUsedAt ? new Date(previousUsedAt).toISOString() : 'never',
        `Simulated flag evaluation by service: ${service}. Resets staleness calculation.`
      ]
    );

    const [updated] = await query('SELECT * FROM flags WHERE id = ?', [id]);
    res.json(evaluateFlagStaleness(updated));
  } catch (err) {
    console.error('Error simulating flag usage:', err);
    res.status(500).json({ error: 'Failed to simulate usage', details: err.message });
  }
}

export async function deleteFlag(req, res) {
  try {
    const { id } = req.params;
    const [flag] = await query('SELECT * FROM flags WHERE id = ?', [id]);

    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    // Deleting flag triggers cascade deletion of flag_audit_logs in schema
    await execute('DELETE FROM flags WHERE id = ?', [id]);

    res.json({ success: true, message: `Flag "${flag.name}" deleted successfully` });
  } catch (err) {
    console.error('Error deleting flag:', err);
    res.status(500).json({ error: 'Failed to delete flag', details: err.message });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const flags = await query('SELECT * FROM flags');
    const evaluated = flags.map(f => evaluateFlagStaleness(f));

    const total = evaluated.length;
    const active = evaluated.filter(f => f.status === 'ACTIVE').length;
    const inactive = evaluated.filter(f => f.status === 'INACTIVE').length;
    const stale = evaluated.filter(f => f.stale_status === 'STALE').length;
    const expired = evaluated.filter(f => f.stale_status === 'EXPIRED').length;
    const healthy = evaluated.filter(f => f.stale_status === 'HEALTHY').length;

    const cleanup_pending = evaluated.filter(f => f.cleanup_status === 'CLEANUP_PENDING').length;
    const review_needed = evaluated.filter(f => f.cleanup_status === 'REVIEW').length;
    const keep = evaluated.filter(f => f.cleanup_status === 'KEEP').length;

    const risk_distribution = {
      low: evaluated.filter(f => f.risk_level === 'LOW').length,
      medium: evaluated.filter(f => f.risk_level === 'MEDIUM').length,
      high: evaluated.filter(f => f.risk_level === 'HIGH').length
    };

    const environment_distribution = {
      production: evaluated.filter(f => f.environment === 'production').length,
      staging: evaluated.filter(f => f.environment === 'staging').length,
      development: evaluated.filter(f => f.environment === 'development').length
    };

    // Fetch recent audit logs with flag name
    const recent_activity = await query(`
      SELECT 
        l.id, l.flag_id, l.action, l.actor, l.details, l.created_at,
        f.name as flag_name, f.environment
      FROM flag_audit_logs l
      LEFT JOIN flags f ON l.flag_id = f.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    // Top stale/expired flags requiring attention
    const flags_requiring_attention = evaluated
      .filter(f => f.stale_status !== 'HEALTHY' || f.cleanup_status === 'CLEANUP_PENDING')
      .sort((a, b) => b.stale_score - a.stale_score)
      .slice(0, 5);

    res.json({
      total,
      active,
      inactive,
      stale,
      expired,
      healthy,
      cleanup_pending,
      review_needed,
      keep,
      risk_distribution,
      environment_distribution,
      flags_requiring_attention,
      recent_activity
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to retrieve stats', details: err.message });
  }
}

export async function getAllAuditLogs(req, res) {
  try {
    const logs = await query(`
      SELECT 
        l.*,
        f.name as flag_name,
        f.environment,
        f.status as current_flag_status
      FROM flag_audit_logs l
      LEFT JOIN flags f ON l.flag_id = f.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs', details: err.message });
  }
}

export async function resetSeedsEndpoint(req, res) {
  try {
    await dbResetSeeds();
    res.json({ success: true, message: 'Database reset and seeded with 10 realistic flags successfully' });
  } catch (err) {
    console.error('Error resetting seeds:', err);
    res.status(500).json({ error: 'Failed to reset seeds', details: err.message });
  }
}
