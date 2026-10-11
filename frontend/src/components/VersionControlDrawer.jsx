import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  GitCommit, GitBranch, X, Plus, RotateCcw, 
  Check, ChevronRight, FileCode, ArrowLeft
} from 'lucide-react';

import { API_URL } from '../config';

export default function VersionControlDrawer({ 
  isOpen, 
  onClose, 
  token, 
  activeNotebook, 
  onRollback 
}) {
  const [versions, setVersions] = useState([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [activeDiff, setActiveDiff] = useState(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  useEffect(() => {
    if (isOpen && activeNotebook) {
      fetchVersions();
      setActiveDiff(null);
    }
  }, [isOpen, activeNotebook]);

  const fetchVersions = async () => {
    if (!activeNotebook) return;
    try {
      const res = await axios.get(`${API_URL}/api/versions/list`, {
        params: { notebook_id: activeNotebook.id },
        headers: { Authorization: `Bearer ${token}` }
      });
      setVersions(res.data.versions || []);
    } catch (e) {}
  };

  if (!isOpen) return null;

  const handleCommit = async () => {
    if (!commitMessage.trim() || !activeNotebook) return;
    setIsCommitting(true);
    try {
      await axios.post(`${API_URL}/api/versions/commit`, {
        notebook_id: activeNotebook.id,
        commit_message: commitMessage,
        cells: activeNotebook.cells
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommitMessage('');
      fetchVersions();
    } catch (err) {
      alert("Failed to commit version: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsCommitting(false);
    }
  };

  const handleInspectDiff = async (version) => {
    setIsLoadingDiff(true);
    try {
      const res = await axios.post(`${API_URL}/api/versions/diff`, {
        v1_id: version.id,
        current_cells: activeNotebook.cells
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveDiff({ ...res.data, version });
    } catch (err) {
      alert("Failed to calculate diff: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsLoadingDiff(false);
    }
  };

  const handleRollbackVersion = async (versionId) => {
    if (!window.confirm(`Rollback notebook to commit ${versionId}? Uncommitted changes will be replaced.`)) return;
    try {
      const res = await axios.post(`${API_URL}/api/versions/rollback`, {
        version_id: versionId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onRollback) {
        onRollback(res.data.cells);
      }
      onClose();
    } catch (err) {
      alert("Rollback failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-container" style={{ width: activeDiff ? '720px' : '480px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="git-icon-badge">
              <GitBranch size={16} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)' }}>
                Strategy Git & Version Control
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {activeNotebook?.title || 'Notebook'} • Commit Checkpoints & Diffs
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {activeDiff ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <button className="btn-secondary" onClick={() => setActiveDiff(null)}>
                  <ArrowLeft size={13} /> Back to History
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="diff-pill add">+{activeDiff.total_additions} lines</span>
                  <span className="diff-pill del">-{activeDiff.total_deletions} lines</span>
                </div>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
                Comparing Commit <code style={{ color: '#2563eb' }}>{activeDiff.base_version}</code> vs Current Working State:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto' }}>
                {activeDiff.cell_diffs.map((cd, i) => (
                  <div key={i} className="diff-cell-card">
                    <div className="diff-cell-header">
                      <span>Cell #{cd.cell_index} ({cd.cell_type.toUpperCase()})</span>
                      <span>
                        {cd.has_changes ? `${cd.additions} additions, ${cd.deletions} deletions` : 'Unchanged'}
                      </span>
                    </div>
                    <pre className="diff-code-block">
                      {cd.diff_lines.map((l, li) => (
                        <div key={li} className={`diff-line ${l.type}`}>
                          <span className="diff-prefix">{l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' '}</span>
                          <span className="diff-text">{l.text}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Commit Input Box */}
              <div style={{ background: '#F9FAFB', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <label className="field-label">COMMIT NEW CHECKPOINT</label>
                <input 
                  className="input-field"
                  placeholder="e.g. Optimized VWAP filter with 2-std deviation band..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(); }}
                  style={{ marginBottom: '10px' }}
                />
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleCommit}
                  disabled={isCommitting || !commitMessage.trim()}
                >
                  <GitCommit size={14} /> {isCommitting ? 'Saving Checkpoint...' : 'Commit Snapshot'}
                </button>
              </div>

              {/* Version History List */}
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                COMMIT TIMELINE ({versions.length})
              </div>

              {versions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-placeholder)', fontSize: '13px' }}>
                  No commits yet. Commit a snapshot above to establish a baseline.
                </div>
              ) : (
                <div className="commit-timeline">
                  {versions.map((ver, idx) => (
                    <div key={ver.id} className="commit-item">
                      <div className="commit-bullet">
                        <GitCommit size={12} color="#ffffff" />
                      </div>
                      <div className="commit-content">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className="commit-hash">{ver.id}</span>
                          <span className="commit-time">{ver.created_at}</span>
                        </div>
                        <div className="commit-message">
                          {ver.commit_message}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            by <b>{ver.author}</b> • {ver.cell_count} cells
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => handleInspectDiff(ver)}
                              title="Compare code diff against current notebook"
                            >
                              Diff
                            </button>
                            <button 
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444' }}
                              onClick={() => handleRollbackVersion(ver.id)}
                              title="Restore notebook to this checkpoint"
                            >
                              Rollback
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
