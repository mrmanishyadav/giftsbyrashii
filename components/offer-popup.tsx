'use client';

import Link from 'next/link';
import { BadgePercent, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Offer = { id: string; code: string; description: string | null; discount_type: 'percentage' | 'fixed'; value: number; minimum_amount: number };

export function OfferPopup({ offer }: { offer: Offer | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!offer) return;
    const key = `giftmitra_offer_seen_${offer.id}`;
    if (localStorage.getItem(key)) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(key, '1');
      setVisible(true);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [offer]);

  if (!offer || !visible) return null;
  const description = offer.description?.trim().toLowerCase() !== offer.code.toLowerCase() ? offer.description : null;
  const offerText = description || (offer.discount_type === 'percentage' ? `${offer.value}% off` : `₹${offer.value} off`);

  return <div className="offer-popup-backdrop" role="dialog" aria-modal="true" aria-label="Current GiftsByRashii offer" onMouseDown={() => setVisible(false)}><aside className="offer-popup" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="offer-popup-close" onClick={() => setVisible(false)} aria-label="Close offer"><X /></button><span className="offer-popup-icon"><BadgePercent /></span><small>SPECIAL OFFER</small><h2>A little extra joy for you</h2><p><b>{offerText}</b>{offer.minimum_amount > 0 ? ` on orders above ₹${offer.minimum_amount.toLocaleString('en-IN')}.` : '.'}</p><div><span>Use code</span><code>{offer.code}</code></div><Link href="/shop" className="button button-primary" onClick={() => setVisible(false)}>Explore gifts</Link></aside></div>;
}
