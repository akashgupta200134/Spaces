'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LifeBuoy,
  Send,
  Lock,
  UserCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  Loader2,
  X,
  MessageSquare,
} from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  assignedTo?: string | null;
  user: { name: string | null; email: string };
  assignedAdmin?: { id: string; name: string | null; email: string } | null;
  updatedAt: string;
}

interface Message {
  id: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  sender: { id: string; name: string | null; role: string };
}

interface TicketDetail extends Ticket {
  messages: Message[];
}

export default function HelpdeskDashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Input states
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Loaders & Alerts
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submittingMsg, setSubmittingMsg] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Load Ticket Queue
  useEffect(() => {
    let ignore = false;

    async function fetchTicketQueue() {
      try {
        const query = new URLSearchParams();
        if (priorityFilter !== 'ALL') query.append('priority', priorityFilter);
        if (statusFilter !== 'ALL') query.append('status', statusFilter);

        const res = await fetch(`/api/admin/tickets?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to load helpdesk queue');

        const json = await res.json();
        if (!ignore) {
          setTickets(json.data || []);
          if (json.data?.length > 0 && !selectedTicketId) {
            setSelectedTicketId(json.data[0].id);
          }
        }
      } catch (err: any) {
        if (!ignore) setNotice({ type: 'error', message: err.message });
      } finally {
        if (!ignore) setLoadingList(false);
      }
    }

    fetchTicketQueue();
    return () => {
      ignore = true;
    };
  }, [priorityFilter, statusFilter]);

  // Load Active Ticket Thread
  const loadTicketDetails = useCallback(async (ticketId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`);
      if (!res.ok) throw new Error('Failed to fetch ticket messages');
      const json = await res.json();
      setActiveTicket(json.data);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId, loadTicketDetails]);

  // Send Public Message or Internal Note
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId || !user?.id) return;

    setSubmittingMsg(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          message: replyText,
          isInternal: isInternalNote,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      const json = await res.json();

      setActiveTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, json.data] } : null
      );
      setReplyText('');
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSubmittingMsg(false);
    }
  };

  // Status or Priority Toggle
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      setActiveTicket((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicketId ? { ...t, status: newStatus as any } : t))
      );
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <LifeBuoy className="w-7 h-7 text-indigo-400" />
              Central Support & Ticket Escalations
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Multi-agent helpdesk desk for public resolution and internal staff notes.
            </p>
          </div>
        </div>

        {notice && (
          <div
            className={`p-3 border rounded-xl text-xs flex items-center justify-between ${
              notice.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <span>{notice.message}</span>
            <button onClick={() => setNotice(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
          {/* Left Panel: Ticket Queue */}
          <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {/* Filters */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-1.5 w-full focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-1.5 w-full focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {loadingList ? (
                <div className="p-8 text-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                  Loading tickets...
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No tickets found.</div>
              ) : (
                tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full p-4 text-left transition flex flex-col gap-1.5 ${
                      selectedTicketId === t.id
                        ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'URGENT'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs text-white truncate">{t.subject}</h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {t.user.name || t.user.email}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Active Thread */}
          <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {loadingDetail ? (
              <div className="m-auto text-slate-500 text-xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                Loading ticket thread...
              </div>
            ) : !activeTicket ? (
              <div className="m-auto text-slate-500 text-xs">
                Select a ticket to view conversation.
              </div>
            ) : (
              <>
                {/* Active Ticket Action Header */}
                <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{activeTicket.subject}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Requester: {activeTicket.user.name || activeTicket.user.email}</span>
                      <span>•</span>
                      <span>Assigned: {activeTicket.assignedAdmin?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <select
                      value={activeTicket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-indigo-300 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {activeTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-2xl text-xs max-w-[85%] space-y-1.5 ${
                        msg.isInternal
                          ? 'bg-amber-950/40 border border-amber-500/30 text-amber-200 ml-auto'
                          : msg.sender.role === 'ADMIN'
                          ? 'bg-indigo-950/50 border border-indigo-500/30 text-slate-200 ml-auto'
                          : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 mr-auto'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-75 pb-1 border-b border-white/10">
                        <span className="font-bold flex items-center gap-1">
                          {msg.isInternal && <Lock className="w-3 h-3 text-amber-400" />}
                          {msg.sender.name || 'Support Agent'} {msg.isInternal ? '(Internal Note)' : ''}
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-slate-950/80 border-t border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                          !isInternalNote
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Public Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                          isInternalNote
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Lock className="w-3 h-3" /> Internal Staff Note
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isInternalNote
                          ? 'Write internal note visible only to admins...'
                          : 'Type your reply to the user...'
                      }
                      className={`w-full p-2.5 bg-slate-900 border rounded-xl text-xs text-white focus:outline-none resize-none h-16 ${
                        isInternalNote ? 'border-amber-500/40 focus:border-amber-500' : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={submittingMsg || !replyText.trim()}
                      className={`px-4 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition ${
                        isInternalNote
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      } disabled:opacity-50`}
                    >
                      {submittingMsg ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}