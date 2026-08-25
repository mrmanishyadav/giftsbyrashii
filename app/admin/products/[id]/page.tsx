import { notFound } from 'next/navigation';
import { AdminProductForm } from '@/components/admin-product-form';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const client = createAdminClient();
  if (!client) return null;
  const [product, categories, media, occasions, recipients, collections, occasionLinks, recipientLinks, collectionLinks, hamper] = await Promise.all([
    client.from('products').select('*').eq('id', id).maybeSingle(),
    client.from('categories').select('id,name').eq('is_active', true).order('sort_order'),
    client.from('product_media').select('url').eq('product_id', id).order('sort_order'),
    client.from('occasions').select('id,name').eq('is_active', true).order('sort_order'),
    client.from('recipients').select('id,name').eq('is_active', true).order('sort_order'),
    client.from('collections').select('id,name').eq('is_active', true).order('name'),
    client.from('product_occasions').select('occasion_id').eq('product_id', id),
    client.from('product_recipients').select('recipient_id').eq('product_id', id),
    client.from('collection_products').select('collection_id').eq('product_id', id),
    client.from('hamper_products').select('product_id').eq('product_id', id).eq('is_active', true).maybeSingle(),
  ]);
  if (!product.data) notFound();
  return (
    <div className="admin-page">
      <div className="admin-title"><div><span>{product.data.sku}</span><h1>Edit {product.data.name}</h1><p>Every field below is connected to the live catalog.</p></div></div>
      <AdminProductForm
        initial={product.data}
        categories={categories.data ?? []}
        gallery={(media.data ?? []).map((item) => item.url)}
        occasions={occasions.data ?? []}
        recipients={recipients.data ?? []}
        collections={collections.data ?? []}
        selectedOccasions={(occasionLinks.data ?? []).map((item) => item.occasion_id)}
        selectedRecipients={(recipientLinks.data ?? []).map((item) => item.recipient_id)}
        selectedCollections={(collectionLinks.data ?? []).map((item) => item.collection_id)}
        hamperEligible={Boolean(hamper.data)}
      />
    </div>
  );
}
