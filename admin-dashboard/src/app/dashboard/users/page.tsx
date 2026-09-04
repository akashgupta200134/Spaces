'use client';

import React, { useEffect, useState } from 'react';
import API from '@/lib/api';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  X,
  CreditCard,
  MapPin,
  Clock,
  Crown,
  Building2,
  Check,
  AlertCircle
} from 'lucide-react';

interface UserMembership {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  startDate: string;
  endDate: string;
  renewalDate?: string;
  plan: {
    id: string;
    name: string;
    price: number;
    billingCycle: string; // e.g. 'MONTHLY', 'YEARLY'
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  isEmailVerified: boolean;
  role: string;
  createdAt: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  membership?: UserMembership | null;
  totalBookings?: number;
  totalSpent?: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Detail Modal / Drawer State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to refresh user list.');
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    let isMounted = true;

    API.get('/admin/users')
      .then((res) => {
        if (isMounted) {
          setUsers(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load user list.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch full user details when a row is clicked
  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setLoadingDetails(true);

    try {
      const res = await API.get(`/admin/users/${user.id}`);
      setSelectedUser(res.data);
    } catch (err) {
      // Fallback to basic user data if endpoint is not created yet
      console.warn('Detailed user fetch fallback used');
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q) ?? false;
    const emailMatch = u.email.toLowerCase().includes(q);
    const phoneMatch = u.phone?.toLowerCase().includes(q) ?? false;
    return nameMatch || emailMatch || phoneMatch;
  });

  const verifiedEmailCount = users.filter((u) => u.isEmailVerified).length;
  const activeMembersCount = users.filter((u) => u.membership?.status === 'ACTIVE').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-400" />
            Registered Users
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage customer accounts, view locations, and analyze membership plans.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="self-start sm:self-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Customers</p>
            <p className="text-xl font-bold text-white">{users.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Members</p>
            <p className="text-xl font-bold text-white">{activeMembersCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Email Verified</p>
            <p className="text-xl font-bold text-white">{verifiedEmailCount}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm">Loading users list...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users className="h-10 w-10 mx-auto text-slate-600 mb-2" />
            <p className="text-base font-medium text-slate-300">No Users Found</p>
            <p className="text-xs">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No registered customer accounts exist yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Membership Plan</th>
                  <th className="py-3.5 px-4">Email Status</th>
                  <th className="py-3.5 px-4">Joined On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="hover:bg-slate-800/60 transition cursor-pointer group"
                  >
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold uppercase text-sm group-hover:scale-105 transition-transform">
                          {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                            {user.name || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-slate-500">ID: {user.id.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Membership Plan Badge */}
                    <td className="py-3.5 px-4">
                      {user.membership?.plan ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Crown className="h-3 w-3" />
                          {user.membership.plan.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          No Active Plan
                        </span>
                      )}
                    </td>

                    {/* Email Verification Status */}
                    <td className="py-3.5 px-4">
                      {user.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <XCircle className="h-3.5 w-3.5" />
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Slide-over Panel / Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg uppercase">
                  {selectedUser.name ? selectedUser.name.charAt(0) : selectedUser.email.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedUser.name || 'Unnamed User'}
                  </h2>
                  <p className="text-xs text-slate-400">User Analytics & Profile</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm">Fetching detailed analytics...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User ID & Status Badges */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">ID: {selectedUser.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedUser.role}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedUser.isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Check className="h-3 w-3" /> Email Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <AlertCircle className="h-3 w-3" /> Unverified Email
                      </span>
                    )}

                    {selectedUser.membership?.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Crown className="h-3 w-3" /> Active Subscriber
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        No Active Subscription
                      </span>
                    )}
                  </div>
                </div>

                {/* Membership Plan Details Section */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-indigo-400" />
                    Membership & Subscription Details
                  </h3>

                  {selectedUser.membership ? (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {selectedUser.membership.plan.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Billing Cycle: {selectedUser.membership.plan.billingCycle}
                          </p>
                        </div>
                        <p className="text-base font-bold text-amber-400">
                          ${selectedUser.membership.plan.price}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <p className="text-slate-500">Start Date</p>
                          <p className="text-slate-300 font-medium mt-0.5">
                            {new Date(selectedUser.membership.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Expiry Date</p>
                          <p className="text-slate-300 font-medium mt-0.5">
                            {new Date(selectedUser.membership.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedUser.membership.renewalDate && (
                          <div className="col-span-2 pt-1 border-t border-slate-800/50">
                            <p className="text-slate-500">Next Renewal Date</p>
                            <p className="text-indigo-400 font-medium mt-0.5">
                              {new Date(selectedUser.membership.renewalDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center text-slate-500 text-xs">
                      This user has not purchased any membership plan yet.
                    </div>
                  )}
                </div>

                {/* Contact & Location Info */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-400" />
                    Contact & Location Details
                  </h3>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                      <div>
                        <p className="text-slate-500 text-[10px]">Email Address</p>
                        <p className="font-medium text-slate-200">{selectedUser.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300 border-t border-slate-800/50 pt-2.5">
                      <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                      <div>
                        <p className="text-slate-500 text-[10px]">Phone Number</p>
                        <p className="font-medium text-slate-200">{selectedUser.phone || 'Not Provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-slate-300 border-t border-slate-800/50 pt-2.5">
                      <Building2 className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-500 text-[10px]">Address / Location</p>
                        <p className="font-medium text-slate-200">
                          {[
                            selectedUser.address,
                            selectedUser.city,
                            selectedUser.state,
                            selectedUser.zipCode,
                            selectedUser.country
                          ]
                            .filter(Boolean)
                            .join(', ') || 'No address details added'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Activity Metrics */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    Account Activity & History
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                      <p className="text-slate-500">Joined Date</p>
                      <p className="text-slate-200 font-medium mt-1">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                      <p className="text-slate-500">Total Bookings</p>
                      <p className="text-slate-200 font-bold text-base mt-0.5">
                        {selectedUser.totalBookings ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}