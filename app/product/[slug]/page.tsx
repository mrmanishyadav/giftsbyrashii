import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Clock, MapPin, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { AddToCart } from '@/components/add-to-cart';
import { ProductCarousel } from '@/components/product-carousel';
import { ProductGallery } from '@/components/product-gallery';
import { StorefrontFrame } from '@/components/site-shell';
import { getProduct, getProducts } from '@/lib/catalog';
import { createClient } from '@/lib/supabase/server';

type Variant = { id: string; title: string; price: number | null; mrp: number | null; stock: number; options: Record<string, unknown> };
type Review = { id: string; title: string; body: string; rating: number; created_at: string };
type Faq = { id: string; question: string; answer: string; scope: string; scope_id: string | null };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Gift not found' };
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: { title: product.name, description: product.shortDescription, images: product.images },
    twitter: { card: 'summary_large_image', title: product.name, description: product.shortDescription, images: product.images },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const supabase = await createClient();
  const [allProducts, variantResult, faqResult, reviewResult, settingResult] = await Promise.all([
    getProducts(),
    supabase ? supabase.from('product_variants').select('id,title,price,mrp,stock,options').eq('product_id', product.id).eq('is_active', true) : Promise.resolve({ data: [] }),
    supabase ? supabase.from('faqs').select('id,question,answer,scope,scope_id').eq('is_enabled', true).in('scope', ['global', 'product']).order('sort_order') : Promise.resolve({ data: [] }),
    supabase ? supabase.from('reviews').select('id,title,body,rating,created_at').eq('product_id', product.id).eq('status', 'approved').order('created_at', { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
    supabase ? supabase.from('site_settings').select('value').eq('key', 'shipping').maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const related = allProducts.filter((item) => item.id !== product.id && (item.category === product.category || item.occasions.some((occasion) => product.occasions.includes(occasion)))).slice(0, 12);
  const variants = (variantResult.data ?? []) as Variant[];
  const faqs = ((faqResult.data ?? []) as Faq[]).filter((faq) => faq.scope === 'global' || faq.scope_id === product.id);
  const reviews = (reviewResult.data ?? []) as Review[];
  const shipping = ((settingResult.data?.value ?? {}) as Record<string, unknown>);
  const freeShippingAbove = Number(shipping.freeShippingAbove ?? 999);
  const specifications = Object.entries(product.specifications ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== '');
  const personalisation = product.personalizationConfig ?? {};

  return (
    <StorefrontFrame>
      <main className="product-page shell">
        <nav className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/shop">Gifts</Link> / {product.name}</nav>
        <div className="product-layout">
          <ProductGallery images={product.images} name={product.name} color={product.color} />
          <section className="product-purchase">
            <span className="eyebrow">{product.badges.join(' · ') || 'THOUGHTFULLY CURATED'}</span>
            <h1>{product.name}</h1>
            <p className="product-subtitle">{product.shortDescription}</p>
            <div className="product-rating"><span>★★★★★</span><b>{product.rating}</b><a href="#reviews">{reviews.length || product.reviewCount} reviews</a><small>SKU: {product.sku}</small></div>
            <div className="product-price"><b>₹{product.price.toLocaleString('en-IN')}</b><s>₹{product.mrp.toLocaleString('en-IN')}</s>{product.mrp > product.price && <span>{Math.round((1 - product.price / product.mrp) * 100)}% OFF</span>}</div>
            <small>Inclusive of all taxes</small>
            <div className="stock"><Check size={15} />{product.stock} in stock · ready to gift</div>
            {variants.length > 0 && <div className="managed-variants"><b>Available options</b><div>{variants.map((variant) => <span key={variant.id}>{variant.title} · ₹{Number(variant.price ?? product.price).toLocaleString('en-IN')} · {variant.stock} left</span>)}</div></div>}
            <div className="delivery-check"><MapPin /><div><b>Check delivery date</b><span>Enter a 6-digit pincode</span></div><input inputMode="numeric" maxLength={6} pattern="[0-9]{6}" placeholder="Pincode" /><button>Check</button></div>
            <AddToCart product={product} />
            <div className="purchase-usps">
              <span><Truck /><b>Free shipping</b> above ₹{freeShippingAbove}</span>
              <span><ShieldCheck /><b>Secure checkout</b> verified payments</span>
              <span><Clock /><b>On-time gifting</b> date selection</span>
              <span><RotateCcw /><b>Easy support</b> for damage issues</span>
            </div>
          </section>
        </div>
        <section className="product-details">
          <details open><summary>Description</summary><p>{product.description}</p></details>
          <details><summary>What’s inside</summary><ul>{product.whatsInside.map((item) => <li key={item}>{item}</li>)}</ul></details>
          {specifications.length > 0 && <details><summary>Specifications & care</summary><dl>{specifications.map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{String(value)}</dd></div>)}</dl></details>}
          {product.personalized && <details><summary>Personalisation instructions</summary><p>{String(personalisation.instructions || 'Enter names and messages exactly as you want them printed. Our team reviews every custom order before production.')}</p></details>}
          <details><summary>Delivery, care & returns</summary><p>Delivery estimates depend on pincode and personalisation lead time. Keep products away from direct heat and moisture.</p></details>
        </section>
        {faqs.length > 0 && <section className="managed-faqs"><span className="eyebrow">QUESTIONS, ANSWERED</span><h2>Before you send the joy</h2>{faqs.map((faq) => <details key={faq.id}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>}
        <section id="reviews" className="reviews-section">
          <div><span className="eyebrow">REAL GIFTING MOMENTS</span><h2>Loved by thoughtful gifters</h2><strong>{product.rating} <span>★★★★★</span></strong><p>Based on {reviews.length || product.reviewCount} approved reviews</p></div>
          <div className="managed-reviews">{reviews.length ? reviews.map((review) => <blockquote key={review.id}>“{review.body}”<cite>— {review.title} · {'★'.repeat(review.rating)}</cite></blockquote>) : <blockquote>“The packaging felt so premium and the handwritten note made it wonderfully personal.”<cite>— Verified GiftMitra customer</cite></blockquote>}</div>
        </section>
        <section className="related"><div className="section-heading split"><div><span className="eyebrow">YOU MAY ALSO LOVE</span><h2>More ways to make their day</h2></div><Link href="/shop" className="text-link">See all gifts →</Link></div><ProductCarousel products={(related.length ? related : allProducts.filter((item) => item.id !== product.id)).slice(0, 12)} label="Related gifts" /></section>
      </main>
    </StorefrontFrame>
  );
}
