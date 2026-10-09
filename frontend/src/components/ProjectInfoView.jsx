import React from 'react';
import { ShieldCheck, Server, Database, Layers, CheckCircle2, Terminal } from 'lucide-react';

export default function ProjectInfoView() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Overview Hero */}
      <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div className="brand-icon" style={{ width: '48px', height: '48px' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Feature Flag Lifecycle With Stale Flag Detection</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              College Capstone MVP — Enterprise Feature Flag Governance & Dead Code Prevention
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          Feature flags are essential for continuous deployment and trunk-based development. However, flags left abandoned in codebases accumulate technical debt, inflate configuration complexity, and cause silent production incidents. This project implements an automated lifecycle management system that tracks flag usage and alerts engineering teams when flags become stale or expired.
        </p>
      </div>

      {/* 3-Tier Architecture Breakdown */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Layers size={18} style={{ color: 'var(--primary-light)' }} />
            <span>3-Tier Architecture</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#818cf8', fontWeight: 600, marginBottom: '8px' }}>
              <Layers size={16} />
              <span>Tier 1: Presentation Layer</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>React 18 + Vite</strong> with Vanilla CSS design tokens. Features reactive state management, telemetry dashboard, filterable inventory, lifecycle timeline, and modal workflows.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', fontWeight: 600, marginBottom: '8px' }}>
              <Server size={16} />
              <span>Tier 2: Business & Application Layer</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>Node.js + Express REST API</strong>. Hosts the pure-function stale detection rule engine, audit event dispatcher, and lifecycle state transition validators.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontWeight: 600, marginBottom: '8px' }}>
              <Database size={16} />
              <span>Tier 3: Persistence Layer</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>MySQL 8.0</strong> relational database. Normalized tables (<code>flags</code> and <code>flag_audit_logs</code>) with foreign key constraints, indexes, and automated initialization scripts.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Engine Deep-Dive */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <ShieldCheck size={18} style={{ color: 'var(--stale)' }} />
            <span>Stale Detection Rules Specification</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule Indicator</th>
                <th>Threshold Condition</th>
                <th>Classification</th>
                <th>Risk Score Weight</th>
                <th>Governance Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Usage Staleness</strong></td>
                <td><code>days_since_used &gt; 60</code></td>
                <td><span className="badge badge-stale">STALE</span></td>
                <td>+40 pts (if &gt;120d: +15 pts)</td>
                <td>Recommend Review / Cleanup</td>
              </tr>
              <tr>
                <td><strong>Modification Stagnation</strong></td>
                <td><code>days_since_modified &gt; 90</code></td>
                <td><span className="badge badge-stale">AT RISK</span></td>
                <td>+25 pts</td>
                <td>Confirm configuration status</td>
              </tr>
              <tr>
                <td><strong>Target Expiration</strong></td>
                <td><code>expiry_date &lt; NOW()</code></td>
                <td><span className="badge badge-expired">EXPIRED</span></td>
                <td>+50 pts</td>
                <td>Immediate Mark for Cleanup</td>
              </tr>
              <tr>
                <td><strong>Inactive Status</strong></td>
                <td><code>status = 'INACTIVE'</code></td>
                <td><span className="badge badge-review">DISABLED</span></td>
                <td>+10 pts</td>
                <td>Verify if flag is obsolete</td>
              </tr>
              <tr>
                <td><strong>Permanent Safeguard</strong></td>
                <td><code>cleanup_status = 'KEEP'</code></td>
                <td><span className="badge badge-keep">KEEP</span></td>
                <td>Overrides cleanup</td>
                <td>Preserve operational killswitch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Project Evaluator Demo Walkthrough */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Terminal size={18} style={{ color: '#818cf8' }} />
            <span>Recommended Evaluator Demo Walkthrough</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>1</span>
            <div>
              <strong>Examine the Governance Dashboard:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Note the 5 metric counters, risk distribution percentage bar, and the 10 seeded realistic feature flags spread across healthy, stale, and expired states.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>2</span>
            <div>
              <strong>Feature Flags Inventory & Inline Toggle:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Navigate to <em>Feature Flags</em>. Toggle a flag between Active and Inactive. Check the <em>Audit Trail</em> tab to verify that the state transition and timestamp were recorded immutably.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>3</span>
            <div>
              <strong>Stale Flags Diagnosis:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Click on the <em>Stale Detection</em> tab. Look at <code>checkout-v2-redesign</code> (stale: unused for 95 days) or <code>summer-promo-banner-2025</code> (expired). Read the diagnostic reasons.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>4</span>
            <div>
              <strong>Inspect Flag Details & Audit Trail:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Click on the flag name to slide open the Inspector Drawer. View the risk meter and the complete chronological history of all lifecycle changes.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>5</span>
            <div>
              <strong>Simulate Runtime Flag Ping:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Click the <strong>Simulate Ping</strong> button. The backend updates <code>last_used_at = NOW()</code>. Notice the staleness score immediately resets to healthy, demonstrating dynamic staleness recovery.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>6</span>
            <div>
              <strong>Mark for Cleanup Governance:</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                Click <strong>Mark for Cleanup</strong>. Verify that the recommendation changes to <code>CLEANUP_PENDING</code>, adhering to the zero auto-delete safety rule.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
