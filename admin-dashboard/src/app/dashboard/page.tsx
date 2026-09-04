'use client';

import React, { useEffect, useState } from 'react';
import API from '@/lib/api';
import { Users, ShieldCheck, UserCheck, Clock, Loader2, AlertCircle } from 'lucide-react';

interface StatsData {
  totalUsers: number;
  verifiedUsers: number;
  adminCount: number;
  pendingVerifications: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/admin/stats');
      setStats(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to connect to the database.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Fetching metrics from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchStats}
          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Accounts',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
    },
    {
      label: 'Verified Accounts',
      value: stats?.verifiedUsers ?? 0,
      icon: UserCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Administrators',
      value: stats?.adminCount ?? 0,
      icon: ShieldCheck,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Pending Verification',
      value: stats?.pendingVerifications ?? 0,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          Live statistics synchronized directly with your Neon PostgreSQL database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">{card.label}</p>
                <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mt-4">{card.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}