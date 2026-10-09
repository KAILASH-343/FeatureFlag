import React, { useState } from 'react';
import { 
  X, 
  Play, 
  ShieldCheck, 
  Trash2, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Activity,
  Edit3
} from 'lucide-react';

export default function FlagDetailDrawer({ 
  flagDetail, 
  onClose, 
  onToggleStatus, 
  onUpdateCleanupStatus, 
  onSimulateUsage,
  onEditFlag 
}) {
  if (!flagDetail || !flagDetail.flag) return null;

  const { flag, audit_logs = [] } = flagDetail;
  const isExpired = flag.stale_status === 'EXPIRED';
  const isStale = flag.stale_status === 'STALE';

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="flag-key" style={{ fontSize: '1.25rem', color: '#ffffff' }}>
                {flag.name}
              </span>
              <span className={`badge badge-env-${flag.environment}`}>
                {flag.environment}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {flag.description || 'No description provided'}
            </p>
          </div>
          <button 
            className="btn btn-outline btn-sm" 
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Active Toggle & Quick Action Bar */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            border: '1px solid var(--border-card)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '16px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={flag.status === 'ACTIVE'}
                  onChange={() => onToggleStatus(flag.id)}
                />
                <span className="slider"></span>
              </label>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  State: <span style={{ color: flag.status === 'ACTIVE' ? 'var(--healthy)' : 'var(--text-dim)' }}>{flag.status}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Controls live evaluation in {flag.environment}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => onSimulateUsage(flag.id)}
                title="Simulate service flag usage ping to reset staleness"
              >
                <Play size={13} style={{ color: 'var(--healthy)' }} />
                <span>Simulate Ping</span>
              </button>

              <button 
                className="btn btn-outline btn-sm"
                onClick={() => onEditFlag(flag)}
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Stale Health & Risk Meter Panel */}
          <div className="panel" style={{ marginBottom: '24px' }}>
            <div className="panel-header">
              <div className="panel-title" style={{ fontSize: '0.95rem' }}>
                <AlertTriangle size={17} style={{ color: isExpired ? 'var(--expired)' : isStale ? 'var(--stale)' : 'var(--healthy)' }} />
                <span>Stale Detection Telemetry</span>
              </div>
              <span className={`badge ${isExpired ? 'badge-expired' : isStale ? 'badge-stale' : 'badge-healthy'}`}>
                {flag.stale_status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Computed Risk Score</div>
                <div style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 800, 
                  fontFamily: 'var(--font-mono)',
                  color: flag.stale_score >= 70 ? 'var(--expired)' : flag.stale_score >= 35 ? 'var(--stale)' : 'var(--healthy)' 
                }}>
                  {flag.stale_score} <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>/ 100</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Risk Tier</div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: flag.risk_level === 'HIGH' ? 'var(--expired)' : flag.risk_level === 'MEDIUM' ? 'var(--stale)' : 'var(--healthy)' 
                }}>
                  {flag.risk_level} RISK
                </div>
              </div>
            </div>

            {/* Score progress bar */}
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '16px' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${Math.max(5, flag.stale_score)}%`, 
                  background: flag.stale_score >= 70 ? 'var(--expired)' : flag.stale_score >= 35 ? 'var(--stale)' : 'var(--healthy)',
                  borderRadius: 'var(--radius-full)'
                }}
              ></div>
            </div>

            {/* Clear Reasons */}
            <div className="stale-reasons-box">
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
                Diagnostic Reasons & Triggered Rules:
              </div>
              {flag.stale_reasons && flag.stale_reasons.map((r, i) => (
                <div key={i} className="reason-bullet">
                  <span style={{ color: isExpired ? 'var(--expired)' : isStale ? 'var(--stale)' : 'var(--healthy)' }}>•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            marginBottom: '24px', 
            fontSize: '0.82rem',
            background: 'rgba(0,0,0,0.15)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ color: 'var(--text-dim)' }}>Owner:</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{flag.owner}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)' }}>Environment:</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', textTransform: 'capitalize' }}>{flag.environment}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)' }}>Last Evaluated:</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {flag.last_used_at ? `${new Date(flag.last_used_at).toLocaleDateString()} (${flag.days_since_used}d ago)` : 'Never evaluated'}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)' }}>Last Modified:</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {new Date(flag.updated_at).toLocaleDateString()} ({flag.days_since_modified}d ago)
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)' }}>Created Date:</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {new Date(flag.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)' }}>Target Expiry Date:</div>
              <div style={{ fontWeight: 600, color: flag.is_expired ? 'var(--expired)' : 'var(--text-main)', marginTop: '2px' }}>
                {flag.expiry_date ? new Date(flag.expiry_date).toLocaleDateString() : 'Permanent (No expiry)'}
              </div>
            </div>
          </div>

          {/* Governance Action Picker */}
          <div className="panel" style={{ marginBottom: '24px' }}>
            <div className="panel-header" style={{ marginBottom: '12px' }}>
              <div className="panel-title" style={{ fontSize: '0.95rem' }}>
                <ShieldCheck size={17} style={{ color: 'var(--primary-light)' }} />
                <span>Governance Recommendation</span>
              </div>
              <span className={`badge ${
                flag.cleanup_status === 'CLEANUP_PENDING' ? 'badge-cleanup' :
                flag.cleanup_status === 'KEEP' ? 'badge-keep' : 'badge-review'
              }`}>
                {flag.cleanup_status === 'CLEANUP_PENDING' ? 'Marked for Cleanup' : flag.cleanup_status}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Select the lifecycle recommendation for this feature flag. Note: System policy guarantees zero auto-deletion.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                className={`btn btn-sm ${flag.cleanup_status === 'KEEP' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => onUpdateCleanupStatus(flag.id, 'KEEP')}
              >
                Keep (Safeguard)
              </button>
              <button
                className={`btn btn-sm ${flag.cleanup_status === 'REVIEW' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => onUpdateCleanupStatus(flag.id, 'REVIEW')}
              >
                Review Needed
              </button>
              <button
                className={`btn btn-sm ${flag.cleanup_status === 'CLEANUP_PENDING' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => onUpdateCleanupStatus(flag.id, 'CLEANUP_PENDING')}
              >
                Mark for Cleanup
              </button>
            </div>
          </div>

          {/* Lifecycle Audit History Timeline */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title" style={{ fontSize: '0.95rem' }}>
                <History size={17} style={{ color: 'var(--primary-light)' }} />
                <span>Lifecycle History & Audit Trail</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {audit_logs.length} event{audit_logs.length === 1 ? '' : 's'}
              </span>
            </div>

            {audit_logs.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No audit history found for this flag.</div>
            ) : (
              <div className="timeline">
                {audit_logs.map(log => (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-action" style={{ color: 'var(--primary-light)' }}>
                          {log.action}
                        </span>
                        <span className="timeline-time">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="timeline-actor">
                        Actor: <strong>{log.actor || 'system'}</strong>
                      </div>
                      {log.details && (
                        <div className="timeline-details">
                          {log.details}
                        </div>
                      )}
                      {(log.old_value || log.new_value) && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                          {log.old_value && <span>Old: {log.old_value} → </span>}
                          {log.new_value && <span>New: {log.new_value}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
