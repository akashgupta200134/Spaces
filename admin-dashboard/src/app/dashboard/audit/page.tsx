'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShieldAlert, User, Eye, X } from 'lucide-react';

interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
  actor?: { id: string; name: string; email: string; role: string };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedActorLogs, setSelectedActorLogs] = useState<AuditLog[] | null>(null);
  const [selectedActorName, setSelectedActorName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLogs = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        if (actionFilter) query.append('action', actionFilter);

        const res = await fetch(`/api/admin/audit-logs?${query.toString()}`);
        const data = await res.json();
        
        if (isMounted) {
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Defer execution to a microtask to avoid synchronous setState inside effect body
    Promise.resolve().then(() => {
      if (isMounted) {
        loadLogs();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [search, actionFilter]);

  const fetchActorTrace = useCallback(async (actorId: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/audit-logs/actor/${actorId}`);
      const data = await res.json();
      setSelectedActorLogs(data.logs || []);
      setSelectedActorName(name);
    } catch (err) {
      console.error('Failed to fetch actor trace:', err);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-indigo-400" />
            Audit Logging & System Diagnostics
          </h1>
          <p className="text-sm text-slate-400">
            Real-time security logs, high-privilege action tracking, and actor traceability.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search action, entity type, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
        >
          <option value="">All Actions</option>
          <option value="BOOKING_OVERRIDE">Booking Override</option>
          <option value="SEAT_BLOCK">Seat Block</option>
          <option value="MANAGER_ASSIGN">Manager Assign</option>
          <option value="REFUND_ISSUED">Refund Issued</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-right">Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Loading security logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">
                        {log.actor?.name || 'System / Unknown'}
                      </div>
                      <div className="text-xs text-indigo-400">{log.actorRole}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {log.entityType} {log.entityId && `(${log.entityId.slice(0, 8)}...)`}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                      {log.ipAddress || 'Internal'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          fetchActorTrace(
                            log.actorId,
                            log.actor?.name || log.actorId
                          )
                        }
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
                      >
                        <Eye className="h-3.5 w-3.5" /> Trace Actor
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actor Trace Modal */}
      {selectedActorLogs && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-400" />
                Actor Trace: {selectedActorName}
              </h3>
              <button
                onClick={() => setSelectedActorLogs(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {selectedActorLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs space-y-1"
                >
                  <div className="flex justify-between text-slate-400">
                    <span className="font-semibold text-indigo-400">{log.action}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-300">
                    Target: {log.entityType} ({log.entityId || 'N/A'})
                  </div>
                  {log.details && (
                    <pre className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-400 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}