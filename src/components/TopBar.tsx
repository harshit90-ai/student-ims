import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Settings, ShieldCheck } from 'lucide-react';
import { Avatar } from './Avatar';
import type { AuthUser, NavSection, Notice } from '../types/sims';

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'Dashboard Overview',
  students: 'Student Directory & Admissions',
  teachers: 'Faculty & Teacher Management',
  attendance: 'Attendance Tracking',
  courses: 'Courses, Departments & Subjects',
  examinations: 'Examinations Schedule',
  results: 'Results & Marksheet Management',
  fees: 'Tuition & Fees Management',
  notices: 'Notices & Announcements',
  reports: 'Academic & Financial Reports',
  settings: 'System Settings',
};

interface TopBarProps {
  user: AuthUser;
  activeSection: NavSection;
  notices: Notice[];
  onOpenMobileMenu: () => void;
  onNavigate: (section: NavSection) => void;
  onLogout: () => void;
}

export function TopBar({
  user,
  activeSection,
  notices,
  onOpenMobileMenu,
  onNavigate,
  onLogout,
}: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notices.filter((n) => !readIds.includes(n.id)).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 no-print">
      {/* Left: Mobile Trigger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600 whitespace-nowrap">cgc SIMS</span>
            <span aria-hidden="true">/</span>
            <span className="capitalize whitespace-nowrap">{user.role} Portal</span>
          </div>
          <h1 className="font-display text-base sm:text-lg font-bold text-slate-900 truncate">
            {SECTION_TITLES[activeSection]}
          </h1>
        </div>
      </div>

      {/* Right: Notification Bell & User Profile Dropdown */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="relative p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1D4ED8] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Campus Announcements</span>
                <button
                  type="button"
                  onClick={() => setReadIds(notices.map((n) => n.id))}
                  className="text-xs text-blue-700 hover:underline font-medium"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notices.slice(0, 5).map((n) => {
                  const isUnread = !readIds.includes(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setReadIds((prev) => (prev.includes(n.id) ? prev : [...prev, n.id]));
                        setNotifOpen(false);
                        onNavigate('notices');
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                        isUnread ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-blue-700">{n.category}</span>
                        <span className="font-mono tabular-nums">{n.publishDate}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">{n.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.content}</p>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    onNavigate('notices');
                  }}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  View all notices →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <Avatar src={user.avatar} name={user.name} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-500 capitalize leading-tight">{user.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="capitalize">{user.role} Access</span>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Account & Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

