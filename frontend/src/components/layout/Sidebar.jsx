import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Brain, History, User, Users, TrendingUp,
  AlertOctagon, SlidersHorizontal, Package,
  ScanEye, BarChart2, Database, Wand2,
  X, LogOut, Settings, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const CUSTOMER_LINKS = [
  { to: '/dashboard',          label: 'Dashboard',          icon: LayoutDashboard, end: true },
  { to: '/customer/products',  label: 'Products',           icon: ShoppingBag },
  { to: '/predict',            label: 'AI Prediction',       icon: Brain },
  { to: '/predict/history',    label: 'Prediction History',  icon: History },
  { to: '/visual-recognition', label: 'Visual Recognition',  icon: ScanEye },
  { to: '/profile',            label: 'Profile',             icon: User },
];

const ADMIN_LINKS = [
  { to: '/admin/customers',               label: 'Customers',             icon: Users },
  { to: '/admin/purchase-prediction',     label: 'Purchase Prediction',   icon: TrendingUp },
  { to: '/admin/churn-prediction',        label: 'Churn Prediction',      icon: AlertOctagon },
  { to: '/admin/hyperparameter-tuning',   label: 'Hyperparameter Tuning', icon: SlidersHorizontal },
  { to: '/admin/products',                label: 'Products',              icon: Package },
  { to: '/admin/visual-recognition',      label: 'Visual Recognition',    icon: ScanEye },
  { to: '/admin/demand-forecasting',      label: 'Demand Forecasting',    icon: BarChart2 },
  { to: '/admin/synthetic-data',          label: 'Synthetic Data',        icon: Database },
  { to: '/admin/ai-content',              label: 'AI Content Generation', icon: Wand2 },
];

export default function Sidebar({ role = 'customer', mobileOpen = false, onClose }) {
  const links = role === 'admin' ? ADMIN_LINKS : CUSTOMER_LINKS;
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    if (onClose) onClose();
    await logout();
    showToast('Logged out successfully.', 'success');
    navigate('/');
  }

  // --- Desktop Compact Circular Icon-Rail Sidebar ---
  const desktopSidebar = (
    <aside className="hidden lg:flex lg:w-[76px] lg:flex-col lg:shrink-0 lg:border-r lg:border-ink-100 dark:lg:border-ink-800 lg:bg-white dark:lg:bg-ink-950 z-30 select-none py-5">
      <div className="flex h-full flex-col items-center justify-between">
        
        {/* Top: Logo & AI Status Bubble */}
        <div className="flex flex-col items-center gap-3">
          {/* Logo Icon */}
          <Link
            to="/"
            className="group relative flex h-11 w-11 items-center justify-center rounded-2xl overflow-hidden bg-signal-500/10 dark:bg-signal-500/15 border border-signal-500/20 hover:scale-105 transition-all duration-200"
            aria-label="SmartCart AI Home"
          >
            <img
              src="/logo.jpg"
              alt="SmartCart AI"
              className="h-8 w-8 object-cover rounded-xl"
            />
            {/* Expandable Label */}
            <div className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 z-50 flex items-center opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100">
              <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shadow-sm" />
              <div className="flex flex-col rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
                <span className="font-bold font-display text-sm">SmartCart AI</span>
                <span className="text-[10px] opacity-70">
                  {role === 'admin' ? 'Admin Console' : 'Customer Portal'}
                </span>
              </div>
            </div>
          </Link>

          {/* Quick AI Status Bubble (matches circular +2 pill in screenshot) */}
          <div className="group relative flex items-center justify-center">
            <div
              className="flex flex-col items-center justify-center h-10 w-10 rounded-full bg-signal-500/10 dark:bg-signal-500/20 border border-signal-500/25 text-signal-500 hover:scale-105 transition-all duration-200 cursor-default"
              aria-label="5 AI Models Online"
            >
              <Sparkles size={14} className="text-signal-500" />
              <span className="text-[10px] font-bold leading-none mt-0.5 text-signal-600 dark:text-signal-400">
                +5
              </span>
            </div>
            {/* Expandable status message */}
            <div className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 z-50 flex items-center opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100">
              <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shadow-sm" />
              <div className="flex items-center gap-2 rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs font-semibold shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>5 AI Modules Trained & Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Navigation Column of Circular Buttons */}
        <nav className="flex flex-col items-center my-auto py-2">
          <ul className="flex flex-col items-center space-y-2.5">
            {links.map((l) => (
              <li key={l.to} className="relative flex justify-center group">
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-signal-500 text-white dark:bg-white dark:text-ink-950 shadow-lg shadow-signal-500/25 dark:shadow-white/10 font-bold scale-105'
                        : 'bg-ink-100 dark:bg-ink-850/80 text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-750 hover:text-ink-900 dark:hover:text-white hover:scale-105'
                    }`
                  }
                  aria-label={l.label}
                >
                  {({ isActive }) => (
                    <l.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  )}
                </NavLink>

                {/* Hover Expandable Option Name */}
                <div className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 z-50 flex items-center opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100">
                  <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shadow-sm" />
                  <div className="flex items-center gap-2 rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs font-semibold shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
                    <span>{l.label}</span>
                    <span className="text-[10px] font-normal opacity-60">
                      {role === 'admin' ? 'Admin' : 'Portal'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom: Settings, User Avatar & Logout */}
        <div className="flex flex-col items-center space-y-2.5 pt-2 border-t border-ink-100 dark:border-ink-800/80 w-full">
          {/* Customer Settings */}
          {role === 'customer' && (
            <div className="relative flex justify-center group">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-signal-500 text-white dark:bg-white dark:text-ink-950 shadow-md font-bold'
                      : 'bg-ink-100 dark:bg-ink-850/80 text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-750 hover:text-ink-900 dark:hover:text-white hover:scale-105'
                  }`
                }
                aria-label="Account Settings"
              >
                <Settings size={18} />
              </NavLink>

              {/* Hover Expand */}
              <div className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 z-50 flex items-center opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100">
                <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shadow-sm" />
                <div className="rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs font-semibold shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
                  Account Settings
                </div>
              </div>
            </div>
          )}

          {/* User Avatar */}
          <div className="relative flex justify-center group">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-signal-500 text-white text-xs font-bold shadow-sm hover:scale-105 transition-all cursor-default"
              aria-label={`Logged in as ${user?.name || 'User'}`}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>

            {/* Hover Expand */}
            <div className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 z-50 flex items-center opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100">
              <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shadow-sm" />
              <div className="flex flex-col rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
                <span className="font-bold text-sm">{user?.name || 'User'}</span>
                <span className="text-[10px] opacity-70">{user?.email || ''}</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="relative flex justify-center group">
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-850/80 text-ink-500 dark:text-ink-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:scale-105 transition-all duration-200"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>

            {/* Hover Expand */}
            <div className="pointer-events-none absolute left-[58px] top-1/2 -translate-y-1/2 z-50 flex items-center opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100">
              <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shadow-sm" />
              <div className="rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs font-semibold shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap text-rose-500 dark:text-rose-600">
                Log out
              </div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );

  // --- Mobile Touch-Friendly Drawer (Full Labels on Small Screens) ---
  const mobileContent = (
    <div className="flex h-full flex-col bg-white dark:bg-ink-900">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-ink-100 dark:border-ink-800">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="SmartCart AI"
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
          />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold text-ink-800 dark:text-white">SmartCart AI</p>
            <p className="text-[11px] font-medium text-ink-400">
              {role === 'admin' ? 'Admin Console' : 'Customer Portal'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 text-ink-400"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1.5">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-signal-500 text-white font-semibold shadow-sm'
                      : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-500'}`}>
                      <l.icon size={16} />
                    </div>
                    <span>{l.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-4 pb-5 pt-3 border-t border-ink-100 dark:border-ink-800 space-y-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 dark:bg-ink-850 p-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-500 text-xs font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink-800 dark:text-white">{user?.name || 'User'}</p>
            <p className="truncate text-[10px] text-ink-400">{user?.email || ''}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
        >
          <LogOut size={14} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {desktopSidebar}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[95] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-72 shadow-2xl animate-slideInRight">
            {mobileContent}
          </div>
        </div>
      )}
    </>
  );
}
