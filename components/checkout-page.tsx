'use client';

import Link from 'next/link';
import { CheckCircle2, Gift, LoaderCircle, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { calculateTotals } from '@/lib/pricing';
import { CouponBox, type AppliedCoupon } from './coupon-box';
import { useCart } from './cart-provider';
import { OrderConfirmationModal } from './order-confirmation-modal';

type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; handler: (result: RazorpayResult) => void; modal: { ondismiss: () => void }; theme: { color: string } };
declare global { interface Window { Razorpay?: new(options: RazorpayOptions) => { open: () => void } } }

export function CheckoutPage() {
  const { items, clear, couponCode, setCouponCode } = useCart();
  const [method, setMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<{ orderNumber: string; orderId: string } | null>(null);
  const couponItems = items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
  const fingerprint = JSON.stringify([couponItems, method]);
  const activeCoupon = applied?.fingerprint === fingerprint ? applied : null;
  const totals = calculateTotals(items.map((item) => ({ id: item.id, price: item.price, mrp: item.mrp, quantity: item.quantity })), activeCoupon ? { type: 'fixed', value: activeCoupon.discount } : undefined);

  function updateCoupon(coupon: AppliedCoupon | null) {
    setApplied(coupon);
    setCouponCode(coupon?.code ?? '');
  }

  async function loadRazorpay() {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(Boolean(window.Razorpay));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) { setNotice('Your cart is empty.'); return; }
    setBusy(true);
    setNotice('');
    const form = new FormData(event.currentTarget);
    const payload = {
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, personalization: item.personalization, hamper: item.hamper, name: item.name, price: item.price, mrp: item.mrp })),
      address: { name: form.get('name'), mobile: form.get('mobile'), line1: form.get('line1'), city: form.get('city'), state: form.get('state'), postalCode: form.get('postalCode') },
      paymentMethod: method,
      couponCode: activeCoupon?.code,
      deliveryDate: form.get('deliveryDate') || undefined,
    };
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json() as { error?: string; orderNumber?: string; orderId?: string; razorpayOrderId?: string; amount?: number; currency?: string; keyId?: string };
      if (!response.ok || !data.orderNumber || !data.orderId) { setBusy(false); setNotice(data.error ?? 'Checkout could not be started.'); return; }
      if (method === 'cod') { clear(); setConfirmed({ orderNumber: data.orderNumber, orderId: data.orderId }); setBusy(false); return; }
      if (!data.razorpayOrderId || !data.amount || !data.keyId || !await loadRazorpay() || !window.Razorpay) { setBusy(false); setNotice('Secure payment window could not open. Your pending order is saved in My Orders.'); return; }
      const checkout = new window.Razorpay({
        key: data.keyId, amount: data.amount, currency: data.currency ?? 'INR', name: 'GiftsByRashii', description: `Order ${data.orderNumber}`, order_id: data.razorpayOrderId,
        handler: async (result) => {
          setBusy(true);
          const verify = await fetch('/api/payments/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(result) });
          const verified = await verify.json() as { error?: string };
          setBusy(false);
          if (!verify.ok) { setNotice(verified.error ?? 'Payment verification needs support review.'); return; }
          clear();
          setConfirmed({ orderNumber: data.orderNumber!, orderId: data.orderId! });
        },
        modal: { ondismiss: () => { setBusy(false); setNotice('Payment was not completed. Your pending order is available in My Orders.'); } },
        theme: { color: '#7b1838' },
      });
      checkout.open();
    } catch {
      setBusy(false);
      setNotice('Checkout could not reach the server. Please try again.');
    }
  }

  return <main className="checkout-page shell"><Link href="/cart" className="back-link">← Back to bag</Link><div className="checkout-heading"><div><span className="eyebrow">ALMOST THERE</span><h1>Send a little joy</h1></div><span><LockKeyhole />Secure checkout</span></div><form className="checkout-layout" onSubmit={submit}><section className="checkout-form"><div className="checkout-card"><span className="step-number">1</span><div><h2>Contact</h2><div className="form-grid"><label className="field"><span>Email</span><input name="email" type="email" required placeholder="you@example.com" /></label><label className="field"><span>Mobile</span><input name="mobile" required pattern="[0-9+ -]{10,15}" inputMode="tel" /></label></div></div></div><div className="checkout-card"><span className="step-number">2</span><div><h2>Delivery address</h2><div className="form-grid"><label className="field"><span>Full name</span><input name="name" required /></label><label className="field"><span>Address</span><input name="line1" required /></label><label className="field"><span>City</span><input name="city" required /></label><label className="field"><span>State</span><input name="state" required /></label><label className="field"><span>PIN code</span><input name="postalCode" required pattern="[0-9]{6}" inputMode="numeric" /></label><label className="field"><span>Preferred date</span><input name="deliveryDate" type="date" /></label></div></div></div><div className="checkout-card"><span className="step-number">3</span><div><h2>Payment</h2><label className={`payment-option ${method === 'razorpay' ? 'selected' : ''}`}><input name="paymentMethod" type="radio" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} /><span><b>UPI, Cards, Netbanking</b><small>Securely processed by Razorpay</small></span></label><label className={`payment-option ${method === 'cod' ? 'selected' : ''}`}><input name="paymentMethod" type="radio" checked={method === 'cod'} onChange={() => setMethod('cod')} /><span><b>Cash on delivery</b><small>Availability verified for your PIN code</small></span></label></div></div>{notice && <p className="form-notice" role="status">{notice}</p>}</section><aside className="order-summary checkout-summary"><h2>Your gifts</h2>{items.map((item) => <div className="checkout-item" key={item.id}><span className="mini-art" style={{ background: item.color }}><Gift /></span><span>{item.name}<small>Qty {item.quantity}</small></span><b>₹{(item.price * item.quantity).toLocaleString('en-IN')}</b></div>)}<div><span>Subtotal</span><b>₹{totals.subtotal.toLocaleString('en-IN')}</b></div>{activeCoupon && <div><span>Coupon ({activeCoupon.code})</span><b className="saving">−₹{totals.couponDiscount.toLocaleString('en-IN')}</b></div>}<div><span>Shipping</span><b>{totals.shipping ? `₹${totals.shipping}` : 'Free'}</b></div><CouponBox key={`${couponCode || 'checkout-coupon'}-${method}`} items={couponItems} paymentMethod={method} initialCode={couponCode} applied={applied} onApplied={updateCoupon} /><div className="total"><span>Total</span><b>₹{totals.total.toLocaleString('en-IN')}</b></div><button className="button button-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <CheckCircle2 />}{busy ? 'Creating your order…' : 'Place order securely'}</button><p>Final coupon, stock and amount are verified again on the server.</p></aside></form>{confirmed && <OrderConfirmationModal orderNumber={confirmed.orderNumber} orderId={confirmed.orderId} onClose={() => setConfirmed(null)} />}</main>;
}
