import { demoProducts } from './demo-data';
import { createAdminClient } from './supabase/admin';
import { createClient } from './supabase/server';
import type { Product } from './types';

const productSelect = 'id,slug,name,short_description,description,sku,price,mrp,stock,rating_average,rating_count,is_personalized,is_featured,main_image_url,tags,whats_inside,specifications,personalization_config,created_at,category:categories(name,slug),product_media(url,sort_order),product_occasions(occasions(name,slug)),product_recipients(recipients(name,slug))';

export async function getProducts(query?: string): Promise<Product[]> {
  const supabase = createAdminClient() ?? await createClient();
  if (supabase) {
    let request = supabase.from('products').select(productSelect).eq('is_active', true).order('created_at', { ascending: false });
    if (query) request = request.or(`name.ilike.%${query}%,short_description.ilike.%${query}%,description.ilike.%${query}%`);
    const { data, error } = await request.limit(120);
    if (!error && data) return data.map((row) => mapProduct(row as unknown as Record<string, unknown>));
  }
  return demoProducts.filter((product) => !query || `${product.name} ${product.description} ${product.category} ${product.recipients.join(' ')} ${product.occasions.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
}

export async function getProduct(slug: string) {
  const supabase = createAdminClient() ?? await createClient();
  if (supabase) {
    const { data, error } = await supabase.from('products').select(productSelect).eq('is_active', true).eq('slug', slug).maybeSingle();
    if (!error && data) return mapProduct(data as unknown as Record<string, unknown>);
  }
  return demoProducts.find((product) => product.slug === slug) ?? null;
}

function relatedNames(value: unknown, key: 'occasions' | 'recipients') {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const nested = (row as Record<string, unknown>)[key];
    const values = Array.isArray(nested) ? nested : [nested];
    return values.flatMap((item) => item && typeof item === 'object' && 'name' in item ? [String((item as { name: unknown }).name)] : []);
  });
}

function mapProduct(row: Record<string, unknown>): Product {
  const media = ((row.product_media as { url: string; sort_order?: number }[] | null) ?? []).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
  const category = row.category as { name?: string } | null;
  const tags = Array.isArray(row.tags) ? row.tags.map(String) : [];
  const mainImage = typeof row.main_image_url === 'string' ? row.main_image_url : '';
  const images = [mainImage, ...media.map((item) => item.url)].filter((url, index, all) => Boolean(url) && all.indexOf(url) === index);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    shortDescription: String(row.short_description ?? ''),
    description: String(row.description ?? ''),
    sku: String(row.sku),
    price: Number(row.price),
    mrp: Number(row.mrp),
    stock: Number(row.stock ?? 0),
    rating: Number(row.rating_average ?? 0),
    reviewCount: Number(row.rating_count ?? 0),
    category: category?.name ?? 'Gifts',
    recipients: relatedNames(row.product_recipients, 'recipients'),
    occasions: relatedNames(row.product_occasions, 'occasions'),
    badges: [...(Boolean(row.is_featured) ? ['Featured'] : []), ...tags.slice(0, 2)],
    personalized: Boolean(row.is_personalized),
    color: '#efd4d6',
    images: images.length ? images : ['/giftmitra-hero.png'],
    whatsInside: Array.isArray(row.whats_inside) ? row.whats_inside.map(String) : [],
    createdAt: typeof row.created_at === 'string' ? row.created_at : undefined,
    specifications: row.specifications && typeof row.specifications === 'object' ? row.specifications as Record<string, unknown> : {},
    personalizationConfig: row.personalization_config && typeof row.personalization_config === 'object' ? row.personalization_config as Record<string, unknown> : {},
  };
}
