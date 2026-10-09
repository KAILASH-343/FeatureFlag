import React from 'react';
import { Plus, RotateCcw } from 'lucide-react';

export default function Header({ activeTab, onOpenCreate, onResetSeeds, isResetting }) {
  const titles = {
    dashboard: {
      title: 'Governance Dashboard',
      subtitle: 'Real-time telemetry and lifecycle health across all environments'
    },
    flags: {
      title: 'Feature Flag Inventory',
      subtitle: 'Manage configurations, environments, active toggles, and metadata'
    },
    stale: {
      title: 'Stale Flag Detection & Governance',
      subtitle: 'Identify inactive or expired flags and apply human-in-the-loop cleanup'
    },
    audit: {
      title: 'System Lifecycle Audit Trail',
      subtitle: 'Immutable record of flag creations, status toggles, modifications, and usage pings'
    },
    info: {
      title: 'Architecture & Project Specs',
      subtitle: 'Technical overview of 3-tier architecture, detection rules, and Docker setup'
    }
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="top-header">
      <div className="header-left">
        <div>
          <h2 className="page-title">{current.title}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{current.subtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        <button 
          className="btn btn-secondary" 
          onClick={onResetSeeds} 
          disabled={isResetting}
          title="Reset and reload the 10 realistic demo flags with historical audit entries"
        >
          <RotateCcw size={15} className={isResetting ? 'spin' : ''} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>

        <button 
          className="btn btn-primary" 
          onClick={onOpenCreate}
        >
          <Plus size={16} />
          <span>New Feature Flag</span>
        </button>
      </div>
    </header>
  );
}
