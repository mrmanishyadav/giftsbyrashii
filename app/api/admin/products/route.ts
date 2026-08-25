import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiErrorMessage } from '@/lib/api-error';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const boolean = z.union([z.boolean(), z.string()]).optional().transform((value) => value === true || value === 'true' || value === 'on');
const optionalText = z.string().trim().optional();
const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Enter a product name.'),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens only.'),
  sku: z.string().trim().min(2, 'Enter a SKU.'),
  barcode: optionalText,
  categoryId: z.string().uuid('Choose a valid category.').or(z.literal('')).optional(),
  occasionIds: z.array(z.string().uuid()).default([]),
  recipientIds: z.array(z.string().uuid()).default([]),
  collectionIds: z.array(z.string().uuid()).default([]),
  shortDescription: optionalText,
  description: z.string().default(''),
  price: z.coerce.number().min(0, 'Selling price cannot be negative.'),
  mrp: z.coerce.number().min(0, 'MRP cannot be negative.'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative.').default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative.'),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  ratingAverage: z.coerce.number().min(0).max(5).default(0),
  ratingCount: z.coerce.number().int().min(0).default(0),
  mainImageUrl: z.string().trim().url('Enter a complete main image URL starting with http:// or https://.'),
  galleryUrls: optionalText,
  imageAlt: optionalText,
  tags: optionalText,
  whatsInside: optionalText,
  careInstructions: optionalText,
  dispatchTime: optionalText,
  originCountry: optionalText,
  material: optionalText,
  personalizationName: boolean,
  personalizationMessage: boolean,
  personalizationPhoto: boolean,
  personalizationInstructions: optionalText,
  maxMessageLength: z.coerce.number().int().min(1).max(2000).default(250),
  seoTitle: optionalText,
  seoDescription: optionalText,
  publicationStatus: z.enum(['draft', 'published', 'archived']).default('draft'),
  isPersonalized: boolean,
  isCodEnabled: boolean,
  isFeatured: boolean,
  isActive: boolean,
  hamperEligible: boolean,
}).refine((value) => value.mrp >= value.price, {
  message: 'MRP must be equal to or higher than the selling price.',
  path: ['mrp'],
});

const labels: Record<string, string> = {
  name: 'Product name', slug: 'Slug', sku: 'SKU', categoryId: 'Category', price: 'Selling price', mrp: 'MRP',
  stock: 'Stock', mainImageUrl: 'Main image URL', galleryUrls: 'Gallery URLs', ratingAverage: 'Rating',
};

function validationError(error: z.ZodError) {
  const issue = error.issues[0];
  const field = String(issue?.path[0] ?? 'product');
  return NextResponse.json({ error: `${labels[field] ?? 'Product'}: ${issue?.message ?? 'Check this value.'}`, field }, { status: 400 });
}

function urlLines(main: string, gallery = '') {
  const urls = [main, ...gallery.split('\n').map((value) => value.trim()).filter(Boolean)]
    .filter((value, index, all) => all.indexOf(value) === index);
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      throw new Error(`Gallery URLs: “${url}” is not a complete http(s) image URL.`);
    }
  }
  return urls;
}

async function mutate(request: Request, update: boolean) {
  try {
    const { admin } = await requireAdmin();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const client = createAdminClient();
    if (!client) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });
    const data = parsed.data;
    if (update && !data.id) return NextResponse.json({ error: 'Product identifier is missing.' }, { status: 400 });

    const [slugMatch, skuMatch] = await Promise.all([
      client.from('products').select('id').eq('slug', data.slug).maybeSingle(),
      client.from('products').select('id').eq('sku', data.sku).maybeSingle(),
    ]);
    const conflictingId = slugMatch.data?.id ?? skuMatch.data?.id;
    if (conflictingId && conflictingId !== data.id) {
      const duplicate = slugMatch.data?.id ? 'slug' : 'SKU';
      return NextResponse.json({ error: `This ${duplicate} is already used by another product. Open that product or enter a unique ${duplicate}.`, field: duplicate === 'slug' ? 'slug' : 'sku', existingId: conflictingId }, { status: 409 });
    }

    const urls = urlLines(data.mainImageUrl, data.galleryUrls);
    const personalisationFields = [
      data.personalizationName ? 'name' : '',
      data.personalizationMessage ? 'message' : '',
      data.personalizationPhoto ? 'photo' : '',
    ].filter(Boolean);
    const active = data.publicationStatus === 'published' && data.isActive;
    const payload = {
      category_id: data.categoryId || null,
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      barcode: data.barcode || null,
      short_description: data.shortDescription || '',
      description: data.description,
      price: data.price,
      mrp: data.mrp,
      cost_price: data.costPrice,
      tax_rate: data.taxRate,
      stock: data.stock,
      low_stock_threshold: data.lowStockThreshold,
      rating_average: data.ratingAverage,
      rating_count: data.ratingCount,
      main_image_url: data.mainImageUrl,
      tags: (data.tags ?? '').split(',').map((value) => value.trim()).filter(Boolean),
      whats_inside: (data.whatsInside ?? '').split('\n').map((value) => value.trim()).filter(Boolean),
      specifications: { care: data.careInstructions ?? '', dispatch: data.dispatchTime ?? '', country: data.originCountry || 'India', material: data.material ?? '' },
      personalization_config: { enabled: data.isPersonalized, fields: personalisationFields, instructions: data.personalizationInstructions ?? '', maxMessageLength: data.maxMessageLength },
      seo_title: data.seoTitle || null,
      seo_description: data.seoDescription || null,
      publication_status: data.publicationStatus,
      is_personalized: data.isPersonalized,
      is_cod_enabled: data.isCodEnabled,
      is_featured: data.isFeatured,
      is_active: active,
    };

    const query = update
      ? client.from('products').update(payload).eq('id', data.id!)
      : client.from('products').insert(payload);
    const saved = await query.select().single();
    if (saved.error) throw saved.error;

    const oldMedia = update
      ? await client.from('product_media').select('url,media_type,alt_text,sort_order').eq('product_id', saved.data.id)
      : { data: [] as { url: string; media_type: string; alt_text: string | null; sort_order: number }[] };
    const removed = await client.from('product_media').delete().eq('product_id', saved.data.id);
    if (removed.error) throw removed.error;
    const media = urls.map((url, sort_order) => ({ product_id: saved.data.id, url, media_type: 'image', alt_text: data.imageAlt || data.name, sort_order }));
    const mediaResult = media.length ? await client.from('product_media').insert(media) : { error: null };
    if (mediaResult.error) {
      if (update && oldMedia.data?.length) await client.from('product_media').insert(oldMedia.data.map((item) => ({ ...item, product_id: saved.data.id })));
      if (!update) await client.from('products').delete().eq('id', saved.data.id);
      throw mediaResult.error;
    }

    const relationDeletes = await Promise.all([
      client.from('product_occasions').delete().eq('product_id', saved.data.id),
      client.from('product_recipients').delete().eq('product_id', saved.data.id),
      client.from('collection_products').delete().eq('product_id', saved.data.id),
    ]);
    const relationDeleteError = relationDeletes.find((result) => result.error)?.error;
    if (relationDeleteError) throw relationDeleteError;
    const relationWrites = await Promise.all([
      data.occasionIds.length ? client.from('product_occasions').insert(data.occasionIds.map((occasion_id) => ({ product_id: saved.data.id, occasion_id }))) : Promise.resolve({ error: null }),
      data.recipientIds.length ? client.from('product_recipients').insert(data.recipientIds.map((recipient_id) => ({ product_id: saved.data.id, recipient_id }))) : Promise.resolve({ error: null }),
      data.collectionIds.length ? client.from('collection_products').insert(data.collectionIds.map((collection_id, sort_order) => ({ product_id: saved.data.id, collection_id, sort_order }))) : Promise.resolve({ error: null }),
    ]);
    const relationWriteError = relationWrites.find((result) => result.error)?.error;
    if (relationWriteError) throw relationWriteError;
    const hamperResult = data.hamperEligible
      ? await client.from('hamper_products').upsert({ product_id: saved.data.id, is_active: true }, { onConflict: 'product_id' })
      : await client.from('hamper_products').delete().eq('product_id', saved.data.id);
    if (hamperResult.error) throw hamperResult.error;

    await client.from('audit_logs').insert({
      admin_user_id: admin.id,
      action: update ? 'product.update' : 'product.create',
      entity_type: 'product',
      entity_id: saved.data.id,
      metadata: { sku: saved.data.sku, price: saved.data.price, status: saved.data.publication_status, media: urls.length },
    });
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath(`/product/${saved.data.slug}`);
    return NextResponse.json({ product: saved.data });
  } catch (error) {
    return NextResponse.json({ error: apiErrorMessage(error, 'Could not save product.') }, { status: 400 });
  }
}

export function POST(request: Request) { return mutate(request, false); }
export function PUT(request: Request) { return mutate(request, true); }
