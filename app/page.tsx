import { HomepageSections } from '@/components/homepage-sections';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import { getProducts } from '@/lib/catalog';
import { demoHomepageSections } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/server';
import type { HomepageSection } from '@/lib/types';

const defaultSections: HomepageSection[] = [
  ...demoHomepageSections,
  { id: 'occasions', type: 'occasion_collection', title: 'Gifts for every beautiful reason', enabled: true, sortOrder: 4, config: {} },
  { id: 'prices', type: 'price_collection', title: 'Find their joy, your way', enabled: true, sortOrder: 5, config: {} },
  { id: 'hamper', type: 'custom_hamper', title: 'A hamper as unique as they are.', enabled: true, sortOrder: 6, config: {} },
  { id: 'corporate', type: 'corporate_gifting', title: 'Make work feel a little more wonderful.', enabled: true, sortOrder: 7, config: {} },
  { id: 'testimonials', type: 'testimonials', title: 'Notes that made us smile', enabled: true, sortOrder: 8, config: {} },
  { id: 'usp', type: 'usp', title: 'Why GiftMitra', enabled: true, sortOrder: 9, config: {} },
  { id: 'newsletter', type: 'newsletter', title: 'Be the first to know what’s worth gifting.', enabled: true, sortOrder: 10, config: {} },
];

export default async function Home() {
  const [products, supabase] = await Promise.all([getProducts(), createClient()]);
  let sections = defaultSections;
  let banners = [
    { id: 'default-1', title: 'Gifts as lovely as she is', subtitle: 'Colorful little joys, curated with a whole lot of heart.', desktopImage: '/giftmitra-hero.png', url: '/category/gifts-for-her' },
    { id: 'default-2', title: 'Build her dream hamper', subtitle: 'Choose the box, treats, keepsakes and your personal note.', desktopImage: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=1800&q=88', url: '/hamper-builder' },
  ];
  let testimonials = [
    { id: 'default-aanya', name: 'Aanya, Bengaluru', quote: 'The hamper looked even more beautiful in person. Every detail felt warm, polished and truly personal.', rating: 5 },
    { id: 'default-team', name: 'People team, Mumbai', quote: 'From 300 addresses to custom sleeves, the team made our festive gifting remarkably smooth.', rating: 5 },
  ];
  let reels: { id: string; title: string; caption: string; videoUrl: string; thumbnailUrl?: string }[] = [];
  if (supabase) {
    const [{ data: sectionRows }, { data: bannerRows }, { data: testimonialRows }, { data: reelRows }] = await Promise.all([
      supabase.from('homepage_sections').select('*').eq('is_enabled', true).order('sort_order'),
      supabase.from('banners').select('*').eq('is_enabled', true).order('sort_order'),
      supabase.from('testimonials').select('id,name,quote,rating').eq('is_enabled', true).order('sort_order').limit(8),
      supabase.from('reels').select('id,title,caption,video_url,thumbnail_url').eq('is_enabled', true).order('sort_order').limit(8),
    ]);
    if (sectionRows?.length) sections = sectionRows.map((row): HomepageSection => ({ id: row.id, type: row.section_type, title: row.title ?? '', subtitle: row.subtitle ?? undefined, enabled: row.is_enabled, sortOrder: row.sort_order, config: (row.configuration ?? {}) as Record<string, unknown> }));
    if (bannerRows?.length) banners = bannerRows.map((row) => ({ id: row.id, title: row.title ?? 'A beautiful surprise', subtitle: row.subtitle ?? undefined, desktopImage: row.desktop_image, mobileImage: row.mobile_image ?? undefined, url: row.url ?? '/shop' }));
    if (testimonialRows?.length) testimonials = testimonialRows.map((row) => ({ id: row.id, name: row.name, quote: row.quote, rating: row.rating ?? 5 }));
    if (reelRows?.length) reels = reelRows.map((row) => ({ id: row.id, title: row.title ?? 'GiftMitra moment', caption: row.caption ?? '', videoUrl: row.video_url, thumbnailUrl: row.thumbnail_url ?? undefined }));
  }
  return <main><SiteHeader /><HomepageSections sections={sections} products={products} banners={banners} testimonials={testimonials} reels={reels} /><SiteFooter /></main>;
}
