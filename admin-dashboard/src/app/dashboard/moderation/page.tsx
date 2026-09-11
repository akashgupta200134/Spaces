'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  MessageSquareOff,
  Eye,
  EyeOff,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Star,
  CheckCircle2,
  X,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  overallRating: number;
  environmentRating?: number | null;
  cleanlinessRating?: number | null;
  wifiRating?: number | null;
  comfortRating?: number | null;
  staffRating?: number | null;
  valueRating?: number | null;
  comment?: string | null;
  isHidden: boolean;
  createdAt: string;
  user: { name: string | null; email: string };
  space: { id: string; name: string; ratingAvg: number };
}

interface AnomalyAlert {
  spaceId: string;
  spaceName: string;
  historicalAvg: number;
  recentAvg: number;
  ratingDrop: number;
  recentCount: number;
  severity: 'CRITICAL' | 'WARNING';
}

export default function ContentModerationPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'alerts'>('queue');
  const [filter, setFilter] = useState<'all' | 'hidden' | 'low_rating'>('all');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Fetch data on mount and whenever filter changes
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [revRes, alertRes] = await Promise.all([
          fetch(`/api/admin/moderation/reviews?filter=${filter}`),
          fetch('/api/admin/moderation/alerts'),
        ]);

        if (!revRes.ok) throw new Error('Failed to fetch reviews queue');
        if (!alertRes.ok) throw new Error('Failed to fetch rating anomaly alerts');

        const revData = await revRes.json();
        const alertData = await alertRes.json();

        if (!ignore) {
          setReviews(revData.data || []);
          setAlerts(alertData.data || []);
        }
      } catch (err: any) {
        if (!ignore) {
          setNotice({ type: 'error', message: err.message });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [filter]);

  // Event handler for user switching filters
  const handleFilterChange = (newFilter: 'all' | 'hidden' | 'low_rating') => {
    setLoading(true);
    setFilter(newFilter);
  };

  // Event handler for manual refresh
  const handleRefresh = async () => {
    setLoading(true);
    setNotice(null);

    try {
      const [revRes, alertRes] = await Promise.all([
        fetch(`/api/admin/moderation/reviews?filter=${filter}`),
        fetch('/api/admin/moderation/alerts'),
      ]);

      if (!revRes.ok) throw new Error('Failed to fetch reviews queue');
      if (!alertRes.ok) throw new Error('Failed to fetch rating anomaly alerts');

      const revData = await revRes.json();
      const alertData = await alertRes.json();

      setReviews(revData.data || []);
      setAlerts(alertData.data || []);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (reviewId: string, currentStatus: boolean) => {
    setProcessingId(reviewId);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/moderation/reviews/${reviewId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !currentStatus }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.message || 'Failed to update review status.');
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isHidden: !currentStatus } : r))
      );
      setNotice({
        type: 'success',
        message: `Review ${!currentStatus ? 'hidden' : 'restored'} successfully. Space rating updated.`,
      });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setProcessingId(null);
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
              Content Moderation & Reputation Desk
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Review flagged content, manage toxic reviews, and monitor space rating anomaly alerts.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition self-start sm:self-auto"
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
            <span>{notice.message}</span>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'queue'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareOff className="w-4 h-4" />
            Review Queue ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'alerts'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Rating Anomaly Alerts ({alerts.length})
          </button>
        </div>

        {/* Moderation Queue Tab */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex gap-2 text-xs">
              {(
                [
                  { id: 'all', label: 'All Reviews' },
                  { id: 'low_rating', label: 'Low Rating (≤2★)' },
                  { id: 'hidden', label: 'Hidden Reviews' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFilterChange(f.id)}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    filter === f.id
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">User & Space</th>
                      <th className="p-4">Overall & Feedback</th>
                      <th className="p-4">Sub-Ratings</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                          Loading queue items...
                        </td>
                      </tr>
                    ) : reviews.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No reviews found matching this filter.
                        </td>
                      </tr>
                    ) : (
                      reviews.map((rev) => (
                        <tr key={rev.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-4">
                            <div className="font-semibold text-white">
                              {rev.user.name || 'Anonymous User'}
                            </div>
                            <div className="text-[11px] text-slate-400">{rev.user.email}</div>
                            <div className="text-[10px] text-indigo-400 mt-1">{rev.space.name}</div>
                          </td>
                          <td className="p-4 max-w-xs">
                            <div className="flex items-center gap-1 text-amber-400 mb-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span className="font-bold text-white">{rev.overallRating}/5</span>
                            </div>
                            <p className="text-slate-300 text-xs italic">
                              {rev.comment || 'No comment provided'}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                              {rev.cleanlinessRating && <span>Clean: {rev.cleanlinessRating}★</span>}
                              {rev.wifiRating && <span>WiFi: {rev.wifiRating}★</span>}
                              {rev.comfortRating && <span>Comfort: {rev.comfortRating}★</span>}
                              {rev.staffRating && <span>Staff: {rev.staffRating}★</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            {rev.isHidden ? (
                              <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-bold">
                                Hidden
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                                Visible
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => toggleVisibility(rev.id, rev.isHidden)}
                              disabled={processingId === rev.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                                rev.isHidden
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white'
                              }`}
                            >
                              {processingId === rev.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : rev.isHidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" /> Unhide
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" /> Hide
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Rating Anomaly Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.length === 0 ? (
              <div className="col-span-full p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                No rating drop anomalies detected across registered spaces.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.spaceId}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {alert.severity} DROP
                    </span>
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{alert.spaceName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {alert.recentCount} recent reviews evaluated
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Historical Avg</div>
                      <div className="text-sm font-bold text-slate-200">{alert.historicalAvg} ★</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">30-Day Recent Avg</div>
                      <div className="text-sm font-bold text-rose-400">{alert.recentAvg} ★</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}