import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Brain, History, User, Users, TrendingUp,
  AlertOctagon, SlidersHorizontal, Package,
  ScanEye, BarChart2, Database, Wand2,
  X, LogOut, Settings,
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

  const content = (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-ink-100 dark:border-ink-800">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="SmartCart AI"
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold text-ink-800 dark:text-white" style={{ letterSpacing: '-0.022em' }}>SmartCart AI</p>
            <p className="text-[11px] font-medium text-ink-400">
              {role === 'admin' ? 'Admin Console' : 'Customer Portal'}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden h-7 w-7 flex items-center justify-center rounded-lg border border-ink-200 dark:border-ink-700 text-ink-400" aria-label="Close menu">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-signal-500/10 text-signal-600 dark:text-signal-400'
                      : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100/80 dark:hover:bg-ink-800/60 hover:text-ink-800 dark:hover:text-white'
                  }`
                }
                style={{ letterSpacing: '-0.008em' }}
              >
                {({ isActive }) => (
                  <>
                    <l.icon size={16} className={`shrink-0 transition-colors ${isActive ? 'text-signal-500' : ''}`} />
                    <span className="truncate">{l.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-signal-500 shrink-0" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section — user card + logout */}
      <div className="px-3 pb-4 space-y-2 border-t border-ink-100 dark:border-ink-800 pt-3">
        {/* User info chip */}
        <div className="flex items-center gap-2.5 rounded-xl bg-ink-50 dark:bg-ink-850 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-500 text-xs font-bold text-white shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-800 dark:text-white" style={{ letterSpacing: '-0.008em' }}>
              {user?.name || 'User'}
            </p>
            <p className="truncate text-[11px] text-ink-400">{user?.email || ''}</p>
          </div>
        </div>

        {/* Profile link — only for customer role (admins don't have a /profile page) */}
        {role === 'customer' && (
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-signal-500/10 text-signal-600 dark:text-signal-400'
                  : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100/80 dark:hover:bg-ink-800/60 hover:text-ink-800 dark:hover:text-white'
              }`
            }
            style={{ letterSpacing: '-0.008em' }}
          >
            <Settings size={15} className="shrink-0" />
            <span>Account settings</span>
          </NavLink>
        )}

        {/* Logout button — available on both admin and customer sidebars */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 dark:text-ink-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          style={{ letterSpacing: '-0.008em' }}
        >
          <LogOut size={15} className="shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 lg:border-r lg:border-ink-100 dark:lg:border-ink-800 lg:bg-white dark:lg:bg-ink-900">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[95] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-ink-900 shadow-soft-lg animate-slideInRight">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
