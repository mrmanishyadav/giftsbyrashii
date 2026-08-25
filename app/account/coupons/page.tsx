import { createAdminClient } from '@/lib/supabase/admin';
import { currentTimestamp } from '@/lib/time';

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  value: number;
  minimum_amount: number;
  maximum_discount: number | null;
  starts_at: string;
  ends_at: string | null;
  prepaid_only: boolean;
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const client = createAdminClient();
  const { data } = client
    ? await client.from('coupons').select('id,code,description,discount_type,value,minimum_amount,maximum_discount,starts_at,ends_at,prepaid_only').eq('is_active', true).order('created_at', { ascending: false })
    : { data: [] };
  const now = currentTimestamp();
  const coupons = ((data ?? []) as Coupon[]).filter((coupon) => new Date(coupon.starts_at).getTime() <= now && (!coupon.ends_at || new Date(coupon.ends_at).getTime() >= now));

  return <><div className="account-heading"><span className="eyebrow">OFFERS</span><h1>Your coupons</h1><p>Every code shown here is live and validated securely at checkout.</p></div>{coupons.length ? <div className="coupon-list">{coupons.map((coupon) => { const offer = coupon.description && coupon.description.trim().toLowerCase() !== coupon.code.toLowerCase() ? coupon.description : coupon.discount_type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value.toLocaleString('en-IN')} off`; return <article className="coupon-card" key={coupon.id}><b>{coupon.code}</b><span>{offer}{coupon.minimum_amount > 0 ? ` on orders above ₹${coupon.minimum_amount.toLocaleString('en-IN')}` : ''}</span><small>{coupon.prepaid_only ? 'Prepaid orders only' : 'Available for eligible checkout methods'}{coupon.maximum_discount ? ` · Maximum discount ₹${coupon.maximum_discount.toLocaleString('en-IN')}` : ''}</small></article>; })}</div> : <div className="mini-empty"><p>No active coupons right now. New offers will appear here automatically.</p></div>}</>;
}
