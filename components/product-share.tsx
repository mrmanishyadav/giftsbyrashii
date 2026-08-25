'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

export function ProductShare({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const data = { title: `${name} | GiftsByRashii`, text: `I found this lovely gift on GiftsByRashii: ${name}`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch {}
    }
  }
  return <button className="icon-button share-product" onClick={share} aria-label={copied ? 'Product link copied' : 'Share product'}>{copied ? <Check /> : <Share2 />}</button>;
}
