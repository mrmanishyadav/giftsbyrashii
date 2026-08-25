import { notFound } from 'next/navigation';
import { StorefrontFrame } from '@/components/site-shell';
import { createClient } from '@/lib/supabase/server';

const fallback: Record<string, { title: string; body: string[] }> = {
  'shipping-policy': { title: 'Shipping Policy', body: ['Delivery estimates depend on destination PIN code, stock and personalisation lead time.', 'Final shipping charges and available delivery dates are shown during checkout.'] },
  returns: { title: 'Returns & Refunds', body: ['If a gift arrives damaged or incorrect, contact our care team with photos within 48 hours.', 'Personalised items cannot be returned for change of mind. Approved refunds are processed to the original payment method.'] },
  faqs: { title: 'Frequently Asked Questions', body: ['Every order is priced and stock-checked securely on the server.', 'For order help, use the contact page and include your GiftMitra order number.'] },
  'privacy-policy': { title: 'Privacy Policy', body: ['GiftMitra stores only the information needed to fulfil orders, provide support and secure accounts.', 'Payment card details are handled by the payment gateway and are not stored by GiftMitra.'] },
  terms: { title: 'Terms & Conditions', body: ['By placing an order, you confirm that delivery and personalisation details are accurate.', 'Orders are accepted subject to payment verification, inventory and delivery serviceability.'] },
};

function contentLines(value: unknown): string[] {
  if (typeof value === 'string') return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.flatMap(contentLines);
  if (value && typeof value === 'object') return Object.values(value).flatMap(contentLines);
  return value === null || value === undefined ? [] : [String(value)];
}

function Policy({ title, body, dated = false }: { title: string; body: string[]; dated?: boolean }) {
  return (
    <StorefrontFrame>
      <main className="policy-page shell">
        <span className="eyebrow">GIFTMITRA POLICIES</span>
        <h1>{title}</h1>
        <div className="policy-content">{body.map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)}</div>
        {dated && <small>Last updated: 25 August 2026</small>}
      </main>
    </StorefrontFrame>
  );
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.from('pages').select('title,content').eq('slug', slug).eq('is_published', true).maybeSingle();
    if (data) return <Policy title={data.title} body={contentLines(data.content)} />;
  }
  const page = fallback[slug];
  if (!page) notFound();
  return <Policy title={page.title} body={page.body} dated />;
}
