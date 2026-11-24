import React, { useState } from 'react';
import {
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardCheck,
  FolderKanban,
  GraduationCap,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  SearchCheck,
  X,
} from 'lucide-react';

export type WorkspaceTab =
  | 'overview'
  | 'study-plan'
  | 'think-first'
  | 'ai-coach'
  | 'fact-check'
  | 'self-test'
  | 'workspace';

interface WorkspaceShellProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  userName: string;
  userRoleLabel: string;
  isDemoMode: boolean;
  onGoHome: () => void;
  onOpenAuth: () => void;
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Tổng quan & Tiến độ', icon: BarChart3 },
  { id: 'study-plan', label: '01. Study Plan', icon: CalendarDays },
  { id: 'think-first', label: '02. Think First', icon: Lightbulb },
  { id: 'ai-coach', label: '03. AI Coach', icon: Bot },
  { id: 'fact-check', label: '04. Fact Check', icon: SearchCheck },
  { id: 'self-test', label: '05. Self Test', icon: ClipboardCheck },
  { id: 'workspace', label: 'Google Workspace', icon: FolderKanban },
];

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  activeTab,
  onSelectTab,
  userName,
  userRoleLabel,
  isDemoMode,
  onGoHome,
  onOpenAuth,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  const handleSelect = (tab: WorkspaceTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-white border-r border-slate-200 shrink-0">
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2 text-lg font-extrabold text-sky-700 cursor-pointer"
          >
            <GraduationCap className="w-6 h-6 text-sky-600" />
            <span>EDU SMART</span>
          </button>
        </div>

        <nav aria-label="Phân hệ học tập" className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  active
                    ? 'bg-sky-50 text-sky-900 border border-sky-300 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent font-semibold'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-sky-700' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="px-2">
            <div className="text-xs font-bold text-slate-900 truncate">{userName}</div>
            <div className="text-[11px] text-slate-500 truncate">{userRoleLabel}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoHome}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </button>

            {isDemoMode ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
              >
                Đăng nhập
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                aria-label="Đăng xuất"
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Mở menu phân hệ"
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="text-sm font-semibold text-slate-500 truncate">
              <span>EDU SMART</span>
              <span className="mx-2 text-slate-300">/</span>
              <span className="text-slate-900 font-bold">{activeNav.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isDemoMode && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 sm:px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                <span className="sm:hidden">Đăng nhập Google</span>
                <span className="hidden sm:inline">Đăng nhập Google để lưu đám mây</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    active
                      ? 'bg-sky-50 text-sky-900 border border-sky-300 font-bold'
                      : 'text-slate-600 border border-transparent font-semibold'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-sky-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
          {children}
        </main>
      </div>
    </div>
  );
};
