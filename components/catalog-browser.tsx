'use client';

import { SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

type SortValue = 'featured' | 'bestselling' | 'newest' | 'price-asc' | 'price-desc' | 'sale';

export function CatalogBrowser({ products, initialMaxPrice = '', initialSort = 'featured' }: { products: Product[]; initialMaxPrice?: string; initialSort?: string }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [occasion, setOccasion] = useState('');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [personalized, setPersonalized] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<SortValue>((['featured', 'bestselling', 'newest', 'price-asc', 'price-desc', 'sale'].includes(initialSort) ? initialSort : 'featured') as SortValue);
  const recipients = useMemo(() => [...new Set(products.flatMap((product) => product.recipients))].sort(), [products]);
  const occasions = useMemo(() => [...new Set(products.flatMap((product) => product.occasions))].sort(), [products]);
  const activeCount = [recipient, occasion, maxPrice, personalized, inStock].filter(Boolean).length;
  const visible = useMemo(() => {
    const result = products.filter((product) => {
      if (recipient && !product.recipients.includes(recipient)) return false;
      if (occasion && !product.occasions.includes(occasion)) return false;
      if (maxPrice && product.price > Number(maxPrice)) return false;
      if (personalized && !product.personalized) return false;
      if (inStock && product.stock < 1) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'bestselling') return b.reviewCount - a.reviewCount || b.rating - a.rating;
      if (sort === 'newest') return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      if (sort === 'sale') return (1 - b.price / Math.max(b.mrp, 1)) - (1 - a.price / Math.max(a.mrp, 1));
      return Number(b.badges.includes('Featured')) - Number(a.badges.includes('Featured')) || b.rating - a.rating;
    });
  }, [products, recipient, occasion, maxPrice, personalized, inStock, sort]);
  const reset = () => { setRecipient(''); setOccasion(''); setMaxPrice(''); setPersonalized(false); setInStock(false); };
  return <>
    <div className="catalog-toolbar">
      <button className={filtersOpen ? 'active' : ''} onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}><SlidersHorizontal size={16} />Filters{activeCount > 0 && <b>{activeCount}</b>}</button>
      <div>
        <button className={recipient ? 'active' : ''} onClick={() => setFiltersOpen(true)}>Recipient{recipient && <span> · {recipient}</span>}</button>
        <button className={occasion ? 'active' : ''} onClick={() => setFiltersOpen(true)}>Occasion{occasion && <span> · {occasion}</span>}</button>
        <button className={maxPrice ? 'active' : ''} onClick={() => setFiltersOpen(true)}>Price{maxPrice && <span> · Under ₹{maxPrice}</span>}</button>
        <button className={personalized ? 'active' : ''} onClick={() => setPersonalized((value) => !value)}>Personalisation</button>
        <button className={inStock ? 'active' : ''} onClick={() => setInStock((value) => !value)}>In stock</button>
      </div>
      <label>Sort by <select value={sort} onChange={(event) => setSort(event.target.value as SortValue)}><option value="featured">Featured</option><option value="bestselling">Bestselling</option><option value="newest">Newest</option><option value="sale">Biggest saving</option><option value="price-asc">Price: Low to high</option><option value="price-desc">Price: High to low</option></select></label>
    </div>
    {filtersOpen && <section className="catalog-filters" aria-label="Product filters">
      <div className="filter-title"><span><Sparkles /><b>Find the perfect gift</b><small>{visible.length} matches</small></span><button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X /></button></div>
      <label><span>Recipient</span><select value={recipient} onChange={(event) => setRecipient(event.target.value)}><option value="">Everyone</option>{recipients.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><span>Occasion</span><select value={occasion} onChange={(event) => setOccasion(event.target.value)}><option value="">Every occasion</option>{occasions.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><span>Maximum price</span><select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}><option value="">Any budget</option><option value="499">Under ₹499</option><option value="999">Under ₹999</option><option value="1499">Under ₹1,499</option><option value="2499">Under ₹2,499</option></select></label>
      <label className="filter-check"><input type="checkbox" checked={personalized} onChange={(event) => setPersonalized(event.target.checked)} /><span>Personalised gifts only</span></label>
      <label className="filter-check"><input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} /><span>Available now</span></label>
      {activeCount > 0 && <button className="filter-reset" onClick={reset}>Clear all filters</button>}
    </section>}
    {visible.length ? <div className="product-grid catalog-grid">{visible.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <div className="empty-state"><span>✦</span><h2>No gifts match these filters</h2><p>Clear a filter and let’s find something lovely.</p><button onClick={reset} className="button button-primary">Clear filters</button></div>}
  </>;
}
