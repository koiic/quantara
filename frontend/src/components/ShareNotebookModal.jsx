import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, UserPlus, X, Copy, Check, Shield, Trash2, 
  ExternalLink, Eye, Edit3, Crown, AlertCircle 
} from 'lucide-react';

export default function ShareNotebookModal({ notebook, token, apiUrl, currentUser, onClose }) {
  const [shares, setShares] = useState([]);
  const [owner, setOwner] = useState(notebook?.owner || '');
  const [userRole, setUserRole] = useState(notebook?.role || 'owner');
  const [loading, setLoading] = useState(true);
  const [inviteTarget, setInviteTarget] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate shareable link based on current browser location
  const shareableUrl = `${window.location.origin}/?notebook=${notebook?.id}`;

  const fetchShares = async () => {
    if (!notebook?.id || !token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/notebooks/${notebook.id}/shares`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShares(res.data.shares || []);
      setOwner(res.data.owner || notebook.owner);
      setUserRole(res.data.user_role || notebook.role || 'owner');
    } catch (err) {
      console.error("Failed to load shares", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, [notebook?.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteTarget.trim()) return;
    setInviting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await axios.post(`${apiUrl}/api/notebooks/${notebook.id}/share`, {
        user_or_email: inviteTarget.trim(),
        role: inviteRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg(`Access granted to ${inviteTarget} as ${inviteRole.toUpperCase()}`);
      setInviteTarget('');
      fetchShares();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to invite collaborator");
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (target) => {
    if (!confirm(`Revoke access for ${target}?`)) return;
    try {
      await axios.delete(`${apiUrl}/api/notebooks/${notebook.id}/shares/${encodeURIComponent(target)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchShares();
    } catch (err) {
      alert("Failed to revoke access: " + (err.response?.data?.detail || err.message));
    }
  };

  const isOwner = userRole === 'owner';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '560px', width: 'min(560px, 94vw)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(2, 132, 199, 0.15)',
              color: '#38bdf8',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                Share "{notebook?.title || 'Untitled'}"
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                Manage team permissions, role access, and invitation links
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn-icon"
            style={{ color: '#94a3b8', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
          {/* Quick Share Link Box */}
          <div style={{
            background: '#070b14',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <ExternalLink size={12} color="#38bdf8" /> Shareable Direct Link
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                readOnly 
                value={shareableUrl} 
                style={{
                  flex: '1 1 200px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  background: '#131b2e',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={handleCopyLink}
                className="btn-secondary"
                style={{
                  fontSize: '12px',
                  padding: '6px 14px',
                  background: copiedLink ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                  borderColor: copiedLink ? '#10b981' : '#334155',
                  color: copiedLink ? '#34d399' : '#f8fafc'
                }}
              >
                {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Invite Form (Owner Only) */}
          {isOwner ? (
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <UserPlus size={13} color="#38bdf8" /> Invite Collaborator
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {successMsg && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Check size={14} /> {successMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input 
                  type="text"
                  placeholder="Colleague username or email (e.g. quant2@firm.com)"
                  value={inviteTarget}
                  onChange={(e) => setInviteTarget(e.target.value)}
                  style={{
                    flex: '1 1 180px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    background: '#131b2e',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    flex: '0 1 150px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    background: '#131b2e',
                    color: '#f8fafc',
                    cursor: 'pointer'
                  }}
                >
                  <option value="editor">Editor (Can edit & run)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                <b>Editor:</b> Can edit notebook code, save changes, and execute kernel cells.<br/>
                <b>Viewer:</b> Read-only presentation mode. Code editing & cell runs are disabled.
              </div>
            </form>
          ) : (
            <div style={{
              background: '#070b14',
              border: '1px solid #1e293b',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              You have <b>{userRole.toUpperCase()}</b> permissions. Only the notebook owner (<b>{owner}</b>) can invite new collaborators.
            </div>
          )}

          {/* Collaborator List */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              People with Access
            </div>

            <div style={{
              border: '1px solid #1e293b',
              borderRadius: '8px',
              background: '#070b14',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              {/* Owner Item */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid #1e293b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px'
                  }}>
                    <Crown size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                      {owner} {owner === currentUser?.username ? '(You)' : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Notebook Owner</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  Owner
                </span>
              </div>

              {/* Shared Collaborators */}
              {shares.map(s => (
                <div 
                  key={s.id || s.user_or_email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid #1e293b'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: s.role === 'editor' ? 'rgba(2, 132, 199, 0.15)' : '#1e293b',
                      color: s.role === 'editor' ? '#38bdf8' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '12px'
                    }}>
                      {s.role === 'editor' ? <Edit3 size={14} /> : <Eye size={14} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#f8fafc' }}>
                        {s.user_or_email}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Invited by {s.invited_by} • {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: s.role === 'editor' ? 'rgba(2, 132, 199, 0.15)' : '#1e293b',
                      color: s.role === 'editor' ? '#38bdf8' : '#cbd5e1',
                      border: s.role === 'editor' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #334155',
                      textTransform: 'capitalize'
                    }}>
                      {s.role}
                    </span>

                    {isOwner && (
                      <button
                        onClick={() => handleRevoke(s.user_or_email)}
                        className="btn-icon"
                        title={`Revoke access for ${s.user_or_email}`}
                        style={{ color: '#ef4444', padding: '4px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {shares.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                  No additional collaborators have been invited yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#f8fafc'
        }}>
          <button 
            onClick={onClose} 
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '6px 18px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
