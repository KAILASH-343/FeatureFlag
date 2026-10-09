import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  User, 
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react';

export default function FlagsTableView({ 
  flags, 
  onToggleStatus, 
  onSelectFlag, 
  onEditFlag, 
  onDeleteFlag,
  onSimulateUsage
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStale, setSelectedStale] = useState('all');
  const [selectedCleanup, setSelectedCleanup] = useState('all');

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = 
      flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (flag.description && flag.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (flag.owner && flag.owner.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEnv = selectedEnv === 'all' || flag.environment === selectedEnv;
    const matchesStatus = selectedStatus === 'all' || flag.status === selectedStatus;
    const matchesStale = selectedStale === 'all' || flag.stale_status === selectedStale;
    const matchesCleanup = selectedCleanup === 'all' || flag.cleanup_status === selectedCleanup;

    return matchesSearch && matchesEnv && matchesStatus && matchesStale && matchesCleanup;
  });

  const formatRelativeDays = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <div>
      {/* Search & Filter Controls */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search by flag key, description, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
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

          <select 
            className="select-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All States</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select 
            className="select-filter"
            value={selectedStale}
            onChange={(e) => setSelectedStale(e.target.value)}
          >
            <option value="all">All Stale Health</option>
            <option value="HEALTHY">Healthy</option>
            <option value="STALE">Stale (&gt;60d)</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select 
            className="select-filter"
            value={selectedCleanup}
            onChange={(e) => setSelectedCleanup(e.target.value)}
          >
            <option value="all">All Governance</option>
            <option value="KEEP">Keep</option>
            <option value="REVIEW">Review</option>
            <option value="CLEANUP_PENDING">Cleanup Pending</option>
          </select>
        </div>
      </div>

      {/* Flag Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Feature Flag Key</th>
              <th>Environment</th>
              <th>Toggle State</th>
              <th>Stale Health & Score</th>
              <th>Last Used / Evaluated</th>
              <th>Governance Policy</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlags.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No feature flags found matching the specified filters.
                </td>
              </tr>
            ) : (
              filteredFlags.map((flag) => {
                const isChecked = flag.status === 'ACTIVE';
                return (
                  <tr key={flag.id}>
                    {/* Key and Info */}
                    <td style={{ minWidth: '240px' }}>
                      <div 
                        className="flag-key" 
                        style={{ cursor: 'pointer', display: 'inline-block' }}
                        onClick={() => onSelectFlag(flag.id)}
                        title="Click to view lifecycle details & audit history"
                      >
                        {flag.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px', lineHeight: 1.3 }}>
                        {flag.description || 'No description provided'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        <span>{flag.owner}</span>
                      </div>
                    </td>

                    {/* Environment */}
                    <td>
                      <span className={`badge badge-env-${flag.environment}`}>
                        {flag.environment}
                      </span>
                    </td>

                    {/* Status Toggle Switch */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleStatus(flag.id)}
                          />
                          <span className="slider"></span>
                        </label>
                        <span style={{ 
                          fontSize: '0.78rem', 
                          fontWeight: 600, 
                          color: isChecked ? 'var(--healthy)' : 'var(--text-dim)' 
                        }}>
                          {flag.status}
                        </span>
                      </div>
                    </td>

                    {/* Stale Health & Score */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${
                            flag.stale_status === 'HEALTHY' ? 'badge-healthy' :
                            flag.stale_status === 'STALE' ? 'badge-stale' : 'badge-expired'
                          }`}>
                            {flag.stale_status}
                          </span>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            fontFamily: 'var(--font-mono)',
                            color: flag.stale_score >= 70 ? 'var(--expired)' : flag.stale_score >= 35 ? 'var(--stale)' : 'var(--healthy)'
                          }}>
                            {flag.stale_score} / 100
                          </span>
                        </div>
                        <div className="score-bar-mini" style={{ width: '90px' }}>
                          <div 
                            className="score-bar-fill" 
                            style={{ 
                              width: `${Math.max(4, flag.stale_score)}%`, 
                              background: flag.stale_score >= 70 ? 'var(--expired)' : flag.stale_score >= 35 ? 'var(--stale)' : 'var(--healthy)'
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Last Used / Evaluated */}
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                        {formatRelativeDays(flag.days_since_used)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        Modified {formatRelativeDays(flag.days_since_modified)}
                      </div>
                      {flag.is_expired && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--expired)', fontWeight: 600, marginTop: '2px' }}>
                          Expired {flag.days_expired}d ago
                        </div>
                      )}
                    </td>

                    {/* Cleanup Governance Recommendation */}
                    <td>
                      <span className={`badge ${
                        flag.cleanup_status === 'CLEANUP_PENDING' ? 'badge-cleanup' :
                        flag.cleanup_status === 'KEEP' ? 'badge-keep' : 'badge-review'
                      }`}>
                        {flag.cleanup_status === 'CLEANUP_PENDING' ? 'Marked for Cleanup' : flag.cleanup_status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSimulateUsage(flag.id)}
                          title="Simulate runtime flag evaluation (resets last_used_at to now)"
                        >
                          <Play size={13} style={{ color: 'var(--healthy)' }} />
                          <span>Ping</span>
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectFlag(flag.id)}
                          title="Inspect flag details, reasons, and lifecycle audit trail"
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>

                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => onEditFlag(flag)}
                          title="Edit flag metadata"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => onDeleteFlag(flag)}
                          title="Delete flag (never automatic)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
