import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, PackageX } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/api';
import { CATEGORIES } from '../../data/products';
import { useToast } from '../../hooks/useToast';

// Local-only overrides used ONLY when the backend write call fails (e.g.
// backend not running). Lets the admin demo still feel functional offline,
// while every successful call goes straight to the Flask API + SQLite.
const STORAGE_KEY = 'sc_admin_products_offline_overrides';

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { added: [], edited: {}, deleted: [] }; }
  catch { return { added: [], edited: {}, deleted: [] }; }
}

const EMPTY_FORM = { name: '', category: 'Electronics', price: '', stock: '', rating: 4.5, description: '' };

export default function ProductsManagement() {
  const [baseProducts, setBaseProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState(loadOverrides());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  function reload() {
    setLoading(true);
    getProducts().then((d) => { setBaseProducts(d); setLoading(false); });
  }

  useEffect(() => { reload(); }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides]);

  const products = useMemo(() => {
    const merged = baseProducts
      .filter((p) => !overrides.deleted.includes(p.id))
      .map((p) => (overrides.edited[p.id] ? { ...p, ...overrides.edited[p.id] } : p));
    return [...merged, ...overrides.added];
  }, [baseProducts, overrides]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || p.category === category;
      const matchesStock = stockFilter === 'All' || (stockFilter === 'In Stock' ? p.stock > 0 : p.stock === 0);
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, category, stockFilter]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({ name: product.name, category: product.category, price: product.price, stock: product.stock, rating: product.rating, description: product.description });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || form.price === '') {
      showToast('Please fill in the required fields.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, form);
        showToast('Product updated.', 'success');
      } else {
        await createProduct(form);
        showToast('Product added.', 'success');
      }
      setModalOpen(false);
      reload();
    } catch (error) {
      // Backend unreachable or rejected the write - fall back to a local-only
      // override so the admin can still see the change reflected in this browser.
      console.warn('[ProductsManagement] backend write failed, saving locally only.', error?.message || error);
      if (editingId) {
        setOverrides((o) => ({ ...o, edited: { ...o.edited, [editingId]: { ...form, price: Number(form.price), stock: Number(form.stock) } } }));
      } else {
        const newProduct = {
          id: `local_${Date.now()}`, image: products[0]?.image, color: '#5B6EF5', reviews: 0, featured: false,
          ...form, price: Number(form.price), stock: Number(form.stock) || 0,
        };
        setOverrides((o) => ({ ...o, added: [newProduct, ...o.added] }));
      }
      showToast('Backend unavailable — saved locally in this browser only.', 'warning');
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteProduct(id);
      showToast('Product deleted.', 'success');
      reload();
    } catch (error) {
      console.warn('[ProductsManagement] backend delete failed, hiding locally only.', error?.message || error);
      if (String(id).startsWith('local_')) {
        setOverrides((o) => ({ ...o, added: o.added.filter((p) => p.id !== id) }));
      } else {
        setOverrides((o) => ({ ...o, deleted: [...o.deleted, id] }));
      }
      showToast('Backend unavailable — hidden locally in this browser only.', 'warning');
    } finally {
      setConfirmDeleteId(null);
    }
  }

  return (
    <DashboardLayout role="admin" title="Products Management" subtitle="Add, edit, and remove storefront products">
      <div className="card p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="input pl-9" aria-label="Search products" />
          </div>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} options={['All', ...CATEGORIES]} className="sm:w-48" />
          <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} options={['All', 'In Stock', 'Out of Stock']} className="sm:w-44" />
          <Button variant="primary" icon={Plus} onClick={openAdd} className="shrink-0">Add Product</Button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading products..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={PackageX} title="No products found" description="Try adjusting your filters or add a new product." />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-800">
                  {['Product', 'Category', 'Price', 'Stock', 'Rating', ''].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-ink-50 dark:border-ink-800/60">
                    <td className="px-3 py-3 font-medium text-ink-800 dark:text-white max-w-xs truncate">{p.name}</td>
                    <td className="px-3 py-3 text-ink-500 dark:text-ink-300">{p.category}</td>
                    <td className="px-3 py-3 text-ink-600 dark:text-ink-200">${Number(p.price).toFixed(2)}</td>
                    <td className="px-3 py-3">{p.stock === 0 ? <Badge tone="coral">Out of stock</Badge> : <Badge tone="mint">{p.stock} in stock</Badge>}</td>
                    <td className="px-3 py-3 text-ink-500 dark:text-ink-300">{p.rating}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(p)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-signal-500" aria-label="Edit product"><Pencil size={14} /></button>
                        <button onClick={() => setConfirmDeleteId(p.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-coral-500/10 hover:text-coral-500" aria-label="Delete product"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit product' : 'Add product'} size="md"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Save</Button></>}>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input id="pname" label="Product name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} options={CATEGORIES} />
            <Input id="pprice" label="Price ($)" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            <Input id="pstock" label="Stock" type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
            <Input id="prating" label="Rating" type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))} />
          </div>
          <div>
            <label htmlFor="pdesc" className="label">Description</label>
            <textarea id="pdesc" rows={3} className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Delete product"
        footer={<><Button variant="secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={() => handleDelete(confirmDeleteId)}>Delete</Button></>}>
        <p className="text-sm text-ink-500 dark:text-ink-300">Are you sure you want to delete this product? This action cannot be undone.</p>
      </Modal>
    </DashboardLayout>
  );
}
