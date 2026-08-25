import { Check, PackageCheck, Truck } from 'lucide-react';

const steps = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const labels: Record<string, string> = { confirmed: 'Confirmed', processing: 'Preparing', personalized: 'Personalising', packed: 'Packed', shipped: 'Shipped', out_for_delivery: 'Out for delivery', delivered: 'Delivered', payment_pending: 'Payment pending', paid: 'Paid' };

export function OrderProgress({ status }: { status: string }) {
  const normalized = status === 'personalized' ? 'processing' : status === 'paid' ? 'confirmed' : status;
  const current = steps.indexOf(normalized);
  const cancelled = ['cancelled', 'returned', 'refunded', 'return_requested', 'refund_pending'].includes(status);
  if (cancelled) return <div className="order-progress cancelled"><b>{status.replaceAll('_', ' ')}</b><span>This order is outside the delivery flow. See the timeline below for details.</span></div>;
  return <div className="order-progress" aria-label={`Order status: ${labels[status] ?? status}`}>
    <div className="order-progress-line"><i style={{ width: `${Math.min(100, current / (steps.length - 1) * 100)}%` }} /></div>
    {steps.map((step, index) => <span className={index <= current ? 'complete' : ''} key={step}><b>{index < current ? <Check /> : index === 3 ? <Truck /> : <PackageCheck />}</b><small>{labels[step]}</small></span>)}
  </div>;
}
