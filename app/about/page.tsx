import { StorefrontFrame } from '@/components/site-shell';
import { getPublishedPage } from '@/lib/cms-pages';

export const metadata = { title: 'About GiftsByRashii' };

export default async function Page() {
  const managed = await getPublishedPage('about-us');
  const title = managed?.title ?? 'Gifting should feel like knowing someone.';
  const body = managed?.body.length ? managed.body : ['GiftsByRashii was imagined as a warm, modern gifting companion: equal parts thoughtful curation, joyful design and dependable fulfilment.', 'We build original gifting experiences in India for the people and moments that matter—from quiet thank-yous to company-wide celebrations.'];
  return <StorefrontFrame><main className="policy-page shell"><span className="eyebrow">OUR STORY</span><h1>{title}</h1>{body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</main></StorefrontFrame>;
}
