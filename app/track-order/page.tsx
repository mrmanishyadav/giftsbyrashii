import { TrackOrderForm } from '@/components/track-order-form';
import { StorefrontFrame } from '@/components/site-shell';

export const metadata = { title: 'Track your order', description: 'Track a GiftMitra order securely using your order number and checkout mobile.' };

export default function Page() { return <StorefrontFrame><main className="track-order-page shell"><TrackOrderForm /></main></StorefrontFrame>; }
