'use client';

import React, { useEffect, useState } from 'react';
import API from '@/lib/api';
import {
  UserPlus,
  Loader2,
  Building2,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle2,
  Phone,
  Mail,
  X,
  AlertTriangle,
} from 'lucide-react';

interface SpaceOption {
  id: string;
  name: string;
  location: { city: string; state: string };
}

interface SpaceManagerItem {
  id: string; // User ID
  name: string;
  email: string;
  phone: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  spaceManager: {
    id: string;
    spaceId: string | null;
    space: {
      id: string;
      name: string;
      location: { city: string; state: string };
    } | null;
  } | null;
}

export default function SpaceManagersPage() {
  const [managers, setManagers] = useState<SpaceManagerItem[]>([]);
  const [spaces, setSpaces] = useState<SpaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingManager, setEditingManager] = useState<SpaceManagerItem | null>(null);
  const [passwordResetManager, setPasswordResetManager] = useState<SpaceManagerItem | null>(null);
  const [deletingManager, setDeletingManager] = useState<SpaceManagerItem | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [spaceId, setSpaceId] = useState('');

  // UI state feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchManagersAndSpaces();
  }, []);

  const fetchManagersAndSpaces = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [managersResult, spacesResult] = await Promise.allSettled([
        API.get('/admin/space-managers'),
        API.get('/admin/spaces'),
      ]);

      if (managersResult.status === 'fulfilled') {
        setManagers(managersResult.value.data);
      } else {
        const errorDetail =
          managersResult.reason?.response?.data?.message ||
          managersResult.reason?.message ||
          'Internal Server Error (500) fetching space managers.';
        console.error('Space Managers API Error:', managersResult.reason);
        setErrorMsg(`Space Managers endpoint error: ${errorDetail}`);
      }

      if (spacesResult.status === 'fulfilled') {
        setSpaces(spacesResult.value.data);
      } else {
        console.error('Spaces API Error:', spacesResult.reason);
      }
    } catch (err: any) {
      console.error('Unexpected error loading managers data:', err);
      setErrorMsg('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setSpaceId('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // --- 1. CREATE MANAGER ---
  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await API.post('/admin/space-managers', {
        name,
        email,
        phone,
        password,
        spaceId: spaceId || null,
      });
      setSuccessMsg('Space Manager account created successfully.');
      setTimeout(() => {
        setShowCreateModal(false);
        resetForm();
        fetchManagersAndSpaces();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create manager.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 2. EDIT / REASSIGN MANAGER ---
  const handleOpenEdit = (mgr: SpaceManagerItem) => {
    setEditingManager(mgr);
    setName(mgr.name);
    setEmail(mgr.email);
    setPhone(mgr.phone || '');
    setSpaceId(mgr.spaceManager?.spaceId || '');
    setErrorMsg(null);
  };

  const handleUpdateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManager) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await API.put(`/admin/space-managers/${editingManager.id}`, {
        name,
        email,
        phone,
        spaceId: spaceId || null,
      });
      setSuccessMsg('Manager details updated!');
      setTimeout(() => {
        setEditingManager(null);
        resetForm();
        fetchManagersAndSpaces();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update manager.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 3. RESET PASSWORD ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetManager) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await API.patch(`/admin/space-managers/${passwordResetManager.id}/password`, {
        newPassword: password,
      });
      setSuccessMsg('Password updated successfully!');
      setTimeout(() => {
        setPasswordResetManager(null);
        resetForm();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- 4. DELETE MANAGER ---
  const handleDeleteManager = async () => {
    if (!deletingManager) return;
    setSubmitting(true);
    try {
      await API.delete(`/admin/space-managers/${deletingManager.id}`);
      setDeletingManager(null);
      fetchManagersAndSpaces();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete manager.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredManagers = managers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.spaceManager?.space?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Space Managers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage workspace managers, update credentials, and handle space assignments.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20 w-fit"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Space Manager</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {errorMsg && !showCreateModal && !editingManager && !passwordResetManager && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-red-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={fetchManagersAndSpaces}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md text-xs font-medium transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search manager by name, email, or space..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{filteredManagers.length}</span> Managers
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span>Loading Space Managers...</span>
          </div>
        ) : filteredManagers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No space managers found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Manager Profile</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Assigned Space</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredManagers.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm uppercase">
                          {mgr.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{mgr.name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" /> {mgr.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {mgr.phone ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{mgr.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">Not provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {mgr.spaceManager?.space ? (
                        <div className="flex items-center space-x-2 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md w-fit text-xs font-medium">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>
                            {mgr.spaceManager.space.name} ({mgr.spaceManager.space.location.city})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-md">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {mgr.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          Pending OTP
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(mgr)}
                          title="Edit Details & Reassign Space"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            resetForm();
                            setPasswordResetManager(mgr);
                          }}
                          title="Update Password"
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingManager(mgr)}
                          title="Delete Account"
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- CREATE MANAGER MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-400" />
                Add New Space Manager
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">{errorMsg}</div>}
            {successMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">{successMsg}</div>}

            <form onSubmit={handleCreateManager} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="manager@workspace.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Login Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Space Location</label>
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned (Assign Later)</option>
                  {spaces.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.location.city}, {sp.location.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Create Account</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT / REASSIGN MODAL --- */}
      {editingManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-400" />
                Edit Manager & Assignment
              </h2>
              <button onClick={() => setEditingManager(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">{errorMsg}</div>}
            {successMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">{successMsg}</div>}

            <form onSubmit={handleUpdateManager} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Space</label>
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {spaces.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} ({sp.location.city}, {sp.location.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingManager(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Save Changes</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESET PASSWORD MODAL --- */}
      {passwordResetManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-400" />
                Change Manager Password
              </h2>
              <button onClick={() => setPasswordResetManager(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Updating password for <strong className="text-white">{passwordResetManager.name}</strong> ({passwordResetManager.email}).
            </p>

            {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">{errorMsg}</div>}
            {successMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">{successMsg}</div>}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordResetManager(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Update Password</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deletingManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Space Manager?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete <strong className="text-white">{deletingManager.name}</strong>? This will remove their login access and space assignment permanently.
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingManager(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteManager}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}