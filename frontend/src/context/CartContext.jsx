import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';

const CartContext = createContext(null);

const STORAGE_KEY = 'smartcart_cart_items';

export function CartProvider({ children }) {
  const { showToast } = useToast();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutDirectItem, setCheckoutDirectItem] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore local storage errors
    }
  }, [items]);

  function addToCart(product, quantity = 1, openDrawer = false) {
    if (!product) return;
    const qty = Math.max(1, Number(quantity) || 1);

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === product.id);
      if (existingIdx > -1) {
        const next = [...prev];
        const currentQty = next[existingIdx].quantity;
        const maxStock = product.stock || 999;
        const updatedQty = Math.min(maxStock, currentQty + qty);
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: updatedQty,
          stock: product.stock ?? next[existingIdx].stock,
          imageUrl: product.imageUrl || next[existingIdx].imageUrl,
          price: product.price ?? next[existingIdx].price,
        };
        return next;
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          category: product.category || 'General',
          imageUrl: product.imageUrl || null,
          color: product.color || '#5B6EF5',
          stock: product.stock ?? 10,
          quantity: qty,
        },
      ];
    });

    showToast(`${qty} × ${product.name} added to cart.`, 'success');
    if (openDrawer) {
      setIsCartOpen(true);
    }
  }

  function updateQuantity(productId, newQty) {
    const qty = Number(newQty);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const maxStock = item.stock || 999;
          return { ...item, quantity: Math.min(maxStock, qty) };
        }
        return item;
      })
    );
  }

  function removeFromCart(productId) {
    setItems((prev) => prev.filter((i) => i.id !== productId));
    showToast('Item removed from cart.', 'info');
  }

  function clearCart() {
    setItems([]);
  }

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  function openCheckout(directItem = null) {
    if (directItem) {
      setCheckoutDirectItem(directItem);
    } else {
      setCheckoutDirectItem(null);
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }

  function closeCheckout() {
    setIsCheckoutOpen(false);
    setCheckoutDirectItem(null);
  }

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotal,
        isCartOpen,
        isCheckoutOpen,
        checkoutDirectItem,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        openCart,
        closeCart,
        openCheckout,
        closeCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

