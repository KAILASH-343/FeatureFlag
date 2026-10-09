import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function FlagModal({ isOpen, onClose, onSave, editingFlag }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner: '',
    environment: 'production',
    status: 'ACTIVE',
    expiry_date: '',
    cleanup_status: 'REVIEW'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingFlag) {
      setFormData({
        name: editingFlag.name || '',
        description: editingFlag.description || '',
        owner: editingFlag.owner || '',
        environment: editingFlag.environment || 'production',
        status: editingFlag.status || 'ACTIVE',
        expiry_date: editingFlag.expiry_date ? editingFlag.expiry_date.substring(0, 10) : '',
        cleanup_status: editingFlag.cleanup_status || 'REVIEW'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        owner: '',
        environment: 'production',
        status: 'ACTIVE',
        expiry_date: '',
        cleanup_status: 'REVIEW'
      });
    }
    setError('');
  }, [editingFlag, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Flag name / key is required');
      return;
    }
    if (!formData.owner.trim()) {
      setError('Owner email or team is required');
      return;
    }

    onSave({
      ...formData,
      expiry_date: formData.expiry_date ? formData.expiry_date : null
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {editingFlag ? `Edit Flag: ${editingFlag.name}` : 'Create New Feature Flag'}
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ 
                background: 'var(--expired-bg)', 
                color: '#fb7185', 
                padding: '10px 14px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--expired-border)',
                marginBottom: '16px',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Flag Key (Unique Identifier)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. checkout-oneclick-pay"
                value={formData.name}
                disabled={!!editingFlag}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') })}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Use lowercase kebab-case keys. Unique across all environments.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Purpose</label>
              <textarea
                className="form-control"
                placeholder="Explain the purpose of this flag, target rollout audience, and expected outcome..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Owner / Team</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. alex@company.com"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Environment</label>
                <select
                  className="form-control"
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                >
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE (Enabled)</option>
                  <option value="INACTIVE">INACTIVE (Disabled)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Governance Policy</label>
                <select
                  className="form-control"
                  value={formData.cleanup_status}
                  onChange={(e) => setFormData({ ...formData, cleanup_status: e.target.value })}
                >
                  <option value="REVIEW">Review Needed</option>
                  <option value="KEEP">Keep (Permanent Circuit Breaker)</option>
                  <option value="CLEANUP_PENDING">Mark for Cleanup</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Expiry Date (Optional)</label>
              <input
                type="date"
                className="form-control"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                If current date exceeds this date, the flag will automatically trigger an EXPIRED health state.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>{editingFlag ? 'Save Changes' : 'Create Flag'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
