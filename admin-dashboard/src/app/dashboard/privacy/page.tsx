'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  UserX,
  FileCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  History,
  X,
} from 'lucide-react';

interface PendingUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  deletionRequestedAt: string;
  deletionStatus: string;
}

interface ActiveVersion {
  id: string;
  version: string;
  title: string;
  content: string | null;
  createdAt: string;
}

export default function PrivacyManagementPage() {
  const [activeTab, setActiveTab] = useState<'deletions' | 'terms'>('deletions');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [activeVersion, setActiveVersion] = useState<ActiveVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [versionForm, setVersionForm] = useState({ version: '', title: '', content: '' });

  // Safe Date Formatter
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? 'Invalid Date' : parsed.toLocaleDateString();
  };

  const fetchData = useCallback(async () => {
    const [delRes, termsRes] = await Promise.all([
      fetch('/api/admin/privacy/deletions'),
      fetch('/api/admin/privacy/terms'),
    ]);

    if (!delRes.ok) {
      const errData = await delRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch deletion queue.');
    }

    if (!termsRes.ok) {
      const errData = await termsRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch consent version details.');
    }

    const delJson = await delRes.json();
    const termsJson = await termsRes.json();

    return {
      users: (delJson.data || []) as PendingUser[],
      version: (termsJson.data || null) as ActiveVersion | null,
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchData()
      .then(({ users, version }) => {
        if (isMounted) {
          setPendingUsers(users);
          setActiveVersion(version);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setNotice({ type: 'error', message: err.message });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const handleRefresh = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const { users, version } = await fetchData();
      setPendingUsers(users);
      setActiveVersion(version);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDeletion = async (userId: string) => {
    if (!confirm('This action will permanently anonymize user PII and clear unique identifiers. Continue?')) {
      return;
    }
    
    setProcessingId(userId);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/privacy/deletions/${userId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.message || 'Failed to process account deletion.');
      }

      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      setNotice({ type: 'success', message: resData.message || 'User account successfully anonymized.' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBumpVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const res = await fetch('/api/admin/privacy/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionForm),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.message || 'Failed to update terms version.');
      }

      setShowModal(false);
      setVersionForm({ version: '', title: '', content: '' });
      
      // Update UI with newly created version
      if (resData.data) {
        setActiveVersion(resData.data);
      } else {
        await handleRefresh();
      }

      setNotice({
        type: 'success',
        message: 'New consent version activated. Users will be prompted to re-accept.',
      });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-7 h-7 text-indigo-400" />
              Privacy & Compliance Hub
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Process GDPR erasure requests and enforce consent versioning.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition self-start sm:self-auto disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Dynamic Alert Banner */}
        {notice && (
          <div
            className={`p-4 border rounded-xl text-xs flex items-center justify-between transition ${
              notice.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle
                className={`w-4 h-4 shrink-0 ${
                  notice.type === 'error' ? 'text-rose-400' : 'text-emerald-400'
                }`}
              />
              <span>{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('deletions')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'deletions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserX className="w-4 h-4" />
            Pending Deletions ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'terms'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Consent Version Control
          </button>
        </div>

        {/* Deletion Queue Tab */}
        {activeTab === 'deletions' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Account Erasure Requests
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">Requested On</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                        Loading requests...
                      </td>
                    </tr>
                  ) : pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No active erasure requests.
                      </td>
                    </tr>
                  ) : (
                    pendingUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-4">
                          <div className="font-semibold text-white">
                            {user.name || 'Unnamed User'}
                          </div>
                          <div className="text-[11px] text-slate-400">{user.email}</div>
                          {user.phone && (
                            <div className="text-[10px] text-slate-500">{user.phone}</div>
                          )}
                        </td>
                        <td className="p-4 text-slate-400">
                          {formatDate(user.deletionRequestedAt)}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {user.deletionStatus || 'PENDING'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleProcessDeletion(user.id)}
                            disabled={processingId === user.id}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-50"
                          >
                            {processingId === user.id && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            Execute Erasure
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Terms Version Tab */}
        {activeTab === 'terms' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Active Global Consent Version
              </div>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                {activeVersion
                  ? `Version ${activeVersion.version} — ${activeVersion.title}`
                  : 'No active version configured'}
              </div>
              {activeVersion && (
                <p className="text-slate-400 text-xs mt-1">
                  Enforced starting {formatDate(activeVersion.createdAt)}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition flex items-center gap-2 self-start sm:self-auto"
            >
              <History className="w-4 h-4" />
              Bump Consent Version
            </button>
          </div>
        )}
      </div>

      {/* Bump Version Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleBumpVersion}
            className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Mandate New Terms & Consent Version
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Version String
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. v2026.1"
                  value={versionForm.version}
                  onChange={(e) =>
                    setVersionForm({ ...versionForm, version: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Terms of Service & Privacy Update"
                  value={versionForm.title}
                  onChange={(e) =>
                    setVersionForm({ ...versionForm, title: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Changelog Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={versionForm.content}
                  onChange={(e) =>
                    setVersionForm({ ...versionForm, content: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Publish Version
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}