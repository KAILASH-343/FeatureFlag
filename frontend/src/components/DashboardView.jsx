import React from 'react';
import { 
  Flag, 
  CheckCircle2, 
  PauseCircle, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Activity,
  Trash2
} from 'lucide-react';

export default function DashboardView({ stats, onNavigate, onSelectFlag }) {
  if (!stats) {
    return <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Loading dashboard telemetry...</div>;
  }

  const {
    total = 0,
    active = 0,
    inactive = 0,
    stale = 0,
    expired = 0,
    cleanup_pending = 0,
    review_needed = 0,
    keep = 0,
    risk_distribution = { low: 0, medium: 0, high: 0 },
    recent_activity = [],
    flags_requiring_attention = []
  } = stats;

  const lowPct = total > 0 ? Math.round((risk_distribution.low / total) * 100) : 0;
  const medPct = total > 0 ? Math.round((risk_distribution.medium / total) * 100) : 0;
  const highPct = total > 0 ? Math.round((risk_distribution.high / total) * 100) : 0;

  return (
    <div>
      {/* 5 Key Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Flags</span>
            <div className="stat-icon icon-indigo">
              <Flag size={18} />
            </div>
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-desc">Managed across 3 environments</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Flags</span>
            <div className="stat-icon icon-emerald">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--healthy)' }}>{active}</div>
          <div className="stat-desc">Serving live runtime evaluations</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Inactive Flags</span>
            <div className="stat-icon icon-slate">
              <PauseCircle size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--text-muted)' }}>{inactive}</div>
          <div className="stat-desc">Temporarily disabled or paused</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Stale Flags</span>
            <div className="stat-icon icon-amber">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--stale)' }}>{stale}</div>
          <div className="stat-desc">Unused for &gt; 60 days</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Expired Flags</span>
            <div className="stat-icon icon-rose">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--expired)' }}>{expired}</div>
          <div className="stat-desc">Passed target deprecation date</div>
        </div>
      </div>

      {/* Attention Alert Banner */}
      {(stale > 0 || expired > 0) && (
        <div className="attention-banner">
          <div className="attention-left">
            <div className="attention-icon">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.98rem', color: '#fef08a' }}>
                Technical Debt Warning: {stale + expired} Flag{stale + expired === 1 ? '' : 's'} Require Review
              </div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '2px' }}>
                Flags unused for over 60 days or past their scheduled expiry increase risk of dead code paths.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.15)', color: '#fef08a' }}
            onClick={() => onNavigate('stale')}
          >
            <span>Review Stale Flags</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* 2-Column Grid: Risk Visualizer & Cleanup Pipeline */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <TrendingUp size={18} style={{ color: 'var(--primary-light)' }} />
              <span>Stale Risk Distribution</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>0 - 100 Risk Scoring</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Risk is computed from days since last evaluation (&gt;60d), config staleness (&gt;90d), and expiration dates.
          </p>

          <div className="risk-meter-container">
            <div className="risk-bar">
              <div className="risk-segment low" style={{ width: `${lowPct}%` }} title={`Low Risk: ${risk_distribution.low} (${lowPct}%)`}></div>
              <div className="risk-segment medium" style={{ width: `${medPct}%` }} title={`Medium Risk: ${risk_distribution.medium} (${medPct}%)`}></div>
              <div className="risk-segment high" style={{ width: `${highPct}%` }} title={`High Risk: ${risk_distribution.high} (${highPct}%)`}></div>
            </div>

            <div className="risk-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--healthy)' }}></span>
                <span>Low Risk: <strong>{risk_distribution.low}</strong> ({lowPct}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--stale)' }}></span>
                <span>Medium Risk: <strong>{risk_distribution.medium}</strong> ({medPct}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--expired)' }}></span>
                <span>High / Expired: <strong>{risk_distribution.high}</strong> ({highPct}%)</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Healthy</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--healthy)', marginTop: '2px' }}>{stats.healthy || 0}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Stale (&gt;60d)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--stale)', marginTop: '2px' }}>{stale}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Expired</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--expired)', marginTop: '2px' }}>{expired}</div>
            </div>
          </div>
        </div>

        {/* Governance & Cleanup Recommendation Pipeline */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Trash2 size={18} style={{ color: '#fb7185' }} />
              <span>Governance Pipeline</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Zero Auto-Delete Policy</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--expired-bg)', 
              border: '1px solid var(--expired-border)' 
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fda4af' }}>Cleanup Pending</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flagged for code removal</div>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185' }}>{cleanup_pending}</span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--stale-bg)', 
              border: '1px solid var(--stale-border)' 
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fde68a' }}>Review Needed</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owner confirmation required</div>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{review_needed}</span>
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--info-bg)', 
              border: '1px solid var(--info-border)' 
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#bae6fd' }}>Keep (Permanent)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operational circuit breakers</div>
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{keep}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flags Needing Immediate Attention List */}
      {flags_requiring_attention.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <AlertTriangle size={18} style={{ color: 'var(--stale)' }} />
              <span>Highest Stale Risk Flags</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('stale')}>
              View All ({stale + expired})
            </button>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Flag Key</th>
                  <th>Environment</th>
                  <th>State</th>
                  <th>Staleness Condition</th>
                  <th>Risk Score</th>
                  <th>Governance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {flags_requiring_attention.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div className="flag-key">{f.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.description}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-env-${f.environment}`}>
                        {f.environment}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${f.status === 'ACTIVE' ? 'badge-healthy' : 'badge-review'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${f.stale_status === 'EXPIRED' ? 'badge-expired' : 'badge-stale'}`}>
                        {f.stale_status}
                      </span>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {f.days_since_used > 60 && `Unused: ${f.days_since_used}d`}
                        {f.is_expired && ` • Expired ${f.days_expired}d ago`}
                      </div>
                    </td>
                    <td>
                      <div className="score-indicator">
                        <span style={{ fontWeight: 700, color: f.stale_score >= 70 ? 'var(--expired)' : 'var(--stale)' }}>
                          {f.stale_score}
                        </span>
                        <div className="score-bar-mini">
                          <div 
                            className="score-bar-fill" 
                            style={{ 
                              width: `${f.stale_score}%`, 
                              background: f.stale_score >= 70 ? 'var(--expired)' : 'var(--stale)' 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        f.cleanup_status === 'CLEANUP_PENDING' ? 'badge-cleanup' :
                        f.cleanup_status === 'KEEP' ? 'badge-keep' : 'badge-review'
                      }`}>
                        {f.cleanup_status === 'CLEANUP_PENDING' ? 'Marked for Cleanup' : f.cleanup_status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectFlag(f.id)}
                      >
                        Inspect Flag
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Lifecycle Activity Feed */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={18} style={{ color: 'var(--primary-light)' }} />
            <span>Recent Lifecycle Activity Stream</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate('audit')}>
            View Full Audit Log
          </button>
        </div>

        {recent_activity.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No recent audit events recorded.</div>
        ) : (
          <div className="timeline">
            {recent_activity.map(entry => (
              <div key={entry.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-action" style={{ color: 'var(--primary-light)' }}>
                      {entry.action}
                    </span>
                    <span className="timeline-time">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span className="flag-key" style={{ fontSize: '0.8rem', cursor: 'pointer', color: '#c7d2fe' }} onClick={() => entry.flag_id && onSelectFlag(entry.flag_id)}>
                      {entry.flag_name || `Flag #${entry.flag_id}`}
                    </span>
                    {entry.environment && (
                      <span className={`badge badge-env-${entry.environment}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        {entry.environment}
                      </span>
                    )}
                    <span className="timeline-actor">• by {entry.actor}</span>
                  </div>
                  {entry.details && (
                    <div className="timeline-details">
                      {entry.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
