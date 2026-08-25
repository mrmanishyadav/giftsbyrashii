'use client';

import { BadgeCheck, LoaderCircle, Tag, X } from 'lucide-react';
import { useState } from 'react';

export type AppliedCoupon = {
  couponId: string;
  code: string;
  discount: number;
  description?: string | null;
  fingerprint: string;
};

export function CouponBox({
  items,
  paymentMethod,
  initialCode = '',
  applied,
  onApplied,
}: {
  items: { productId: string; quantity: number }[];
  paymentMethod?: 'razorpay' | 'cod';
  initialCode?: string;
  applied: AppliedCoupon | null;
  onApplied: (coupon: AppliedCoupon | null) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const fingerprint = JSON.stringify([items, paymentMethod]);
  const active = applied?.fingerprint === fingerprint ? applied : null;

  async function apply() {
    if (!code.trim()) {
      setNotice('Enter a coupon code.');
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), items, paymentMethod }),
      });
      const data = await response.json() as { couponId?: string; code?: string; discount?: number; description?: string | null; error?: string };
      if (!response.ok || !data.couponId || !data.code || !data.discount) {
        onApplied(null);
        setNotice(data.error ?? 'Coupon could not be applied.');
        return;
      }
      setCode(data.code);
      onApplied({ couponId: data.couponId, code: data.code, discount: data.discount, description: data.description, fingerprint });
      setNotice('Coupon applied successfully.');
    } catch {
      setNotice('Coupon service could not be reached. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (active) {
    const meaningfulDescription = active.description?.trim().toLowerCase() !== active.code.toLowerCase() ? active.description : null;
    return <div className="coupon-applied" role="status"><BadgeCheck /><span><b>{active.code}</b><small>{meaningfulDescription || `You saved ₹${active.discount.toLocaleString('en-IN')}`}</small></span><button type="button" onClick={() => { onApplied(null); setNotice(''); }} aria-label="Remove coupon"><X /></button></div>;
  }

  return <div className="coupon-box"><label htmlFor={`coupon-${paymentMethod ?? 'cart'}`}><Tag /> Coupon code</label><div><input id={`coupon-${paymentMethod ?? 'cart'}`} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter code" autoCapitalize="characters" /><button type="button" onClick={apply} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : 'Apply'}</button></div>{notice && <small className="coupon-notice" role="status">{notice}</small>}</div>;
}
