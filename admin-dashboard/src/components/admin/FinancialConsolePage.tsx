'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownLeft, CheckCircle2, 
  Clock, Filter, Plus, Search, Loader2, X, AlertCircle, RefreshCw, Trash2, ShieldAlert, Globe, Building2
} from 'lucide-react';

interface FinancialMetrics {
  grossRevenue: number;
  totalTax: number;
  totalRefunds: number;
  netRevenue: number;
  totalTransactions: number;
  pendingRefundRequests: number;
}

interface Transaction {
  id: string;
  orderId: string;
  transactionId?: string;
  amount: number;
  tax: number;
  currency: string;
  status: 'CREATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  purpose: 'BOOKING' | 'MEMBERSHIP' | 'RENEWAL';
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface RefundRequest {
  id: string;
  paymentId: string;
  amount: number;
  reason?: string;
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  createdAt: string;
  payment: {
    orderId: string;
    amount: number;
    purpose: string;
    user: { name: string; email: string };
  };
}

interface CancellationPolicy {
  id: string;
  spaceId?: string | null;
  appliesTo: 'BOOKING' | 'MEMBERSHIP';
  hoursBeforeStart: number;
  refundPercentage: number;
  createdAt: string;
}

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'refunds' | 'policies'>('overview');
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // States
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    grossRevenue: 0,
    totalTax: 0,
    totalRefunds: 0,
    netRevenue: 0,
    totalTransactions: 0,
    pendingRefundRequests: 0,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingRefunds, setPendingRefunds] = useState<RefundRequest[]>([]);
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Refund Modal State
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [gatewayRefundId, setGatewayRefundId] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Policy Modal & Actions
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);
  const [newPolicy, setNewPolicy] = useState({
    spaceId: '',
    appliesTo: 'BOOKING' as 'BOOKING' | 'MEMBERSHIP',
    hoursBeforeStart: 24,
    refundPercentage: 100,
  });

  // Fetch All Console Data
  const fetchConsoleData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setLoading(true);
      setErrorNotice(null);
    }

    try {
      const [overviewRes, ledgerRes, refundsRes, policiesRes] = await Promise.all([
        fetch('/api/admin/finance/overview'),
        fetch('/api/admin/finance/ledger?limit=50'),
        fetch('/api/admin/finance/refunds/pending'),
        fetch('/api/admin/finance/policies'),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setMetrics(overviewData.metrics);
      }

      if (ledgerRes.ok) {
        const ledgerData = await ledgerRes.json();
        setTransactions(ledgerData.data || []);
      }

      if (refundsRes.ok) {
        const refundsData = await refundsRes.json();
        setPendingRefunds(refundsData.data || []);
      }

      if (policiesRes.ok) {
        const policiesData = await policiesRes.json();
        setPolicies(policiesData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      setErrorNotice('Failed to synchronize console data. Check API proxy settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsoleData(false);
  }, [fetchConsoleData]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  // Handle Process Refund
  const handleProcessRefund = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedRefund) return;

    if (action === 'REJECT' && !rejectionReason.trim()) {
      setModalError('A rejection reason is required when rejecting a request.');
      return;
    }

    setModalError(null);
    setProcessingAction(true);

    try {
      const res = await fetch('/api/admin/finance/refunds/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId: selectedRefund.id,
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason.trim() : undefined,
          gatewayRefundId: action === 'APPROVE' ? gatewayRefundId.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to process refund');
      }

      setPendingRefunds((prev) => prev.filter((r) => r.id !== selectedRefund.id));
      setSelectedRefund(null);
      setRejectionReason('');
      setGatewayRefundId('');
    } catch (err: any) {
      setModalError(err.message || 'Error processing refund.');
    } finally {
      setProcessingAction(false);
    }
  };

  // Submit Cancellation Policy
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);

    try {
      const res = await fetch('/api/admin/finance/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: newPolicy.spaceId.trim() || undefined,
          appliesTo: newPolicy.appliesTo,
          hoursBeforeStart: Number(newPolicy.hoursBeforeStart),
          refundPercentage: Number(newPolicy.refundPercentage),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create policy');
      }

      setShowPolicyModal(false);
      setNewPolicy({ spaceId: '', appliesTo: 'BOOKING', hoursBeforeStart: 24, refundPercentage: 100 });
      fetchConsoleData(false);
    } catch (err: any) {
      setErrorNotice(err.message || 'Could not save cancellation policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  // Delete Policy
  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this cancellation policy?')) return;

    setDeletingPolicyId(policyId);
    try {
      const res = await fetch(`/api/admin/finance/policies/${policyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete policy');

      setPolicies((prev) => prev.filter((p) => p.id !== policyId));
    } catch (err: any) {
      setErrorNotice(err.message || 'Could not delete policy.');
    } finally {
      setDeletingPolicyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="pb-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Financial & Refund Console
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Audit global platform revenues, execute customer refunds, and establish cancellation rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchConsoleData(true)}
              disabled={loading}
              title="Refresh console data"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowPolicyModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Cancellation Policy</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorNotice && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Gross Revenue</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-white">₹{metrics.grossRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Includes ₹{metrics.totalTax.toLocaleString()} tax</p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Refunded</span>
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-white">₹{metrics.totalRefunds.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Processed across platform</p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Net Revenue</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-white">₹{metrics.netRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">Gross minus refunds</p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Pending Requests</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-amber-400">{pendingRefunds.length}</div>
            <p className="text-[11px] text-slate-500 mt-1">Requires manual admin review</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/80 space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Transaction Ledger
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'refunds'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pending Refunds</span>
            {pendingRefunds.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-bold">
                {pendingRefunds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'policies'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Cancellation Policies</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-bold">
              {policies.length}
            </span>
          </button>
        </div>

        {/* TAB 1: TRANSACTION LEDGER */}
        {activeTab === 'overview' && (
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
            <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search order ID or customer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 border-b border-slate-800/80 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="p-4">Order / Txn ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Purpose</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                        <span>Fetching transactions...</span>
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-4 font-mono font-medium text-indigo-300">
                          <div>{tx.orderId}</div>
                          <div className="text-[10px] text-slate-500">{tx.transactionId || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{tx.user?.name || 'N/A'}</div>
                          <div className="text-[11px] text-slate-500">{tx.user?.email || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold">
                            {tx.purpose}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white">₹{tx.amount.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            tx.status === 'REFUNDED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PENDING REFUNDS */}
        {activeTab === 'refunds' && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                <span>Loading refund requests...</span>
              </div>
            ) : pendingRefunds.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">All Clear!</h3>
                <p className="text-xs text-slate-400 mt-1">No pending refund requests requiring review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingRefunds.map((refund) => (
                  <div key={refund.id} className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">Refund Request: {refund.payment?.orderId}</span>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold">
                          {refund.payment?.purpose}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Customer: <strong className="text-white">{refund.payment?.user?.name}</strong> ({refund.payment?.user?.email})
                      </p>
                      <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-2">
                        <strong className="text-slate-300">Reason:</strong> {refund.reason || 'No reason provided'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Requested Amount</div>
                        <div className="text-lg font-extrabold text-rose-400">₹{refund.amount.toFixed(2)}</div>
                      </div>

                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
                      >
                        Review Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CANCELLATION POLICIES */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                <span>Loading active cancellation policies...</span>
              </div>
            ) : policies.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl">
                <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No Cancellation Policies Configured</h3>
                <p className="text-xs text-slate-400 mt-1">Create your first global or space-specific cancellation rule.</p>
                <button
                  onClick={() => setShowPolicyModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  Create Policy Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col justify-between space-y-4 backdrop-blur-md relative group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          policy.spaceId 
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}>
                          {policy.spaceId ? <Building2 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          {policy.spaceId ? `Space: ${policy.spaceId.slice(0, 8)}...` : 'Global Default'}
                        </span>

                        <button
                          onClick={() => handleDeletePolicy(policy.id)}
                          disabled={deletingPolicyId === policy.id}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                          title="Delete Policy"
                        >
                          {deletingPolicyId === policy.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div>
                        <div className="text-xs text-slate-400">Target Type</div>
                        <div className="text-sm font-bold text-white">{policy.appliesTo}</div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Notice Window:</span>
                          <strong className="text-white">{policy.hoursBeforeStart} hours before start</strong>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Eligible Refund:</span>
                          <strong className="text-emerald-400 font-bold">{policy.refundPercentage}%</strong>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 italic">
                        &quot;Users cancelling at least <strong className="text-slate-200">{policy.hoursBeforeStart} hours</strong> prior get a <strong className="text-emerald-300">{policy.refundPercentage}%</strong> refund.&quot;
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-3">
                      Created on {new Date(policy.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* DETAILED CREATE POLICY MODAL */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreatePolicy} className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowPolicyModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white">Create Cancellation Policy</h3>
              <p className="text-xs text-slate-400 mt-1">Configure automated refund eligibility rules based on cancellation notice time.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Space ID <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to make this a GLOBAL default policy"
                  value={newPolicy.spaceId}
                  onChange={(e) => setNewPolicy({ ...newPolicy, spaceId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Global policies apply to all spaces unless overridden by a space-specific ID.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Applies To</label>
                <select
                  value={newPolicy.appliesTo}
                  onChange={(e) => setNewPolicy({ ...newPolicy, appliesTo: e.target.value as 'BOOKING' | 'MEMBERSHIP' })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="BOOKING">Booking (Hourly / Daily Spaces)</option>
                  <option value="MEMBERSHIP">Membership (Recurring Subscriptions)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Notice (Hours)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newPolicy.hoursBeforeStart}
                    onChange={(e) => setNewPolicy({ ...newPolicy, hoursBeforeStart: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Min hours before start time.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Refund (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={newPolicy.refundPercentage}
                    onChange={(e) => setNewPolicy({ ...newPolicy, refundPercentage: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Percentage returned (0-100%).</p>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-indigo-200 space-y-1">
                <span className="font-bold text-[11px] block text-indigo-300">Policy Preview Rule:</span>
                <p className="text-[11px] leading-relaxed">
                  If a user cancels at least <strong>{newPolicy.hoursBeforeStart || 0} hours</strong> prior to start time, they will receive a <strong>{newPolicy.refundPercentage || 0}%</strong> refund on their total paid amount.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPolicy}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20"
              >
                {savingPolicy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Cancellation Policy</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REFUND REVIEW MODAL */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedRefund(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Process Refund Decision</h3>
              <p className="text-xs text-slate-400 mt-0.5">Order ID: {selectedRefund.payment?.orderId}</p>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-slate-900 rounded-xl">
                <span className="text-slate-400">Requested Amount:</span>
                <span className="font-bold text-rose-400 text-sm">₹{selectedRefund.amount.toFixed(2)}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Gateway Refund ID (Optional for Approval)</label>
                <input
                  type="text"
                  placeholder="e.g. rrf_123456789"
                  value={gatewayRefundId}
                  onChange={(e) => setGatewayRefundId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Rejection Reason (Required if Rejecting)</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this refund request is rejected..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={processingAction}
                onClick={() => handleProcessRefund('REJECT')}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-xl transition"
              >
                Reject Refund
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={() => handleProcessRefund('APPROVE')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                {processingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Approve & Execute Refund</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}