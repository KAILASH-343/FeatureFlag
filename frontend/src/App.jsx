import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import DashboardView from './components/DashboardView.jsx';
import FlagsTableView from './components/FlagsTableView.jsx';
import StaleFlagsView from './components/StaleFlagsView.jsx';
import AuditTrailView from './components/AuditTrailView.jsx';
import ProjectInfoView from './components/ProjectInfoView.jsx';
import FlagDetailDrawer from './components/FlagDetailDrawer.jsx';
import FlagModal from './components/FlagModal.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [flags, setFlags] = useState([]);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedFlagDetail, setSelectedFlagDetail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadAllData = async () => {
    try {
      const [flagsRes, statsRes, auditRes] = await Promise.all([
        fetch('/api/flags'),
        fetch('/api/dashboard/stats'),
        fetch('/api/audit-logs')
      ]);

      if (flagsRes.ok) {
        const flagsData = await flagsRes.json();
        setFlags(flagsData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectFlag = async (flagId) => {
    try {
      const res = await fetch(`/api/flags/${flagId}`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedFlagDetail(detail);
      }
    } catch (err) {
      console.error('Failed to load flag details:', err);
      showToast('Could not load flag details', 'error');
    }
  };

  const handleToggleStatus = async (flagId) => {
    try {
      const res = await fetch(`/api/flags/${flagId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'admin@company.com' })
      });
      if (res.ok) {
        const updated = await res.json();
        showToast(`Flag "${updated.name}" toggled to ${updated.status}`, 'success');
        await loadAllData();
        if (selectedFlagDetail && selectedFlagDetail.flag.id === flagId) {
          handleSelectFlag(flagId);
        }
      }
    } catch (err) {
      console.error('Failed to toggle flag:', err);
      showToast('Failed to toggle flag state', 'error');
    }
  };

  const handleUpdateCleanupStatus = async (flagId, newStatus) => {
    try {
      const res = await fetch(`/api/flags/${flagId}/cleanup-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cleanup_status: newStatus,
          actor: 'governance-lead@company.com',
          note: `Lifecycle recommendation updated to ${newStatus}`
        })
      });
      if (res.ok) {
        const updated = await res.json();
        showToast(`Recommendation set to "${newStatus}" for ${updated.name}`, 'success');
        await loadAllData();
        if (selectedFlagDetail && selectedFlagDetail.flag.id === flagId) {
          handleSelectFlag(flagId);
        }
      }
    } catch (err) {
      console.error('Failed to update cleanup status:', err);
      showToast('Failed to update cleanup recommendation', 'error');
    }
  };

  const handleSimulateUsage = async (flagId) => {
    try {
      const res = await fetch(`/api/flags/${flagId}/simulate-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service: 'checkout-frontend-app',
          actor: 'runtime-client'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        showToast(`Simulated usage ping for "${updated.name}"! Staleness reset.`, 'success');
        await loadAllData();
        if (selectedFlagDetail && selectedFlagDetail.flag.id === flagId) {
          handleSelectFlag(flagId);
        }
      }
    } catch (err) {
      console.error('Failed to simulate flag usage:', err);
      showToast('Failed to simulate runtime usage ping', 'error');
    }
  };

  const handleSaveFlag = async (formData) => {
    try {
      if (editingFlag) {
        // Update existing flag
        const res = await fetch(`/api/flags/${editingFlag.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          showToast(`Flag "${editingFlag.name}" updated successfully`, 'success');
          setIsModalOpen(false);
          setEditingFlag(null);
          await loadAllData();
          if (selectedFlagDetail && selectedFlagDetail.flag.id === editingFlag.id) {
            handleSelectFlag(editingFlag.id);
          }
        } else {
          const errData = await res.json();
          showToast(errData.error || 'Failed to update flag', 'error');
        }
      } else {
        // Create new flag
        const res = await fetch('/api/flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const created = await res.json();
          showToast(`Flag "${created.name}" created successfully`, 'success');
          setIsModalOpen(false);
          await loadAllData();
        } else {
          const errData = await res.json();
          showToast(errData.error || 'Failed to create flag', 'error');
        }
      }
    } catch (err) {
      console.error('Error saving flag:', err);
      showToast('Server communication error', 'error');
    }
  };

  const handleDeleteFlag = async (flag) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete flag "${flag.name}"?\n\nGovernance Note: System never auto-deletes. This requires explicit human confirmation.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/flags/${flag.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`Flag "${flag.name}" deleted`, 'success');
        if (selectedFlagDetail && selectedFlagDetail.flag.id === flag.id) {
          setSelectedFlagDetail(null);
        }
        await loadAllData();
      }
    } catch (err) {
      console.error('Failed to delete flag:', err);
      showToast('Failed to delete feature flag', 'error');
    }
  };

  const handleResetSeeds = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-seeds', { method: 'POST' });
      if (res.ok) {
        showToast('Database reset and 10 realistic flags re-seeded successfully!', 'success');
        setSelectedFlagDetail(null);
        await loadAllData();
      }
    } catch (err) {
      console.error('Failed to reset seed data:', err);
      showToast('Failed to reset demo data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const staleTotal = stats ? (stats.stale + stats.expired) : 0;

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 200,
          background: toast.type === 'error' ? 'var(--expired)' : 'var(--bg-elevated)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.88rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        staleCount={staleTotal} 
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header 
          activeTab={activeTab}
          onOpenCreate={() => { setEditingFlag(null); setIsModalOpen(true); }}
          onResetSeeds={handleResetSeeds}
          isResetting={isResetting}
        />

        <main className="page-body">
          {activeTab === 'dashboard' && (
            <DashboardView 
              stats={stats} 
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectFlag={handleSelectFlag}
            />
          )}

          {activeTab === 'flags' && (
            <FlagsTableView 
              flags={flags}
              onToggleStatus={handleToggleStatus}
              onSelectFlag={handleSelectFlag}
              onEditFlag={(flag) => { setEditingFlag(flag); setIsModalOpen(true); }}
              onDeleteFlag={handleDeleteFlag}
              onSimulateUsage={handleSimulateUsage}
            />
          )}

          {activeTab === 'stale' && (
            <StaleFlagsView 
              flags={flags}
              onUpdateCleanupStatus={handleUpdateCleanupStatus}
              onSelectFlag={handleSelectFlag}
              onSimulateUsage={handleSimulateUsage}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTrailView 
              auditLogs={auditLogs}
              onSelectFlag={handleSelectFlag}
            />
          )}

          {activeTab === 'info' && (
            <ProjectInfoView />
          )}
        </main>
      </div>

      {/* Flag Details Inspector Drawer */}
      {selectedFlagDetail && (
        <FlagDetailDrawer 
          flagDetail={selectedFlagDetail}
          onClose={() => setSelectedFlagDetail(null)}
          onToggleStatus={handleToggleStatus}
          onUpdateCleanupStatus={handleUpdateCleanupStatus}
          onSimulateUsage={handleSimulateUsage}
          onEditFlag={(flag) => { setEditingFlag(flag); setIsModalOpen(true); }}
        />
      )}

      {/* Create / Edit Flag Modal */}
      <FlagModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingFlag(null); }}
        onSave={handleSaveFlag}
        editingFlag={editingFlag}
      />
    </div>
  );
}
