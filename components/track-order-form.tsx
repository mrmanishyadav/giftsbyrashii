'use client';

import { LoaderCircle, PackageSearch, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { OrderProgress } from './order-progress';

type Result = { id: string; orderNumber: string; status: string; createdAt: string; trackingUrl?: string | null; history: { id: string; status: string; note?: string; created_at: string }[] };

export function TrackOrderForm() {
  const [result, setResult] = useState<Result | null>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setNotice(''); setResult(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/orders/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderNumber: form.get('orderNumber'), mobile: form.get('mobile') }) });
      const data = await response.json() as { order?: Result; error?: string };
      if (!response.ok || !data.order) setNotice(data.error ?? 'Tracking details could not be loaded.'); else setResult(data.order);
    } catch { setNotice('Tracking could not reach the server. Please try again.'); }
    finally { setLoading(false); }
  }
  return <div className="track-order-layout">
    <form className="track-order-card" onSubmit={submit}><span className="eyebrow"><Sparkles />LIVE ORDER UPDATES</span><h1>Where’s your lovely gift?</h1><p>Enter the order number from your confirmation and the mobile number used at checkout.</p><label className="field"><span>Order number</span><input name="orderNumber" required placeholder="GM-2026-000001" autoComplete="off" /></label><label className="field"><span>Mobile number</span><input name="mobile" required inputMode="tel" placeholder="10-digit mobile number" /></label><button className="button button-primary" disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <Search />}{loading ? 'Finding your order…' : 'Track order'}</button>{notice && <p className="form-error" role="alert">{notice}</p>}</form>
    <section className={`tracking-result ${result ? 'has-result' : ''}`}>{result ? <><div className="tracking-result-head"><span><small>ORDER</small><b>{result.orderNumber}</b></span><span className="status-pill">{result.status.replaceAll('_', ' ')}</span></div><OrderProgress status={result.status} /><div className="tracking-timeline"><h2>Latest updates</h2>{result.history.length ? result.history.map((item) => <div key={item.id}><i /><span><b>{item.status.replaceAll('_', ' ')}</b><small>{new Date(item.created_at).toLocaleString('en-IN')}{item.note ? ` · ${item.note}` : ''}</small></span></div>) : <p>Your order is confirmed. The next update will appear here.</p>}</div>{result.trackingUrl && <a className="button button-soft" href={result.trackingUrl} target="_blank" rel="noreferrer"><PackageSearch />Open courier tracking</a>}</> : <><PackageSearch /><h2>Every happy step, in one place</h2><p>Once matched, you’ll see confirmation, packing, shipping and delivery updates here.</p></>}</section>
  </div>;
}
