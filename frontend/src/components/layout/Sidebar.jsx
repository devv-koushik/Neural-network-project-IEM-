import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, ScanEye, ShoppingCart, Users, TrendingUp,
  AlertOctagon, SlidersHorizontal, Package,
  BarChart2, Database, Wand2,
  X, LogOut, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useCart } from '../../hooks/useCart';

const CUSTOMER_LINKS = [
  { to: '/customer/products',  label: 'Products',           icon: ShoppingBag },
  { to: '/visual-recognition', label: 'Visual Recognition',  icon: ScanEye },
  { to: '#cart',               label: 'Shopping Cart',      icon: ShoppingCart, isCart: true },
];

const ADMIN_LINKS = [
  { to: '/admin/customers',               label: 'Customers',             icon: Users },
  { to: '/admin/products',                label: 'Products',              icon: Package },
  { to: '/admin/purchase-prediction',     label: 'Purchase Prediction',   icon: TrendingUp },
  { to: '/admin/churn-prediction',        label: 'Churn Prediction',      icon: AlertOctagon },
  { to: '/admin/hyperparameter-tuning',   label: 'Hyperparameter Tuning', icon: SlidersHorizontal },
  { to: '/admin/visual-recognition',      label: 'Visual Recognition',    icon: ScanEye },
  { to: '/admin/demand-forecasting',      label: 'Demand Forecasting',    icon: BarChart2 },
  { to: '/admin/synthetic-data',          label: 'Synthetic Data',        icon: Database },
  { to: '/admin/ai-content',              label: 'AI Content Generation', icon: Wand2 },
];

export default function Sidebar({ role = 'customer', mobileOpen = false, onClose }) {
  const links = role === 'admin' ? ADMIN_LINKS : CUSTOMER_LINKS;
  const { user, logout } = useAuth();
  const { totalCount, openCart } = useCart();
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
    <aside className="hidden lg:flex lg:w-[76px] lg:flex-col lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-ink-100 dark:lg:border-ink-800 lg:bg-white dark:lg:bg-ink-950 z-[70] select-none py-5 overflow-visible">
      <div className="flex h-full w-full flex-col items-center overflow-visible">
        
        {/* Top: Logo & AI Status Bubble */}
        <div className="flex flex-col items-center gap-2.5 shrink-0 mb-4 overflow-visible">
          {/* Logo Icon */}
          <div className="relative flex justify-center group overflow-visible">
            <Link
              to="/"
              className="flex h-11 w-11 items-center justify-center rounded-2xl overflow-hidden bg-signal-500/10 dark:bg-signal-500/15 border border-signal-500/20 hover:scale-105 transition-all duration-200"
              aria-label="SmartCart AI Home"
            >
              <img
                src="/logo.jpg"
                alt="SmartCart AI"
                className="h-8 w-8 object-cover rounded-xl"
              />
            </Link>
            {/* Expandable Label */}
            <div className="pointer-events-none absolute left-[56px] top-1/2 -translate-y-1/2 z-[80] flex items-center pl-2 opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 drop-shadow-xl">
              <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shrink-0 shadow-sm" />
              <div className="flex flex-col rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
                <span className="font-bold font-display text-sm">SmartCart AI</span>
                <span className="text-[10px] opacity-70">
                  {role === 'admin' ? 'Admin Console' : 'Customer Portal'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick AI Status Bubble (matches circular +2 pill in screenshot) */}
          <div className="relative flex justify-center group overflow-visible">
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
            <div className="pointer-events-none absolute left-[56px] top-1/2 -translate-y-1/2 z-[80] flex items-center pl-2 opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 drop-shadow-xl">
              <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shrink-0 shadow-sm" />
              <div className="flex items-center gap-2 rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs font-semibold shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>5 AI Modules Trained & Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Navigation Column of Circular Buttons */}
        <nav className="flex-1 w-full flex flex-col items-center overflow-visible py-1">
          <ul className="flex flex-col items-center space-y-2.5 overflow-visible">
            {links.map((l) => (
              <li key={l.to} className="relative flex justify-center group overflow-visible">
                {l.isCart ? (
                  <button
                    type="button"
                    onClick={openCart}
                    className="relative flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-850/80 text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-750 hover:text-signal-500 dark:hover:text-signal-400 hover:scale-105 transition-all duration-200"
                    aria-label={`Shopping cart with ${totalCount} items`}
                  >
                    <l.icon size={18} strokeWidth={1.8} />
                    {totalCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-ink-950">
                        {totalCount}
                      </span>
                    )}
                  </button>
                ) : (
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
                )}

                {/* Hover Expandable Option Name */}
                <div className="pointer-events-none absolute left-[56px] top-1/2 -translate-y-1/2 z-[80] flex items-center pl-2 opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 drop-shadow-xl">
                  <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shrink-0 shadow-sm" />
                  <div className="flex items-center gap-2 rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs font-semibold shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
                    <span>{l.label}</span>
                    {l.isCart ? (
                      <span className="text-[10px] font-normal opacity-60">
                        {totalCount > 0 ? `${totalCount} item${totalCount === 1 ? '' : 's'}` : 'Empty'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-normal opacity-60">
                        {role === 'admin' ? 'Admin' : 'Portal'}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom: User Avatar & Logout */}
        <div className="mt-auto flex flex-col items-center space-y-2.5 pt-3 border-t border-ink-100 dark:border-ink-800/80 w-full shrink-0 overflow-visible">

          {/* User Avatar / Profile Link */}
          <div className="relative flex justify-center group overflow-visible">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-signal-500 text-white shadow-lg shadow-signal-500/30 ring-2 ring-signal-500 ring-offset-2 dark:ring-offset-ink-950 scale-105'
                    : 'bg-signal-500 text-white hover:scale-110 hover:shadow-md'
                }`
              }
              aria-label={`View Profile: ${user?.name || 'User'}`}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </NavLink>

            {/* Hover Expand */}
            <div className="pointer-events-none absolute left-[56px] top-1/2 -translate-y-1/2 z-[80] flex items-center pl-2 opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 drop-shadow-xl">
              <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shrink-0 shadow-sm" />
              <div className="flex flex-col rounded-xl bg-ink-900 dark:bg-white text-white dark:text-ink-950 px-3.5 py-2 text-xs shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <span>{user?.name || 'User'}</span>
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-signal-500/10 text-signal-500 dark:bg-signal-500/20">Profile</span>
                </div>
                <span className="text-[10px] opacity-70">{user?.email || 'Click to open profile'}</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="relative flex justify-center group overflow-visible">
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-850/80 text-ink-500 dark:text-ink-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:scale-105 transition-all duration-200"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>

            {/* Hover Expand */}
            <div className="pointer-events-none absolute left-[56px] top-1/2 -translate-y-1/2 z-[80] flex items-center pl-2 opacity-0 -translate-x-2 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 drop-shadow-xl">
              <div className="h-2 w-2 -mr-1 rotate-45 bg-ink-900 dark:bg-white shrink-0 shadow-sm" />
              <div className="rounded-xl bg-ink-900 dark:bg-white text-rose-500 dark:text-rose-600 px-3.5 py-2 text-xs font-semibold shadow-2xl border border-ink-800 dark:border-ink-200 whitespace-nowrap">
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
              {l.isCart ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    openCart();
                  }}
                  className="w-full flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800 text-ink-500">
                      <l.icon size={16} />
                    </div>
                    <span>{l.label}</span>
                  </div>
                  {totalCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-signal-500 px-1.5 text-xs font-bold text-white">
                      {totalCount}
                    </span>
                  )}
                </button>
              ) : (
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
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-4 pb-5 pt-3 border-t border-ink-100 dark:border-ink-800 space-y-2">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-xl p-2.5 transition-colors ${
              isActive
                ? 'bg-signal-500/10 text-signal-500 dark:bg-signal-500/15 font-semibold ring-1 ring-signal-500/30'
                : 'bg-ink-50 dark:bg-ink-850 hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-800 dark:text-white'
            }`
          }
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-500 text-xs font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="truncate text-xs font-semibold">{user?.name || 'User'}</p>
              <span className="text-[9px] font-semibold text-signal-500 uppercase tracking-wide">Profile →</span>
            </div>
            <p className="truncate text-[10px] text-ink-400">{user?.email || 'View Profile'}</p>
          </div>
        </NavLink>

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
