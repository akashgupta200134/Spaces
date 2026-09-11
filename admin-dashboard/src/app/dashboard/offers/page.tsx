'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, RefreshCw, Trash2, Search, Loader2, AlertCircle, ShieldCheck, Layers } from 'lucide-react';

interface MembershipPlanOption {
  id: string;
  name: string;
}

interface Offer {
  id: string;
  code: string;
  type: string;
  value: number;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usedCount: number;
  planId: string | null;
  plan?: { id: string; name: string } | null;
}

export default function OfferManagementPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [plans, setPlans] = useState<MembershipPlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: 10,
    usageLimit: '',
    planId: '',
    validFrom: new Date().toISOString().slice(0, 16),
    validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  // Pure data fetcher without immediate synchronous setState calls
  const fetchOfferData = useCallback(async () => {
  const [offersRes, plansRes] = await Promise.all([
    fetch('/api/admin/offers'),
    fetch('/api/admin/membership-plans'),
  ]);

  if (!offersRes.ok) throw new Error('Failed to load promo codes');
  const offersData = await offersRes.json();

  let fetchedPlans: MembershipPlanOption[] = [];
  if (plansRes.ok) {
    const plansJson = await plansRes.json();
    // Safely parse direct array [...], { data: [...] }, or { plans: [...] }
    fetchedPlans = Array.isArray(plansJson)
      ? plansJson
      : plansJson.data || plansJson.plans || [];
  } else {
    console.error('Failed to fetch membership plans. Status:', plansRes.status);
  }

  return {
    offers: Array.isArray(offersData) ? offersData : offersData.data || [],
    plans: fetchedPlans,
  };
}, []);

  // Initial load inside useEffect without synchronous setState triggers
  useEffect(() => {
    let isMounted = true;

    fetchOfferData()
      .then(({ offers, plans }) => {
        if (isMounted) {
          setOffers(offers);
          setPlans(plans);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setErrorNotice(err.message || 'Error fetching data');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchOfferData]);

  // Manual Refresh handler for button click
  const handleRefresh = async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const { offers, plans } = await fetchOfferData();
      setOffers(offers);
      setPlans(plans);
    } catch (err: any) {
      setErrorNotice(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code: formData.code.toUpperCase().trim(),
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
          planId: formData.planId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create promo code');
      }

      setShowModal(false);
      setFormData({
        code: '',
        type: 'PERCENTAGE',
        value: 10,
        usageLimit: '',
        planId: '',
        validFrom: new Date().toISOString().slice(0, 16),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      });

      // Refetch after creation
      await handleRefresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    try {
      const res = await fetch(`/api/admin/offers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete offer');
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      setErrorNotice(err.message);
    }
  };

  const filteredOffers = offers.filter((o) =>
    o.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Tag className="w-7 h-7 text-indigo-400" />
              Promo Code Builder
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Create global or plan-specific discount offers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Create Promo Code
            </button>
          </div>
        </div>

        {errorNotice && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice(null)} className="text-rose-400 hover:text-rose-200">×</button>
          </div>
        )}

        {/* Offers Table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Applicable Plan</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Usage Limits</th>
                  <th className="p-4">Validity Window</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                      Loading promo codes...
                    </td>
                  </tr>
                ) : filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No promo codes found.
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((offer) => {
                    const now = new Date();
                    const isExpired = new Date(offer.validTo) < now;
                    const isNotStarted = new Date(offer.validFrom) > now;
                    const isLimitReached = offer.usageLimit ? offer.usedCount >= offer.usageLimit : false;

                    return (
                      <tr key={offer.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-4">
                          <span className="font-mono font-bold text-sm text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                            {offer.code}
                          </span>
                        </td>
                        <td className="p-4">
                          {offer.plan ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              <Layers className="w-3 h-3" />
                              {offer.plan.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              All Plans (Common)
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-white">
                          {offer.type === 'PERCENTAGE' ? `${offer.value}% OFF` : `₹${offer.value} OFF`}
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-slate-200">
                            {offer.usedCount} / {offer.usageLimit ?? '∞'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">
                          <div>From: {new Date(offer.validFrom).toLocaleDateString()}</div>
                          <div>To: {new Date(offer.validTo).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4">
                          {isExpired ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Expired</span>
                          ) : isNotStarted ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Upcoming</span>
                          ) : isLimitReached ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Limit Reached</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDelete(offer.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 rounded-lg border border-slate-700 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreateOffer} className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                New Promo Code
              </h3>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Promo Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER50"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Membership Plan</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">All Membership Plans (Common Offer)</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Value</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Usage Limit (Optional)</label>
                <input
                  type="number"
                  placeholder="Leave blank for unlimited"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Valid From</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Valid To</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Offer</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}