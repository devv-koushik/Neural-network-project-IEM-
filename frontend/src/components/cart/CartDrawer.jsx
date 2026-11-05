import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import Button from '../common/Button';

export default function CartDrawer() {
  const {
    items,
    totalCount,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    openCheckout,
  } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') closeCart();
    }
    if (isCartOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Shopping Cart"
        aria-modal="true"
        className="relative flex h-full w-full max-w-md flex-col bg-white dark:bg-ink-900 border-l border-ink-100 dark:border-ink-800 shadow-2xl animate-slideLeft z-10"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-ink-100 dark:border-ink-800 px-6">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-signal-500" />
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-white">
              Shopping Cart
            </h2>
            <span className="rounded-full bg-signal-500/10 dark:bg-signal-500/20 px-2 py-0.5 text-xs font-semibold text-signal-500">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-xl p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-700 dark:hover:text-ink-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-500 mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="font-display text-base font-semibold text-ink-800 dark:text-white">
              Your cart is empty
            </h3>
            <p className="mt-1 text-sm text-ink-400 max-w-xs">
              Explore our curated AI-enhanced storefront and add products to your cart.
            </p>
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => {
                closeCart();
                navigate('/products');
              }}
            >
              Browse Catalog
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 divide-y divide-ink-100 dark:divide-ink-800">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0 group">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-50 dark:bg-ink-800/60 border border-ink-100 dark:border-ink-800 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-xs font-semibold"
                        style={{ color: item.color || '#5B6EF5' }}
                      >
                        {item.category}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wider">
                          {item.category}
                        </p>
                        <h4 className="truncate font-display text-sm font-semibold text-ink-800 dark:text-white">
                          {item.name}
                        </h4>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-ink-400 hover:text-rose-500 transition-colors p-1"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-ink-800 dark:text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center text-ink-500 hover:text-signal-500 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-ink-800 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.stock && item.quantity >= item.stock}
                          className="flex h-7 w-7 items-center justify-center text-ink-500 hover:text-signal-500 transition-colors disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-950/40 p-6 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ink-500 dark:text-ink-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink-800 dark:text-white">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-ink-500 dark:text-ink-300">
                  <span>Standard Shipping</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Free
                  </span>
                </div>
                <div className="flex justify-between border-t border-ink-200/60 dark:border-ink-800 pt-2 text-base font-bold text-ink-800 dark:text-white">
                  <span>Total Amount</span>
                  <span className="text-signal-500 font-display text-lg">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-ink-400">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Encrypted checkout & 100% verified order processing.</span>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  className="w-full justify-center py-2.5"
                  onClick={() => openCheckout()}
                >
                  Proceed to Checkout
                </Button>
                <button
                  onClick={clearCart}
                  className="text-xs text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors py-1 text-center"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

