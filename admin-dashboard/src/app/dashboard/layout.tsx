'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  CreditCard,
  Receipt,
  BarChart3,
  MessageSquareOff,
  LifeBuoy,
  Megaphone,
  Activity,
  ShieldAlert,
  Settings,
  Tag,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Space Managers', href: '/dashboard/space-managers', icon: UserCog },
    { name: 'Spaces', href: '/dashboard/spaces', icon: Building2 },
    { name: 'Membership Plans', href: '/dashboard/membership-plans', icon: CreditCard },
    { name: 'Offers & Promos', href: '/dashboard/offers', icon: Tag },
    { name: 'Finance & Refunds', href: '/dashboard/finance', icon: Receipt },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Broadcast Engine', href: '/dashboard/broadcasts', icon: Megaphone },
    { name: 'Moderation Desk', href: '/dashboard/moderation', icon: MessageSquareOff },
    { name: 'Support Desk', href: '/dashboard/tickets', icon: LifeBuoy },
    { name: 'Audit Logs', href: '/dashboard/audit', icon: Activity },
    { name: 'Privacy & GDPR', href: '/dashboard/privacy', icon: ShieldAlert },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const toggleMobileMenu = () => setIsMobileOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="text-lg font-bold text-white tracking-wide">
          Spaces <span className="text-indigo-500">Admin</span>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-lg focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between p-4 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } flex-shrink-0`}
      >
        <div>
          <div className="hidden md:block px-3 py-4 text-xl font-bold text-white tracking-wide">
            Spaces <span className="text-indigo-500">Admin</span>
          </div>

          <nav className="mt-2 md:mt-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Session Details */}
        <div className="border-t border-slate-800/80 pt-4 mt-6">
          <div className="px-3 mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Logged in as
          </div>
          <div className="px-3 text-sm font-medium text-slate-200 truncate">
            {user?.name || user?.email || 'Admin User'}
          </div>
          <div className="px-3 text-xs text-indigo-400 capitalize mb-4">
            {user?.role || 'Administrator'}
          </div>
          <button
            onClick={() => {
              setIsMobileOpen(false);
              logout();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}