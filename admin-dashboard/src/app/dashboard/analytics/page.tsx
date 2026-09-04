'use client';

import React, { useState, useEffect, useMemo } from 'react';
import API from '@/lib/api';
import { 
  DollarSign, Users, Clock, Download, BarChart3, 
  Activity, Loader2, Building2, TrendingUp, AlertTriangle, 
  CheckCircle2, CreditCard, UserCheck, ShieldAlert, Star
} from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d' | '1y';
type MetricView = 'revenue' | 'bookings';

interface SpacePerformance {
  id: string;
  name: string;
  location: string;
  revenue: number;
  occupancy: number;
  bookingsCount: number;
  rating: number;
  reviewCount: number;
}

interface AnalyticsPayload {
  summary: {
    grossRevenue: number;
    netRevenue: number;
    totalRefunds: number;
    totalBookings: number;
    confirmedBookingsCount: number;
    cancellationRate: number;
    activeMemberships: number;
    reservedHours: number;
    overallOccupancy: number;
    totalCheckIns: number;
    overstayRate: number;
    noShowCount: number;
  };
  revenueBreakdown: {
    bookingRevenue: number;
    membershipRevenue: number;
  };
  timeSeries: Array<{ label: string; revenue: number; bookings: number }>;
  topSpaces: SpacePerformance[];
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [metricView, setMetricView] = useState<MetricView>('revenue');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/admin/analytics?timeRange=${timeRange}`);
        setData(response.data);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Dynamic Chart Points Generation
  const chartPoints = useMemo(() => {
    if (!data?.timeSeries || data.timeSeries.length === 0) return [];
    
    const rawValues = data.timeSeries.map(item => metricView === 'revenue' ? item.revenue : item.bookings);
    const max = Math.max(...rawValues, 1);
    const denominator = Math.max(rawValues.length - 1, 1);

    return data.timeSeries.map((item, idx) => {
      const val = metricView === 'revenue' ? item.revenue : item.bookings;
      return {
        x: (idx / denominator) * 560,
        y: 150 - (val / max) * 120,
        val,
        label: item.label
      };
    });
  }, [data, metricView]);

  const linePath = useMemo(() => {
    return chartPoints.reduce(
      (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
      ''
    );
  }, [chartPoints]);

  const areaPath = useMemo(() => {
    if (!chartPoints.length) return '';
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    return `${linePath} L ${last.x},170 L ${first.x},170 Z`;
  }, [linePath, chartPoints]);

  const bookingRevRatio = useMemo(() => {
    if (!data) return 0;
    const total = data.revenueBreakdown.bookingRevenue + data.revenueBreakdown.membershipRevenue;
    return total > 0 ? Math.round((data.revenueBreakdown.bookingRevenue / total) * 100) : 50;
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <BarChart3 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Executive Analytics Engine
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Live database aggregation across transactions, memberships, and occupancy statistics.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
              {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    timeRange === range
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => alert('Exporting full database analytics CSV...')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold rounded-xl transition shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Computing aggregated relational statistics...</p>
          </div>
        ) : (
          <>
            {/* Top-Line KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md hover:border-slate-700 transition duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Revenue</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mt-3">
                  ₹{(data?.summary.netRevenue || 0).toLocaleString('en-IN')}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  Gross: ₹{(data?.summary.grossRevenue || 0).toLocaleString('en-IN')}
                  {data?.summary.totalRefunds ? (
                    <span className="text-rose-400 font-medium">(-₹{data.summary.totalRefunds})</span>
                  ) : null}
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md hover:border-slate-700 transition duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bookings Volume</span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mt-3">
                  {(data?.summary.confirmedBookingsCount || 0).toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cancellation Rate: <span className="text-amber-400 font-semibold">{data?.summary.cancellationRate}%</span>
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md hover:border-slate-700 transition duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Memberships</span>
                  <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mt-3">
                  {(data?.summary.activeMemberships || 0).toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Avg. Occupancy: <span className="text-emerald-400 font-semibold">{data?.summary.overallOccupancy}%</span>
                </p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md hover:border-slate-700 transition duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Reserved Time</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mt-3">
                  {(data?.summary.reservedHours || 0).toLocaleString()} hrs
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Overstay Incidents: <span className="text-rose-400 font-semibold">{data?.summary.overstayRate}%</span>
                </p>
              </div>
            </div>

            {/* Interactive SVG Chart Section */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Performance Trajectory
                  </h2>
                  <p className="text-slate-400 text-xs">Hover data points to view precise segment details.</p>
                </div>

                <div className="inline-flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setMetricView('revenue')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      metricView === 'revenue' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Revenue Stream
                  </button>
                  <button
                    onClick={() => setMetricView('bookings')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      metricView === 'bookings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Booking Volume
                  </button>
                </div>
              </div>

              <div className="relative w-full h-64 pt-4">
                {/* SVG Line Chart */}
                <svg viewBox="0 0 560 180" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="30" x2="560" y2="30" stroke="#1e293b" strokeDasharray="4 4" />
                  <line x1="0" y1="90" x2="560" y2="90" stroke="#1e293b" strokeDasharray="4 4" />
                  <line x1="0" y1="150" x2="560" y2="150" stroke="#1e293b" strokeDasharray="4 4" />

                  <path d={areaPath} fill="url(#analyticsGradient)" className="transition-all duration-500 ease-in-out" />
                  <path d={linePath} fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" className="transition-all duration-500 ease-in-out" />

                  {chartPoints.map((pt, idx) => (
                    <g key={idx} className="group cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="5"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className="fill-indigo-500 stroke-slate-900 stroke-2 group-hover:scale-150 transition-transform duration-200"
                      />
                    </g>
                  ))}
                </svg>

                {/* Floating Tooltip */}
                {hoveredPoint && (
                  <div
                    style={{ left: `${(hoveredPoint.x / 560) * 90}%`, top: `${hoveredPoint.y - 45}px` }}
                    className="absolute z-20 pointer-events-none transform -translate-x-1/2 bg-slate-900 border border-indigo-500/50 text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md"
                  >
                    <div className="font-bold text-indigo-300">{hoveredPoint.label}</div>
                    <div className="text-slate-100 font-extrabold">
                      {metricView === 'revenue' ? `₹${hoveredPoint.val.toLocaleString('en-IN')}` : `${hoveredPoint.val} bookings`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Breakdown & Operational Health Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Channel Distribution */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-5">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Revenue Channel Breakdown
                </h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">Single & Hourly Bookings</span>
                      <span className="text-emerald-400">₹{(data?.revenueBreakdown.bookingRevenue || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${bookingRevRatio}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-300">Recurring Memberships</span>
                      <span className="text-indigo-400">₹{(data?.revenueBreakdown.membershipRevenue || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div className="bg-indigo-500 h-full rounded-full transition-all duration-700" style={{ width: `${100 - bookingRevRatio}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facility Health Indicators */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-5">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Operational Health Metrics
                </h2>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                    <div className="text-xs text-slate-400 font-medium">Check-Ins</div>
                    <div className="text-lg font-bold text-white mt-1">{data?.summary.totalCheckIns || 0}</div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                    <div className="text-xs text-slate-400 font-medium">Overstays</div>
                    <div className="text-lg font-bold text-amber-400 mt-1">{data?.summary.overstayRate}%</div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
                    <div className="text-xs text-slate-400 font-medium">No-Shows</div>
                    <div className="text-lg font-bold text-rose-400 mt-1">{data?.summary.noShowCount || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Workspace Rankings Table */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Top Performing Spaces</h2>
                  <p className="text-xs text-slate-400">Ranked by revenue contribution and user ratings.</p>
                </div>
              </div>

              {data?.topSpaces && data.topSpaces.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800/80">
                        <th className="p-4 pl-6">Workspace Center</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Rating</th>
                        <th className="p-4">Bookings</th>
                        <th className="p-4">Occupancy</th>
                        <th className="p-4 pr-6 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {data.topSpaces.map((space) => (
                        <tr key={space.id} className="hover:bg-slate-800/40 transition duration-150">
                          <td className="p-4 pl-6 font-bold text-white flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>{space.name}</span>
                          </td>
                          <td className="p-4 text-slate-400">{space.location}</td>
                          <td className="p-4">
                            <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {space.rating.toFixed(1)}
                            </div>
                          </td>
                          <td className="p-4 text-slate-300">{space.bookingsCount}</td>
                          <td className="p-4">
                            <span className="text-emerald-400 font-semibold">{space.occupancy}%</span>
                          </td>
                          <td className="p-4 pr-6 text-right font-black text-white">
                            ₹{space.revenue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No workspace performance data recorded for this duration.
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}