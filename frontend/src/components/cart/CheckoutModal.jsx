import { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, CreditCard, Truck, Zap, ShoppingBag, ArrowRight } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { checkoutOrder } from '../../services/api';

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    items,
    subtotal,
    clearCart,
    checkoutDirectItem,
  } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || 'Pritam Sharma',
    email: user?.email || 'customer@demo.com',
    address: '42 Silicon Avenue, Tech Hub',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    phone: '+1 (555) 382-9102',
    paymentMethod: 'Instant Demo Checkout',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Reset confirmation state when modal opens
  useEffect(() => {
    if (isCheckoutOpen) {
      setConfirmedOrder(null);
      setLoading(false);
    }
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  // Items to checkout: either direct Buy Now item or entire cart
  const checkoutItems = checkoutDirectItem
    ? [
        {
          id: checkoutDirectItem.product.id,
          name: checkoutDirectItem.product.name,
          category: checkoutDirectItem.product.category,
          price: checkoutDirectItem.product.price,
          quantity: checkoutDirectItem.quantity,
          imageUrl: checkoutDirectItem.product.imageUrl,
        },
      ]
    : items;

  const orderTotal = checkoutDirectItem
    ? checkoutDirectItem.product.price * checkoutDirectItem.quantity
    : subtotal;

  async function handlePlaceOrder(e) {
    e?.preventDefault();
    if (checkoutItems.length === 0) return;

    setLoading(true);
    try {
      const payload = {
        items: checkoutItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
        shipping: {
          name: formData.name,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          phone: formData.phone,
        },
        payment_method: formData.paymentMethod,
      };

      const result = await checkoutOrder(payload);
      setConfirmedOrder(result);

      // If cart checkout, clear the cart
      if (!checkoutDirectItem) {
        clearCart();
      }

      showToast(`Order ${result.order_id} placed successfully!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to place order.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={isCheckoutOpen}
      onClose={closeCheckout}
      title={confirmedOrder ? 'Order Confirmation' : 'Fast & Secure Checkout'}
      size="lg"
    >
      {confirmedOrder ? (
        <div className="py-4 text-center space-y-5 animate-scaleIn">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Payment Confirmed
            </span>
            <h3 className="mt-2 font-display text-2xl font-bold text-ink-800 dark:text-white">
              Thank You for Your Order!
            </h3>
            <p className="mt-1 text-sm text-ink-400">
              Your order has been recorded and is now being processed.
            </p>
          </div>

          {/* Receipt Card */}
          <div className="rounded-2xl border border-ink-100 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-850/60 p-5 text-left space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-ink-100 dark:border-ink-800 text-sm">
              <span className="text-ink-400">Order ID</span>
              <span className="font-mono font-bold text-signal-500">
                {confirmedOrder.order_id}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-400">Estimated Delivery</span>
              <span className="font-semibold text-ink-700 dark:text-ink-200">
                {confirmedOrder.estimated_delivery}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-400">Shipping To</span>
              <span className="font-medium text-ink-700 dark:text-ink-200 truncate max-w-xs">
                {formData.address}, {formData.city}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-400">Payment Method</span>
              <span className="font-medium text-ink-700 dark:text-ink-200">
                {confirmedOrder.payment_method}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-ink-100 dark:border-ink-800 text-base font-bold">
              <span className="text-ink-800 dark:text-white">Total Paid</span>
              <span className="text-signal-500 font-display text-lg">
                ${confirmedOrder.total_amount?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              variant="primary"
              className="px-8"
              onClick={closeCheckout}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left 3 cols: Shipping & Payment */}
            <div className="lg:col-span-3 space-y-5">
              <div>
                <h4 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-3 flex items-center gap-2">
                  <Truck size={16} className="text-signal-500" />
                  Shipping Information
                </h4>
                <div className="space-y-3">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    <Input
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    label="Street Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                    <Input
                      label="State"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                    <Input
                      label="Zip Code"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-signal-500" />
                  Payment Method
                </h4>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'Instant Demo Checkout', label: '1-Click Demo', icon: Zap },
                    { id: 'Credit Card', label: 'Card Payment', icon: CreditCard },
                    { id: 'Cash on Delivery', label: 'Cash on Delivery', icon: Truck },
                  ].map((m) => {
                    const active = formData.paymentMethod === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: m.id })}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          active
                            ? 'border-signal-500 bg-signal-500/10 text-signal-500 font-semibold'
                            : 'border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 text-ink-600 dark:text-ink-300 hover:border-ink-300'
                        }`}
                      >
                        <Icon size={18} className="mb-1" />
                        <span className="text-xs">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 2 cols: Order Summary */}
            <div className="lg:col-span-2 flex flex-col justify-between rounded-2xl border border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-850/50 p-4">
              <div>
                <h4 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-3 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-signal-500" />
                  Order Summary
                </h4>

                <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 divide-y divide-ink-100 dark:divide-ink-800">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs pt-2 first:pt-0">
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-ink-800 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-ink-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-ink-700 dark:text-ink-200 shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-ink-200/60 dark:border-ink-800 mt-4 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-ink-500">
                    <span>Subtotal</span>
                    <span>${orderTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-ink-500">
                    <span>Shipping</span>
                    <span className="text-emerald-500 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between border-t border-ink-200/60 dark:border-ink-800 pt-2 text-sm font-bold text-ink-800 dark:text-white">
                    <span>Total</span>
                    <span className="text-signal-500 font-display text-base">
                      ${orderTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  icon={ArrowRight}
                  className="w-full justify-center py-2.5"
                >
                  Confirm & Pay ${orderTotal.toFixed(2)}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>256-bit SSL encrypted demo payment</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

