import React, { useState } from 'react';
import { History, Search, Filter, Activity, User, ExternalLink } from 'lucide-react';

export default function AuditTrailView({ auditLogs, onSelectFlag }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      (log.flag_name && log.flag_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.actor && log.actor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionColor = (action) => {
    switch (action) {
      case 'FLAG_CREATED': return '#818cf8';
      case 'STATUS_TOGGLED': return '#34d399';
      case 'CONFIG_UPDATED': return '#fbbf24';
      case 'USAGE_PING': return '#38bdf8';
      case 'CLEANUP_STATUS_CHANGED': return '#fb7185';
      default: return '#94a3b8';
    }
  };

  return (
    <div>
      {/* Search & Filter */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search audit trail by flag name, actor, or detail notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="select-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">All Action Types</option>
            <option value="FLAG_CREATED">FLAG_CREATED</option>
            <option value="STATUS_TOGGLED">STATUS_TOGGLED</option>
            <option value="CONFIG_UPDATED">CONFIG_UPDATED</option>
            <option value="USAGE_PING">USAGE_PING</option>
            <option value="CLEANUP_STATUS_CHANGED">CLEANUP_STATUS_CHANGED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Flag Key</th>
              <th>Action Type</th>
              <th>Actor</th>
              <th>Lifecycle Change Details</th>
              <th style={{ textAlign: 'right' }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No lifecycle audit records match the current filter criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div 
                      className="flag-key" 
                      style={{ cursor: 'pointer', color: '#c7d2fe' }}
                      onClick={() => log.flag_id && onSelectFlag(log.flag_id)}
                    >
                      {log.flag_name || `Flag #${log.flag_id}`}
                    </div>
                    {log.environment && (
                      <span className={`badge badge-env-${log.environment}`} style={{ fontSize: '0.68rem', padding: '1px 6px', marginTop: '2px' }}>
                        {log.environment}
                      </span>
                    )}
                  </td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        borderColor: getActionColor(log.action),
                        color: getActionColor(log.action),
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem'
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <User size={12} />
                      <span>{log.actor}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: '400px' }}>
                    <div style={{ fontSize: '0.84rem', color: '#e2e8f0' }}>
                      {log.details || 'Lifecycle transition recorded'}
                    </div>
                    {(log.old_value || log.new_value) && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        {log.old_value && <span>Prev: {log.old_value} → </span>}
                        {log.new_value && <span>Next: {log.new_value}</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {log.flag_id && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectFlag(log.flag_id)}
                        title="Open flag detail drawer"
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
