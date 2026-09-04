'use client';

import React, { useEffect, useState } from 'react';
import API from '@/lib/api';
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Filter,
  Sparkles,
  CreditCard,
  Check,
  X,
  Zap,
  ShieldCheck,
  Building2,
  Layers,
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
}

interface AccessHours {
  isAC?: boolean;
  features?: string[];
}

interface MembershipPlan {
  id: string;
  spaceId?: string | null;
  name: string;
  description: string | null;
  price: number | string;
  tax: number | string;
  durationDays: number;
  maxUsage: number | null;
  accessHours?: AccessHours | null;
  isActive: boolean;
  createdAt?: string;
}

interface PlanFormData {
  name: string;
  description: string;
  price: string;
  tax: string;
  durationDays: string;
  maxUsage: string;
  isAC: boolean;
  selectedFacilityNames: string[];
  isActive: boolean;
}

const initialFormState: PlanFormData = {
  name: '',
  description: '',
  price: '',
  tax: '0',
  durationDays: '30',
  maxUsage: '',
  isAC: true,
  selectedFacilityNames: [],
  isActive: true,
};

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Extract features from JSON accessHours structure
  const getPlanFeatures = (plan: MembershipPlan): string[] => {
    if (!plan.accessHours || !plan.accessHours.features) return [];
    
    const parsedFeatures: string[] = [];
    plan.accessHours.features.forEach((featureEntry) => {
      if (typeof featureEntry === 'string') {
        featureEntry.split(',').forEach((item) => {
          const trimmed = item.trim();
          if (trimmed) parsedFeatures.push(trimmed);
        });
      }
    });
    return parsedFeatures;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, facilitiesRes] = await Promise.all([
        API.get('/admin/membership-plans'),
        API.get('/admin/facilities').catch(() => ({ data: [] })),
      ]);
      setPlans(plansRes.data || []);
      setFacilities(facilitiesRes.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to fetch membership data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPlanId(null);
    setFormData(initialFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    const existingFeatures = getPlanFeatures(plan);
    
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price ? parseFloat(plan.price.toString()).toString() : '0',
      tax: plan.tax ? parseFloat(plan.tax.toString()).toString() : '0',
      durationDays: plan.durationDays ? plan.durationDays.toString() : '30',
      maxUsage: plan.maxUsage ? plan.maxUsage.toString() : '',
      isAC: plan.accessHours?.isAC ?? true,
      selectedFacilityNames: existingFeatures,
      isActive: plan.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleFacilityName = (facilityName: string) => {
    setFormData((prev) => {
      const exists = prev.selectedFacilityNames.includes(facilityName);
      return {
        ...prev,
        selectedFacilityNames: exists
          ? prev.selectedFacilityNames.filter((name) => name !== facilityName)
          : [...prev.selectedFacilityNames, facilityName],
      };
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price) || 0,
      tax: parseFloat(formData.tax) || 0,
      durationDays: parseInt(formData.durationDays, 10) || 30,
      maxUsage: formData.maxUsage ? parseInt(formData.maxUsage, 10) : null,
      isActive: formData.isActive,
      accessHours: {
        isAC: formData.isAC,
        features: formData.selectedFacilityNames,
      },
    };

    try {
      if (editingPlanId) {
        await API.put(`/admin/membership-plans/${editingPlanId}`, payload);
      } else {
        await API.post('/admin/membership-plans', payload);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Operation failed.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan: MembershipPlan) => {
    const updatedStatus = !plan.isActive;
    try {
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: updatedStatus } : p))
      );
      await API.patch(`/admin/membership-plans/${plan.id}/status`, {
        isActive: updatedStatus,
      });
    } catch (err: any) {
      await fetchData();
      alert('Failed to update plan status.');
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await API.delete(`/admin/membership-plans/${deletingId}`);
      setPlans((prev) => prev.filter((p) => p.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete membership plan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && plan.isActive) ||
      (statusFilter === 'INACTIVE' && !plan.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Layers className="h-3.5 w-3.5" />
              <span>Workspace Membership Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Membership Plans
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Configure subscription tiers, pricing options, and facility features for member passes.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Plan</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-xl shadow-xl">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search plans by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800/80 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition placeholder:text-slate-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800/80 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
            <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Fetching membership configurations...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 rounded-xl text-xs font-semibold transition text-white"
            >
              Retry
            </button>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800/80 rounded-3xl backdrop-blur-md">
            <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-200">No membership plans found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No tiers matching your search criteria.'
                : 'Get started by creating your first global membership plan tier.'}
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const basePrice = parseFloat(plan.price?.toString() || '0');
              const taxAmount = parseFloat(plan.tax?.toString() || '0');
              const totalPrice = basePrice + taxAmount;
              const featuresList = getPlanFeatures(plan);
              const isACPlan = plan.accessHours?.isAC ?? false;

              return (
                <div
                  key={plan.id}
                  className={`group relative bg-gradient-to-b from-slate-900/90 to-slate-950/90 border ${
                    plan.isActive
                      ? 'border-slate-800/80 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10'
                      : 'border-slate-800/40 opacity-75'
                  } rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                >
                  {/* Top Accent Gradient Bar for Active Plans */}
                  {plan.isActive && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                  )}

                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          <ShieldCheck className="h-3 w-3" /> Global Tier
                        </span>
                        {isACPlan && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            <Zap className="h-3 w-3" /> AC
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleStatus(plan)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition ${
                          plan.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${plan.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span>{plan.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                      {plan.name}
                    </h3>

                    {/* Pricing */}
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold text-white tracking-tight">
                        ₹{basePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        / {plan.durationDays} Days
                      </span>
                    </div>

                    {taxAmount > 0 && (
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        + ₹{taxAmount} GST (Total: <span className="text-slate-300 font-semibold">₹{totalPrice.toLocaleString('en-IN')}</span>)
                      </p>
                    )}

                    {plan.description && (
                      <p className="text-slate-400 text-xs mt-3 line-clamp-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                        {plan.description}
                      </p>
                    )}

                    {/* Stats Grid */}
                    <div className="mt-5 grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Validity</p>
                          <p className="text-xs font-bold text-slate-200">{plan.durationDays} Days</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Max Visits</p>
                          <p className="text-xs font-bold text-slate-200">
                            {plan.maxUsage ? `${plan.maxUsage} Visits` : 'Unlimited'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Included Facilities Badges */}
                    <div className="mt-6 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Included Facilities
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-indigo-300 font-mono">
                          {featuresList.length} items
                        </span>
                      </div>

                      {featuresList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {featuresList.map((feature, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/50 text-indigo-200 border border-indigo-800/50 text-xs font-medium shadow-sm"
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                              <span>{feature}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-950/40 border border-dashed border-slate-800/80 rounded-2xl text-center">
                          <p className="text-xs text-slate-500 italic flex items-center justify-center gap-2">
                            <Building2 className="h-3.5 w-3.5" /> No facility features attached
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                      ID: {plan.id.substring(0, 8)}...
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(plan)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
                        title="Edit Plan"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(plan.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Delete Plan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE / EDIT MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800/90 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {editingPlanId ? 'Edit Membership Plan' : 'Create Membership Plan'}
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Configure details, pricing, and database features for this membership tier.
                </p>
              </div>

              {formError && (
                <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1-Month Premium Pass"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Duration (Days) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="30"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Base Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="2999"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Tax Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Max Visits
                    </label>
                    <input
                      type="number"
                      placeholder="Unlimited"
                      value={formData.maxUsage}
                      onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Plan Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide a quick summary of this plan..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
                  />
                </div>

                {/* Facilities Selection Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Select Included Facilities & Features
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
                    {(facilities.length > 0
                      ? facilities.map((f) => f.name)
                      : ['High-Speed Wifi', 'AC', 'Parking', 'Tea and Coffee Machine', 'Power Backup', 'Meeting Room Access']
                    ).map((facName) => {
                      const selected = formData.selectedFacilityNames.includes(facName);
                      return (
                        <button
                          key={facName}
                          type="button"
                          onClick={() => handleToggleFacilityName(facName)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                            selected
                              ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40'
                              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                              selected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                          <span className="truncate">{facName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                    <input
                      type="checkbox"
                      checked={formData.isAC}
                      onChange={(e) => setFormData({ ...formData, isAC: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-300">Air Conditioned</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-300">Active Status</span>
                  </label>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                  >
                    {formSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{editingPlanId ? 'Save Changes' : 'Create Plan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2">Delete Membership Plan?</h3>
              <p className="text-slate-400 text-xs mb-6">
                This action cannot be undone. Active subscriptions linked to this plan will remain valid until expiration.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePlan}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}