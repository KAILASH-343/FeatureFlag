import React from 'react';
import { 
  LayoutDashboard, 
  Flag, 
  AlertTriangle, 
  History, 
  Info, 
  ShieldCheck,
  Server
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, staleCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'flags', label: 'Feature Flags', icon: Flag },
    { 
      id: 'stale', 
      label: 'Stale Detection', 
      icon: AlertTriangle, 
      badge: staleCount > 0 ? staleCount : null 
    },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'info', label: 'Architecture & Docs', icon: Info },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="brand-title">FlagPulse</h1>
          <p className="brand-subtitle">Lifecycle & Governance</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="nav-left">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="nav-badge warning">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="tech-tag" style={{ marginBottom: '6px' }}>
          <span className="dot"></span>
          <span>3-Tier Architecture</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
          React + Express + MySQL
        </div>
      </div>
    </aside>
  );
}
