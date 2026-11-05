import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import Badge from '../common/Badge';
import { useToast } from '../../hooks/useToast';

export default function ProductCard({ product }) {
  const { showToast } = useToast();
  const [imgFailed, setImgFailed] = useState(false);
  const Icon = product.image;
  const outOfStock = product.stock === 0;

  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    showToast(`${product.name} added to cart.`, 'success');
  }

  const hasRealImage = Boolean(product.imageUrl && !imgFailed);

  return (
    <Link to={`/products/${product.id}`} className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-ink-50 dark:bg-ink-900/40">
        {hasRealImage ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${product.color}14, ${product.color}05)` }}
          >
            {Icon && <Icon size={56} strokeWidth={1.4} style={{ color: product.color }} className="transition-transform duration-300 group-hover:scale-110" />}
          </div>
        )}
        {product.featured && <Badge tone="signal" className="absolute left-3 top-3 shadow-sm backdrop-blur-sm">Featured</Badge>}
        {outOfStock && <Badge tone="coral" className="absolute right-3 top-3 shadow-sm backdrop-blur-sm">Out of stock</Badge>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-ink-400">{product.category}</p>
        <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-ink-800 dark:text-white">{product.name}</h3>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-ink-400">
          <Star size={13} className="fill-amber-500 text-amber-500" />
          <span className="font-medium text-ink-600 dark:text-ink-300">{product.rating}</span>
          <span>({product.reviews})</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-ink-800 dark:text-white">${product.price.toFixed(2)}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.preventDefault(); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-300 hover:text-signal-500 hover:border-signal-500/40"
              aria-label="View details"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-500 text-white hover:bg-signal-600 disabled:opacity-40"
              aria-label="Add to cart"
            >
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
