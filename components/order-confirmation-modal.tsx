'use client';

import Link from 'next/link';
import { Check, Gift, PackageSearch, ShoppingBag, Sparkles, X } from 'lucide-react';

export function OrderConfirmationModal({ orderNumber, orderId, onClose }: { orderNumber: string; orderId: string; onClose: () => void }) {
  return <div className="order-confirmation-backdrop" role="dialog" aria-modal="true" aria-labelledby="order-confirmation-title">
    <section className="order-confirmation-modal">
      <button className="modal-close" onClick={onClose} aria-label="Close confirmation"><X /></button>
      <div className="celebration-mark"><span><Gift /></span><i><Sparkles /></i><b><Check /></b></div>
      <span className="eyebrow">ORDER CONFIRMED</span>
      <h2 id="order-confirmation-title">Your gift is officially on its way to becoming a happy memory.</h2>
      <p>We’ve received <strong>{orderNumber}</strong>. You can follow every packing and delivery update from your account.</p>
      <div className="confirmation-steps"><span className="done"><i><Check /></i><b>Confirmed</b></span><em></em><span><i>2</i><b>Beautifully packed</b></span><em></em><span><i>3</i><b>Delivered</b></span></div>
      <div className="confirmation-actions"><Link href={`/account/orders/${orderId}`} className="button button-primary"><PackageSearch />Track this order</Link><Link href="/shop" className="button button-soft"><ShoppingBag />Continue shopping</Link></div>
    </section>
  </div>;
}
