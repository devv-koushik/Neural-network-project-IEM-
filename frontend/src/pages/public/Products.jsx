import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, PackageSearch } from 'lucide-react';
import { PublicLayout } from '../../components/layout/Layout';
import ProductCard from '../../components/products/ProductCard';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import { getProducts } from '../../services/api';
import { CATEGORIES } from '../../data/products';

const PAGE_SIZE = 8;
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

// --- Shared products UI (used by both /products and /customer/products) ---
export function ProductsBody({ products, loading }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(1500);
  const [sort, setSort] = useState('featured');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All') list = list.filter((p) => p.category === category);
    list = list.filter((p) => p.price <= maxPrice);
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    else list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [products, search, category, maxPrice, sort]);

  const visibleProducts = filtered.slice(0, visible);

  return (
    <div className="section-pad mx-auto max-w-7xl py-10 sm:py-14">
      <div className="mb-8">
        <p className="eyebrow">Storefront</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink-800 dark:text-white">Browse products</h1>
        <p className="mt-2 text-sm text-ink-400">{filtered.length} products found</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={16} className="text-signal-500" />
            <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">Filters</h3>
          </div>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
              placeholder="Search products..."
              className="input pl-9"
              aria-label="Search products"
            />
          </div>
          <div className="mb-4">
            <p className="label">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {['All', ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setVisible(PAGE_SIZE); }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === c ? 'bg-signal-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-300 hover:text-ink-800 dark:hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="maxPrice" className="label">Max price: ${maxPrice}</label>
            <input
              id="maxPrice" type="range" min={20} max={1500} step={10} value={maxPrice}
              onChange={(e) => { setMaxPrice(Number(e.target.value)); setVisible(PAGE_SIZE); }}
              className="w-full accent-signal-500"
            />
          </div>
          <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} options={SORT_OPTIONS} />
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : visibleProducts.length === 0 ? (
            <EmptyState icon={PackageSearch} title="No products found" description="Try adjusting your filters or search term." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {visible < filtered.length && (
                <div className="mt-8 flex justify-center">
                  <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>Load more</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Public /products page — ALWAYS uses PublicLayout regardless of auth state.
// Landing page and unauthenticated visitors land here.
export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then((data) => { setProducts(data); setLoading(false); });
  }, []);

  return (
    <PublicLayout>
      <ProductsBody products={products} loading={loading} />
    </PublicLayout>
  );
}
