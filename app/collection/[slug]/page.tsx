import { notFound } from 'next/navigation';
import { CatalogPage } from '@/components/catalog-page';
import { getProducts } from '@/lib/catalog';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();
  if (!supabase) notFound();
  const { data } = await supabase.from('collections').select('id,name,description,rules,collection_products(product_id)').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (!data) notFound();
  const products = await getProducts();
  const manualIds = new Set((data.collection_products ?? []).map((item) => item.product_id));
  const rules = (data.rules ?? {}) as { tags?: string[]; minimumPrice?: number; maximumPrice?: number; featuredOnly?: boolean };
  const managed = products.filter((product) => manualIds.has(product.id) || (
    (!rules.tags?.length || rules.tags.some((tag) => product.badges.map((badge) => badge.toLowerCase()).includes(tag.toLowerCase()))) &&
    (rules.minimumPrice === undefined || product.price >= Number(rules.minimumPrice)) &&
    (rules.maximumPrice === undefined || product.price <= Number(rules.maximumPrice)) &&
    (!rules.featuredOnly || product.badges.includes('Featured'))
  ));
  return <CatalogPage title={data.name} description={data.description ?? 'A thoughtfully managed GiftMitra collection.'} initialProducts={managed} />;
}
