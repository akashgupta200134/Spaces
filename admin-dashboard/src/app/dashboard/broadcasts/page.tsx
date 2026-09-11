'use client';

import React, { useState, useEffect } from 'react';
import { Send, Bell, Megaphone, Wrench, AlertTriangle, History, CheckCircle2, Building2 } from 'lucide-react';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  targetRole: string;
  createdAt: string;
}

interface SpaceOption {
  id: string;
  name: string;
}

export default function BroadcastEnginePage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('ANNOUNCEMENT');
  const [targetRole, setTargetRole] = useState('ALL');
  const [spaceId, setSpaceId] = useState('');
  const [spaces, setSpaces] = useState<SpaceOption[]>([]);
  
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [historyRes, spacesRes] = await Promise.all([
          fetch('/api/admin/broadcasts'),
          fetch('/api/admin/spaces'),
        ]);

        const historyData = await historyRes.json();
        const spacesData = await spacesRes.json();

        if (isMounted) {
          setHistory(historyData.broadcasts || []);
          setSpaces(spacesData.spaces || spacesData || []);
        }
      } catch (err) {
        console.error('Failed to load broadcast data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (type === 'LOCATION_NOTICE' && !spaceId) {
      alert('Please select a target space for location notices.');
      return;
    }

    setSending(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          targetRole,
          spaceId: type === 'LOCATION_NOTICE' ? spaceId : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Broadcast sent to ${data.data?.recipientCount || 0} targeted users.`);
        setTitle('');
        setMessage('');
        setSpaceId('');

        const updatedRes = await fetch('/api/admin/broadcasts');
        const updatedData = await updatedRes.json();
        setHistory(updatedData.broadcasts || []);
      }
    } catch (err) {
      console.error('Broadcast failed:', err);
    } finally {
      setSending(false);
    }
  };

  const getTypeBadge = (typeStr: string) => {
    switch (typeStr) {
      case 'MAINTENANCE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1"><Wrench className="h-3 w-3" /> Maintenance</span>;
      case 'ALERT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Urgent Alert</span>;
      case 'LOCATION_NOTICE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1"><Bell className="h-3 w-3" /> Location Notice</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1"><Megaphone className="h-3 w-3" /> Announcement</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-indigo-400" />
          Broadcast Notification Engine
        </h1>
        <p className="text-sm text-slate-400">
          Push real-time announcements, maintenance notices, and emergency alerts to target roles or specific locations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composition Form */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Send className="h-4 w-4 text-indigo-400" /> Compose Broadcast
          </h2>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Platform Users & Managers</option>
                <option value="USER">End Users Only (USER)</option>
                <option value="SPACE_MANAGER">Space Managers Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notification Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ANNOUNCEMENT">Platform Announcement</option>
                <option value="MAINTENANCE">Scheduled Maintenance</option>
                <option value="LOCATION_NOTICE">Location Specific Notice</option>
                <option value="ALERT">Urgent System Alert</option>
              </select>
            </div>

            {/* Conditional Target Space Selector */}
            {type === 'LOCATION_NOTICE' && (
              <div className="p-3 bg-slate-950/80 border border-indigo-500/30 rounded-lg space-y-2">
                <label className="block text-xs font-medium text-indigo-300 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Select Specific Space
                </label>
                <select
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Space --</option>
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
              <input
                type="text"
                placeholder="Notice Subject..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Message Content</label>
              <textarea
                rows={4}
                placeholder="Broadcast details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Dispatching...' : 'Push Broadcast'}
            </button>
          </form>
        </div>

        {/* Broadcast History Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-400" /> Dispatch History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Dispatched At</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Title & Message</th>
                  <th className="px-4 py-3">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">
                      Loading broadcast log...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">
                      No broadcast history recorded.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getTypeBadge(item.type)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">{item.title}</div>
                        <div className="text-xs text-slate-400 line-clamp-1">{item.message}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-indigo-400 font-mono whitespace-nowrap">
                        {item.targetRole}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

