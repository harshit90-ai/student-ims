import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UserSquare2,
  X,
} from 'lucide-react';
import type { NavSection, UserRole } from '../types/sims';

interface SidebarProps {
  role: UserRole;
  activeSection: NavSection;
  collapsed: boolean;
  mobileOpen: boolean;
  onSelect: (section: NavSection) => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student'] },
  { id: 'students', label: 'Students', icon: Users, roles: ['admin', 'teacher'] },
  { id: 'teachers', label: 'Teachers', icon: UserSquare2, roles: ['admin', 'teacher'] },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'teacher', 'student'] },
  { id: 'courses', label: 'Courses & Subjects', icon: BookOpen, roles: ['admin', 'teacher', 'student'] },
  { id: 'examinations', label: 'Examinations', icon: ClipboardList, roles: ['admin', 'teacher', 'student'] },
  { id: 'results', label: 'Results', icon: Award, roles: ['admin', 'teacher', 'student'] },
  { id: 'fees', label: 'Fees', icon: CreditCard, roles: ['admin', 'student'] },
  { id: 'notices', label: 'Notices', icon: Bell, roles: ['admin', 'teacher', 'student'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'teacher'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'teacher', 'student'] },
];

export function Sidebar({
  role,
  activeSection,
  collapsed,
  mobileOpen,
  onSelect,
  onToggleCollapse,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const content = (
    <div className="h-full flex flex-col bg-[#0B1F3A] text-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#1D4ED8] flex items-center justify-center shrink-0 shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-white truncate">cgc SIMS</p>
              <p className="text-[11px] text-blue-200/80 capitalize truncate">{role} Workspace</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.id);
                onCloseMobile();
              }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#1D4ED8] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/8'
              } ${collapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Logout & Collapse Controls */}
      <div className="p-2.5 border-t border-white/10 space-y-1 shrink-0">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors whitespace-nowrap ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className={`hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/8 transition-colors ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Rail */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-200 border-r border-slate-200 no-print ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div className="fixed inset-0 bg-slate-950/50" onClick={onCloseMobile} />
          <aside className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10">{content}</aside>
        </div>
      )}
    </>
  );
}

