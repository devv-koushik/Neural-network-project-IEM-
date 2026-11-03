import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingCart, Zap, ChevronRight, PackageX } from 'lucide-react';
import { PublicLayout } from '../../components/layout/Layout';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import ProductCard from '../../components/products/ProductCard';
import { getProduct } from '../../services/api';
import { getRelatedProducts } from '../../data/products';
import { useToast } from '../../hooks/useToast';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState(1);

  function load() {
    setLoading(true);
    setError(false);
    getProduct(id)
      .then((data) => {
        if (!data) setError(true);
        else setProduct(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); setQty(1); }, [id]);

  if (loading) return <PublicLayout><LoadingSpinner label="Loading product..." className="py-32" /></PublicLayout>;
  if (error || !product) return <PublicLayout><div className="section-pad mx-auto max-w-4xl py-20"><ErrorState title="Product not found" description="This product may have been removed." onRetry={() => navigate('/products')} /></div></PublicLayout>;

  const Icon = product.image;
  const related = getRelatedProducts(product);
  const outOfStock = product.stock === 0;

  return (
    <PublicLayout>
      <div className="section-pad mx-auto max-w-7xl py-8 sm:py-12">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-ink-400">
          <Link to="/products" className="hover:text-signal-500">Products</Link>
          <ChevronRight size={12} />
          <span>{product.category}</span>
          <ChevronRight size={12} />
          <span className="text-ink-600 dark:text-ink-200">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="flex h-80 items-center justify-center rounded-2xl sm:h-[420px]" style={{ background: `linear-gradient(135deg, ${product.color}18, ${product.color}05)` }}>
            <Icon size={140} strokeWidth={1.2} style={{ color: product.color }} />
          </div>

          <div>
            <Badge tone="signal">{product.category}</Badge>
            <h1 className="mt-3 font-display text-2xl font-bold text-ink-800 dark:text-white sm:text-3xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Star size={15} className="fill-amber-500 text-amber-500" />
                <span className="font-semibold text-ink-700 dark:text-ink-100">{product.rating}</span>
              </div>
              <span className="text-ink-400">({product.reviews} reviews)</span>
              {outOfStock ? <Badge tone="coral" icon={PackageX}>Out of stock</Badge> : <Badge tone="mint">{product.stock} in stock</Badge>}
            </div>

            <p className="mt-5 font-display text-3xl font-bold text-ink-800 dark:text-white">${product.price.toFixed(2)}</p>
            <p className="mt-4 text-sm leading-relaxed text-ink-500 dark:text-ink-300">{product.description}</p>

            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-medium text-ink-600 dark:text-ink-300">Quantity</span>
              <div className="flex items-center rounded-xl border border-ink-200 dark:border-ink-700">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center text-ink-500 dark:text-ink-300 hover:text-signal-500" aria-label="Decrease quantity"><Minus size={15} /></button>
                <span className="w-8 text-center text-sm font-semibold text-ink-800 dark:text-white">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock || 1, q + 1))} className="flex h-10 w-10 items-center justify-center text-ink-500 dark:text-ink-300 hover:text-signal-500" aria-label="Increase quantity"><Plus size={15} /></button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary" icon={ShoppingCart} disabled={outOfStock} onClick={() => showToast(`${qty} × ${product.name} added to cart.`, 'success')} className="flex-1 sm:flex-none">
                Add to Cart
              </Button>
              <Button variant="primary" icon={Zap} disabled={outOfStock} onClick={() => showToast('Redirecting to checkout...', 'info')} className="flex-1 sm:flex-none">
                Buy Now
              </Button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-bold text-ink-800 dark:text-white">Related products</h2>
            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
