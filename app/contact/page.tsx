import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { EnquiryForm } from '@/components/enquiry-form';
import { StorefrontFrame } from '@/components/site-shell';
import { getPublishedPage } from '@/lib/cms-pages';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Contact us' };

export default async function Page() {
  const [managed, client] = await Promise.all([getPublishedPage('contact-us'), createClient()]);
  const { data: storeRow } = client ? await client.from('site_settings').select('value').eq('key', 'store').maybeSingle() : { data: null };
  const store = (storeRow?.value ?? {}) as { supportEmail?: string; supportPhone?: string };
  const title = managed?.title ?? 'Let’s make gifting feel easy.';
  const intro = managed?.body[0] ?? 'Need help choosing, personalising or tracking a gift? Our care team would love to hear from you.';
  return <StorefrontFrame><main className="contact shell"><section><span className="eyebrow">WE’RE HERE TO HELP</span><h1>{title}</h1><p>{intro}</p><div className="contact-cards"><article><Mail /><b>Email</b><span>{store.supportEmail || 'Use the enquiry form'}</span></article><article><Phone /><b>Call</b><span>{store.supportPhone || 'Mon–Sat, 10am–7pm'}</span></article><article><MessageCircle /><b>Enquiries</b><span>Quick gifting support</span></article><article><MapPin /><b>Studio</b><span>India · By appointment</span></article></div></section><EnquiryForm type="contact" /></main></StorefrontFrame>;
}
