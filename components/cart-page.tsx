'use client';

import Link from 'next/link';
import { Gift, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { calculateTotals, FREE_SHIPPING_THRESHOLD } from '@/lib/pricing';
import { CouponBox, type AppliedCoupon } from './coupon-box';
import { useCart } from './cart-provider';

export function CartPage() {
  const { items, remove, setQuantity, couponCode, setCouponCode } = useCart();
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const couponItems = items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
  const fingerprint = JSON.stringify([couponItems, undefined]);
  const activeCoupon = applied?.fingerprint === fingerprint ? applied : null;
  const priceLines = items.map((item) => ({ id: item.id, price: item.price, mrp: item.mrp, quantity: item.quantity }));
  const totals = calculateTotals(priceLines, activeCoupon ? { type: 'fixed', value: activeCoupon.discount } : undefined);

  function updateCoupon(coupon: AppliedCoupon | null) {
    setApplied(coupon);
    setCouponCode(coupon?.code ?? '');
  }

  if (!items.length) return <div className="empty-state cart-empty"><ShoppingBag /><h1>Your gift bag is waiting</h1><p>Beautiful surprises are just a few thoughtful clicks away.</p><Link href="/shop" className="button button-primary">Explore gifts</Link></div>;

  return <main className="cart-page shell">
    <div className="cart-title"><h1>Your gift bag</h1><span>{items.length} {items.length === 1 ? 'gift' : 'gifts'}</span></div>
    <div className="cart-layout">
      <section>
        <div className="shipping-progress"><div><b>{totals.shipping === 0 ? 'You unlocked free shipping!' : `Add ₹${Math.max(0, FREE_SHIPPING_THRESHOLD - (totals.subtotal - totals.couponDiscount))} more for free shipping`}</b><span>{totals.shipping === 0 ? 'A little more joy, on us.' : 'You’re almost there.'}</span></div><div><i style={{ width: `${Math.min(100, (totals.subtotal - totals.couponDiscount) / FREE_SHIPPING_THRESHOLD * 100)}%` }} /></div></div>
        {items.map((item) => <article className="cart-item" key={item.id}><div className="cart-art" style={{ background: item.color }}><Gift /></div><div><Link href={`/product/${item.slug}`}><h2>{item.name}</h2></Link>{item.personalization && <p>Personalised: {Object.values(item.personalization).join(', ')}</p>}{item.hamper && <p>{item.hamper.items.length} hamper items · {item.hamper.packaging}</p>}<span>₹{item.price.toLocaleString('en-IN')} <s>₹{item.mrp.toLocaleString('en-IN')}</s></span><div className="quantity"><button onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity"><Minus /></button><span>{item.quantity}</span><button onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity"><Plus /></button></div></div><button className="remove" onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 /></button></article>)}
      </section>
      <aside className="order-summary">
        <h2>Order summary</h2>
        <div><span>Subtotal</span><b>₹{totals.subtotal.toLocaleString('en-IN')}</b></div>
        <div><span>Product savings</span><b className="saving">−₹{totals.productSavings.toLocaleString('en-IN')}</b></div>
        {activeCoupon && <div><span>Coupon ({activeCoupon.code})</span><b className="saving">−₹{totals.couponDiscount.toLocaleString('en-IN')}</b></div>}
        <div><span>Shipping</span><b>{totals.shipping ? `₹${totals.shipping}` : 'Free'}</b></div>
        <CouponBox key={couponCode || 'cart-coupon'} items={couponItems} initialCode={couponCode} applied={applied} onApplied={updateCoupon} />
        <div className="total"><span>Estimated total<small>Inclusive of taxes</small></span><b>₹{totals.total.toLocaleString('en-IN')}</b></div>
        <Link href="/checkout" className="button button-primary">Continue to checkout →</Link>
        <p>Final coupon and pricing are verified securely on the server.</p>
      </aside>
    </div>
  </main>;
}
