import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  CheckCircle2, 
  Trash2, 
  Play, 
  Search, 
  Filter,
  Check,
  RotateCw,
  ExternalLink
} from 'lucide-react';

export default function StaleFlagsView({ 
  flags, 
  onUpdateCleanupStatus, 
  onSelectFlag, 
  onSimulateUsage 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, stale, expired, cleanup_pending
  const [selectedEnv, setSelectedEnv] = useState('all');

  // Filter only stale, expired or review/cleanup candidates
  const staleCandidates = flags.filter(flag => {
    return flag.stale_status !== 'HEALTHY' || flag.cleanup_status === 'CLEANUP_PENDING' || flag.cleanup_status === 'REVIEW';
  });

  const filtered = staleCandidates.filter(flag => {
    const matchesSearch = 
      flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flag.owner && flag.owner.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEnv = selectedEnv === 'all' || flag.environment === selectedEnv;
    
    let matchesType = true;
    if (filterType === 'stale') matchesType = flag.stale_status === 'STALE';
    if (filterType === 'expired') matchesType = flag.stale_status === 'EXPIRED';
    if (filterType === 'cleanup') matchesType = flag.cleanup_status === 'CLEANUP_PENDING';
    if (filterType === 'review') matchesType = flag.cleanup_status === 'REVIEW';

    return matchesSearch && matchesEnv && matchesType;
  });

  return (
    <div>
      {/* Rule Definition Educational Callout */}
      <div className="panel" style={{ background: 'rgba(17, 24, 39, 0.5)', borderColor: 'rgba(99, 102, 241, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--primary-light)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Stale Detection Rules & Governance Policy</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', fontSize: '0.84rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--stale)', marginBottom: '4px' }}>Rule 1: Usage Staleness</div>
            <div style={{ color: 'var(--text-muted)' }}>Flag last evaluated &gt; 60 days ago is categorized as <strong>STALE</strong> (+40 risk).</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--stale)', marginBottom: '4px' }}>Rule 2: Modification Inactivity</div>
            <div style={{ color: 'var(--text-muted)' }}>No configuration edits for &gt; 90 days increases risk score (+25 risk).</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--expired)', marginBottom: '4px' }}>Rule 3: Expiry Boundary</div>
            <div style={{ color: 'var(--text-muted)' }}>Scheduled end-of-life timestamp passed marks flag as <strong>EXPIRED</strong> (+50 risk).</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--primary-light)', marginBottom: '4px' }}>Governance Policy</div>
            <div style={{ color: 'var(--text-muted)' }}><strong>Never Auto-Delete</strong>. Team reviews and explicitly marks for cleanup.</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search stale flags by name or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select 
            className="select-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Stale Categories ({staleCandidates.length})</option>
            <option value="stale">Stale Only (&gt;60d)</option>
            <option value="expired">Expired Only</option>
            <option value="cleanup">Marked for Cleanup</option>
            <option value="review">Review Needed</option>
          </select>

          <select 
            className="select-filter"
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
          >
            <option value="all">All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
      </div>

      {/* Stale Flags List */}
      <div>
        {filtered.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} style={{ color: 'var(--healthy)', margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>No Stale Flags in this view!</div>
            <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>All flags in this criteria are healthy or operational.</div>
          </div>
        ) : (
          filtered.map(flag => {
            const isExpired = flag.stale_status === 'EXPIRED';
            const borderClass = isExpired ? 'border-expired' : 'border-stale';

            return (
              <div key={flag.id} className={`stale-card ${borderClass}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span 
                        className="flag-key" 
                        style={{ fontSize: '1.05rem', cursor: 'pointer', color: '#c7d2fe' }}
                        onClick={() => onSelectFlag(flag.id)}
                      >
                        {flag.name}
                      </span>
                      <span className={`badge badge-env-${flag.environment}`}>
                        {flag.environment}
                      </span>
                      <span className={`badge ${flag.status === 'ACTIVE' ? 'badge-healthy' : 'badge-review'}`}>
                        {flag.status}
                      </span>
                      <span className={`badge ${isExpired ? 'badge-expired' : 'badge-stale'}`}>
                        {flag.stale_status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {flag.description || 'No description'}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px', display: 'flex', gap: '16px' }}>
                      <span>Owner: <strong>{flag.owner}</strong></span>
                      <span>Last Used: <strong>{flag.days_since_used} days ago</strong></span>
                      <span>Last Modified: <strong>{flag.days_since_modified} days ago</strong></span>
                      {flag.expiry_date && (
                        <span>Expiry: <strong>{new Date(flag.expiry_date).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Stale Score Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Staleness Score
                    </div>
                    <div style={{ 
                      fontSize: '1.7rem', 
                      fontWeight: 800, 
                      fontFamily: 'var(--font-mono)',
                      color: flag.stale_score >= 70 ? 'var(--expired)' : 'var(--stale)' 
                    }}>
                      {flag.stale_score}<span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>/100</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: flag.risk_level === 'HIGH' ? 'var(--expired)' : 'var(--stale)', fontWeight: 600 }}>
                      {flag.risk_level} RISK
                    </div>
                  </div>
                </div>

                {/* Stale Reasons Box */}
                <div className="stale-reasons-box">
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Evaluation Diagnostics & Triggers:
                  </div>
                  {flag.stale_reasons && flag.stale_reasons.map((reason, idx) => (
                    <div key={idx} className="reason-bullet">
                      <span style={{ color: isExpired ? 'var(--expired)' : 'var(--stale)' }}>•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Governance Recommendation & Actions */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  paddingTop: '10px', 
                  borderTop: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Recommendation:</span>
                    <span className={`badge ${
                      flag.cleanup_status === 'CLEANUP_PENDING' ? 'badge-cleanup' :
                      flag.cleanup_status === 'KEEP' ? 'badge-keep' : 'badge-review'
                    }`}>
                      {flag.cleanup_status === 'CLEANUP_PENDING' ? 'Marked for Cleanup' : flag.cleanup_status}
                    </span>
                  </div>

                  {/* 1-Click Governance Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Mark for Cleanup */}
                    <button
                      className={`btn btn-sm ${flag.cleanup_status === 'CLEANUP_PENDING' ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => onUpdateCleanupStatus(flag.id, 'CLEANUP_PENDING')}
                      title="Set recommendation to Mark for Cleanup"
                    >
                      <Trash2 size={13} />
                      <span>{flag.cleanup_status === 'CLEANUP_PENDING' ? 'Marked for Cleanup ✓' : 'Mark for Cleanup'}</span>
                    </button>

                    {/* Mark for Review */}
                    <button
                      className={`btn btn-sm ${flag.cleanup_status === 'REVIEW' ? 'btn-secondary' : 'btn-outline'}`}
                      onClick={() => onUpdateCleanupStatus(flag.id, 'REVIEW')}
                      title="Request owner rollout review"
                    >
                      <span>Review</span>
                    </button>

                    {/* Keep as Permanent Flag */}
                    <button
                      className={`btn btn-sm ${flag.cleanup_status === 'KEEP' ? 'btn-secondary' : 'btn-outline'}`}
                      onClick={() => onUpdateCleanupStatus(flag.id, 'KEEP')}
                      title="Mark as permanent operational safeguard (circuit breaker / kill switch)"
                    >
                      <ShieldCheck size={13} />
                      <span>Keep (Permanent)</span>
                    </button>

                    {/* Simulate Usage Ping (Revives Flag) */}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSimulateUsage(flag.id)}
                      title="Simulate service evaluation. Resets last_used_at to current time and recalculates staleness!"
                      style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    >
                      <Play size={13} style={{ color: 'var(--healthy)' }} />
                      <span style={{ color: '#6ee7b7' }}>Simulate Usage Ping</span>
                    </button>

                    {/* Open Inspector */}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSelectFlag(flag.id)}
                      title="Inspect full audit timeline"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
