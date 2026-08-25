import Image from 'next/image';
import { Building2, Gift, PackageCheck, Palette, Truck, UsersRound } from 'lucide-react';
import { AdaptiveImage } from '@/components/adaptive-image';
import { EnquiryForm } from '@/components/enquiry-form';
import { StorefrontFrame } from '@/components/site-shell';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Corporate gifting', description: 'Premium, personalised corporate gifting at scale with reliable pan-India fulfilment.' };

export default async function Page() {
  const supabase = await createClient();
  const [logoResult, galleryResult, faqResult] = supabase ? await Promise.all([
    supabase.from('client_logos').select('id,name,logo_url,url').eq('is_enabled', true).order('sort_order'),
    supabase.from('corporate_gallery').select('id,title,company,campaign,description,image_url').eq('is_enabled', true).order('sort_order'),
    supabase.from('faqs').select('id,question,answer').eq('is_enabled', true).eq('scope', 'global').order('sort_order').limit(8),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  const logos = logoResult.data ?? [];
  const gallery = galleryResult.data ?? [];
  const faqs = faqResult.data ?? [];
  const defaultCampaigns = ['Festive welcome kits', 'Leadership milestone boxes', 'New-joiner joy', 'Client appreciation edit'];

  return (
    <StorefrontFrame>
      <main className="corporate">
        <section className="corporate-hero shell"><Image src="/giftmitra-hero.png" fill alt="Premium corporate gift hamper" sizes="100vw" /><div><span className="eyebrow">CORPORATE GIFTING, MADE HUMAN</span><h1>Big teams.<br /><em>Personal moments.</em></h1><p>Beautifully branded gifts, thoughtfully curated and reliably delivered across India.</p><a href="#enquire" className="button button-primary">Plan your gifting →</a></div></section>
        <section className="corporate-trust shell"><span>Trusted for employee joy, festive gifting and client milestones</span><div>{logos.length ? logos.map((logo) => <a href={logo.url ?? '#'} key={logo.id} className="client-logo">{logo.logo_url && <span><AdaptiveImage src={logo.logo_url} alt={logo.name} fill sizes="120px" /></span>}<b>{logo.name}</b></a>) : ['NORTHSTAR', 'AURORA', 'KINSHIP', 'STUDIO NINE', 'BLUELEAF'].map((name) => <b key={name}>{name}</b>)}</div></section>
        <section className="section shell"><div className="section-heading centered"><span className="eyebrow">END-TO-END GIFTING</span><h2>From idea to every doorstep</h2></div><div className="service-grid">{[[Palette, 'Custom branding', 'Sleeves, cards and keepsakes aligned to your brand.'], [Gift, 'Thoughtful curation', 'Options for every budget, culture and occasion.'], [PackageCheck, 'Quality controlled', 'Every hamper inspected before dispatch.'], [Truck, 'Pan-India delivery', 'Consolidated tracking and address management.'], [UsersRound, 'Dedicated support', 'One gifting specialist from brief to completion.'], [Building2, 'Built for scale', 'From 25 gifts to 25,000 with consistent care.']].map(([Icon, title, text]) => <article key={String(title)}><Icon /><h3>{String(title)}</h3><p>{String(text)}</p></article>)}</div></section>
        <section className="corporate-gallery"><div className="shell"><div className="section-heading"><span className="eyebrow">RECENTLY CURATED</span><h2>Work that sparked joy</h2></div><div>{gallery.length ? gallery.map((item) => <article className="managed-campaign" key={item.id}><AdaptiveImage src={item.image_url} alt={item.title} fill sizes="320px" /><span>{item.company || item.campaign || 'GiftMitra campaign'}</span><b>{item.title}</b></article>) : defaultCampaigns.map((title, index) => <article key={title} style={{ background: ['#ead2d5', '#dfd9ce', '#dce6e4', '#e3d8e8'][index] }}><Gift /><span>Campaign {index + 1}</span><b>{title}</b></article>)}</div></div></section>
        <section id="enquire" className="corporate-enquiry shell"><div><span className="eyebrow">LET’S CREATE SOMETHING MEMORABLE</span><h2>Tell us about your gifting brief</h2><p>Share your scale, budget and timeline. Our corporate team will respond with a tailored plan.</p><ul><li>Transparent bulk pricing</li><li>Original concepts, no catalogue clones</li><li>Optional custom inserts and packaging</li></ul></div><EnquiryForm type="corporate" /></section>
        <section className="faq-section shell"><h2>Corporate gifting FAQs</h2>{faqs.length ? faqs.map((faq) => <details key={faq.id}><summary>{faq.question}</summary><p>{faq.answer}</p></details>) : ['What is the minimum order quantity?', 'Can each hamper be personalised?', 'Do you deliver to multiple addresses?', 'Can you work within our brand guidelines?'].map((question) => <details key={question}><summary>{question}</summary><p>Yes. Final options, timelines and pricing are tailored to your brief and confirmed before production.</p></details>)}</section>
      </main>
    </StorefrontFrame>
  );
}
