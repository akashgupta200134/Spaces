'use client';

import React, { useState } from 'react';
import { 
  User, Building2, Bell, Key, Save, ShieldCheck, 
  Globe, Mail, DollarSign, Check, Loader2, RefreshCw,
  Eye, EyeOff, Upload, AlertTriangle, X
} from 'lucide-react';

type SettingsTab = 'general' | 'workspace' | 'notifications' | 'security';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form States
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@workspace.com',
    role: 'Super Admin',
    avatarUrl: '',
  });

  const [workspace, setWorkspace] = useState({
    name: 'FlexSpace Workspace Co.',
    currency: 'INR',
    timezone: 'Asia/Kolkata (GMT+05:30)',
    taxId: '27AAAAA0000A1Z5',
  });

  const [notifications, setNotifications] = useState({
    emailOnBooking: true,
    overstayAlerts: true,
    weeklyReport: false,
    lowCapacityAlert: true,
  });

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";


  const [apiKey, setApiKey] = useState(stripeKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showRollModal, setShowRollModal] = useState(false);

  const handleInputChange = (setter: Function, val: any) => {
    setter(val);
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty && !savedSuccess) return;

    setSaving(true);
    setSavedSuccess(false);

    // Simulate API latency
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 700);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const confirmRollApiKey = () => {
    const newKey = `sk_live_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('')}`;
    setApiKey(newKey);
    setShowRollModal(false);
    setIsDirty(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="pb-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              System Settings
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage account preferences, global workspace rules, and integration security keys.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || (!isDirty && !savedSuccess)}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 shadow-lg active:scale-95 ${
              savedSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : isDirty
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {saving
                ? 'Saving Changes...'
                : savedSuccess
                ? 'Changes Saved'
                : isDirty
                ? 'Save Settings'
                : 'No Unsaved Changes'}
            </span>
          </button>
        </div>

        {/* Navigation Tabs & Settings Form */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Navigation Pills/Sidebar */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 scrollbar-none">
            {[
              { id: 'general', label: 'Admin Profile', icon: User },
              { id: 'workspace', label: 'Workspace & Locale', icon: Building2 },
              { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
              { id: 'security', label: 'Security & API Keys', icon: Key },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 lg:w-full ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Panel */}
          <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* TAB 1: ADMIN PROFILE */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-800/80 pb-4">
                    <h2 className="text-base font-bold text-white">Admin Profile</h2>
                    <p className="text-xs text-slate-400">Personal details and administrative access privileges.</p>
                  </div>

                  {/* Avatar Upload Placeholder */}
                  <div className="flex items-center gap-4 py-2">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg shrink-0">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700/60"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Change Photo
                      </button>
                      <p className="text-[11px] text-slate-500 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => handleInputChange(setProfile, { ...profile, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleInputChange(setProfile, { ...profile, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Role Level</label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-indigo-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={profile.role}
                          disabled
                          className="w-full bg-slate-950/50 border border-slate-800/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-400 cursor-not-allowed select-none"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">System permissions are tied to your assigned role level.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WORKSPACE & LOCALE */}
              {activeTab === 'workspace' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-800/80 pb-4">
                    <h2 className="text-base font-bold text-white">Workspace Configuration</h2>
                    <p className="text-xs text-slate-400">Global billing details and operational parameters.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Company / Organization Name</label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={workspace.name}
                          onChange={(e) => handleInputChange(setWorkspace, { ...workspace, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Primary Currency</label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <select
                          value={workspace.currency}
                          onChange={(e) => handleInputChange(setWorkspace, { ...workspace, currency: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition appearance-none"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Operating Timezone</label>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={workspace.timezone}
                          onChange={(e) => handleInputChange(setWorkspace, { ...workspace, timezone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-2">GST / Tax Identification Number</label>
                      <input
                        type="text"
                        value={workspace.taxId}
                        onChange={(e) => handleInputChange(setWorkspace, { ...workspace, taxId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AUTOMATED NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-800/80 pb-4">
                    <h2 className="text-base font-bold text-white">Automated Notifications</h2>
                    <p className="text-xs text-slate-400">Configure trigger conditions for email and system notifications.</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'emailOnBooking', title: 'New Booking Confirmations', desc: 'Receive real-time notifications for every completed user booking.' },
                      { key: 'overstayAlerts', title: 'Occupancy Overstay Alerts', desc: 'Trigger alerts when check-out times exceed reservation limits.' },
                      { key: 'lowCapacityAlert', title: 'High Occupancy Threshold Warnings', desc: 'Notify admin when workspace utilization crosses 85%.' },
                      { key: 'weeklyReport', title: 'Weekly Performance Summaries', desc: 'Receive an automated analytical digest every Monday morning.' },
                    ].map((item) => {
                      const isChecked = (notifications as any)[item.key];
                      return (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl transition hover:border-slate-700/80">
                          <div className="space-y-0.5 pr-4">
                            <div className="text-xs font-bold text-white">{item.title}</div>
                            <div className="text-[11px] text-slate-400 leading-tight">{item.desc}</div>
                          </div>
                          
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleInputChange(setNotifications, { ...notifications, [item.key]: !isChecked })}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isChecked ? 'bg-indigo-600' : 'bg-slate-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isChecked ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: DEVELOPER API & SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-800/80 pb-4">
                    <h2 className="text-base font-bold text-white">Developer API & Security Keys</h2>
                    <p className="text-xs text-slate-400">Manage authorization tokens used for backend integrations.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Live Secret API Key</label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            readOnly
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs font-mono text-slate-300 focus:outline-none select-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={copyApiKey}
                            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700/50"
                          >
                            {copiedKey ? 'Copied!' : 'Copy Key'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowRollModal(true)}
                            className="p-2.5 bg-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-400 rounded-xl transition border border-slate-700/50"
                            title="Roll / Regenerate Key"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed flex gap-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <strong>Security Warning:</strong> Regenerating your secret key will immediately invalidate any external service or server integration utilizing the current token.
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>

      </div>

      {/* Roll Key Confirmation Modal */}
      {showRollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowRollModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Regenerate API Key?</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to roll your live secret key? Applications using the existing key will lose authorization instantly until updated with the new token.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRollModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRollApiKey}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-rose-600/20"
              >
                Regenerate Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}