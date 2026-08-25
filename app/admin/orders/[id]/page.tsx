import { notFound } from 'next/navigation';
import { AdminOrderActions } from '@/components/admin-order-actions';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

type Details = Record<string, unknown>;

function label(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function detailText(details: Details | null | undefined) {
  return Object.entries(details ?? {})
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${label(key)}: ${String(value)}`)
    .join(' · ');
}

function Address({ value }: { value: Details | null }) {
  const address = value ?? {};
  const get = (...keys: string[]) => {
    const key = keys.find((candidate) => address[candidate]);
    return key ? String(address[key]) : '';
  };
  const location = [get('city'), get('state'), get('postalCode', 'postal_code')].filter(Boolean).join(', ');

  return (
    <address className="admin-order-address">
      {get('name') && <strong>{get('name')}</strong>}
      {get('line1', 'address_line_1') && <span>{get('line1', 'address_line_1')}</span>}
      {get('line2', 'address_line_2') && <span>{get('line2', 'address_line_2')}</span>}
      {get('landmark') && <span>Near {get('landmark')}</span>}
      {location && <span>{location}</span>}
      {get('mobile', 'phone') && <span>Phone: {get('mobile', 'phone')}</span>}
    </address>
  );
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const client = createAdminClient();
  if (!client) return null;
  const { data } = await client
    .from('orders')
    .select('*,order_items(*),payments(*),order_status_history(*)')
    .eq('id', id)
    .maybeSingle();
  if (!data) notFound();

  return (
    <div className="admin-page">
      <div className="admin-title">
        <div>
          <span>{data.order_number}</span>
          <h1>Order details</h1>
          <p>Payment {data.payment_status} · placed {new Date(data.created_at).toLocaleString('en-IN')}</p>
        </div>
        <span className="status-pill">{data.status}</span>
      </div>
      <div className="admin-grid order-admin">
        <section className="admin-card">
          <h2>Gift items</h2>
          {data.order_items.map((item: {
            id: string;
            product_snapshot: { name?: string };
            quantity: number;
            unit_price: number;
            personalization: Details;
          }) => {
            const personalisation = detailText(item.personalization);
            return (
              <article className="order-item-row" key={item.id}>
                <span>
                  <b>{item.product_snapshot.name ?? 'Gift item'}</b>
                  <small>Qty {item.quantity}{personalisation ? ` · ${personalisation}` : ''}</small>
                </span>
                <b>₹{Number(item.unit_price * item.quantity).toLocaleString('en-IN')}</b>
              </article>
            );
          })}
        </section>
        <aside className="admin-card">
          <h2>Order summary</h2>
          <p><span>Subtotal</span><b>₹{Number(data.subtotal).toLocaleString('en-IN')}</b></p>
          <p><span>Shipping</span><b>₹{Number(data.shipping).toLocaleString('en-IN')}</b></p>
          <p><span>COD fee</span><b>₹{Number(data.cod_surcharge).toLocaleString('en-IN')}</b></p>
          <p><span>Discount</span><b>−₹{Number(data.discount).toLocaleString('en-IN')}</b></p>
          <p className="total"><span>Total</span><b>₹{Number(data.total).toLocaleString('en-IN')}</b></p>
          <h2>Delivery address</h2>
          <Address value={data.address_snapshot as Details | null} />
        </aside>
      </div>
      <AdminOrderActions orderId={data.id} current={data.status} />
    </div>
  );
}
