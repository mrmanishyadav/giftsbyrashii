'use client';

import Link from 'next/link';
import { Archive, CheckSquare, Edit3, LoaderCircle, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Row = { id: string; name: string; sku: string; price: number; stock: number; is_active: boolean; publication_status?: string | null; updated_at: string };
type Action = 'publish' | 'draft' | 'archive' | 'delete';

export function AdminProductsTable({ products }: { products: Row[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<Action>('publish');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const router = useRouter();
  const allSelected = products.length > 0 && selected.length === products.length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const toggleAll = () => setSelected(allSelected ? [] : products.map((product) => product.id));
  const toggle = (id: string) => setSelected((old) => old.includes(id) ? old.filter((value) => value !== id) : [...old, id]);
  async function run(ids: string[], nextAction: Action) {
    if (!ids.length) return;
    if (nextAction === 'delete' && !window.confirm(`Delete ${ids.length} selected product${ids.length === 1 ? '' : 's'}? Products with order history will be safely archived.`)) return;
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/admin/products/bulk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids, action: nextAction }) });
      const data = await response.json() as { error?: string; message?: string };
      setNotice(response.ok ? data.message ?? 'Products updated.' : data.error ?? 'Update failed.');
      if (response.ok) { setSelected([]); router.refresh(); }
    } catch { setNotice('The request could not reach the server.'); }
    finally { setBusy(false); }
  }
  return <section className="admin-card admin-products-card">
    <div className="product-bulkbar">
      <label className="bulk-select-all"><input type="checkbox" checked={allSelected} onChange={toggleAll} /><CheckSquare />Select all <b>{selected.length ? `${selected.length} selected` : `${products.length} total`}</b></label>
      <div><select value={action} onChange={(event) => setAction(event.target.value as Action)} aria-label="Bulk action"><option value="publish">Publish</option><option value="draft">Move to draft</option><option value="archive">Archive</option><option value="delete">Delete</option></select><button className="button button-primary" disabled={!selected.length || busy} onClick={() => run(selected, action)}>{busy ? <LoaderCircle className="spin" /> : <Archive />}Apply</button></div>
    </div>
    {notice && <p className="form-notice" role="status">{notice}</p>}
    <div className="admin-product-list" role="table" aria-label="Products">
      <div className="admin-product-head" role="row"><span></span><span>Product</span><span>Price</span><span>Stock</span><span>Status</span><span>Updated</span><span>Actions</span></div>
      {products.length ? products.map((product) => <div className={selectedSet.has(product.id) ? 'selected' : ''} role="row" key={product.id}>
        <span><input type="checkbox" checked={selectedSet.has(product.id)} onChange={() => toggle(product.id)} aria-label={`Select ${product.name}`} /></span>
        <span><Link href={`/admin/products/${product.id}`}><b>{product.name}</b><small>{product.sku}</small></Link></span>
        <b>₹{Number(product.price).toLocaleString('en-IN')}</b><span>{product.stock}</span><span className="status-pill">{product.publication_status ?? (product.is_active ? 'published' : 'draft')}</span><span>{new Date(product.updated_at).toLocaleDateString('en-IN')}</span>
        <span className="product-row-actions"><Link href={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`}><Edit3 /></Link><button onClick={() => run([product.id], 'delete')} aria-label={`Delete ${product.name}`}><Trash2 /></button></span>
      </div>) : <p className="admin-empty">No products yet. Add your first product to start the catalog.</p>}
    </div>
  </section>;
}
