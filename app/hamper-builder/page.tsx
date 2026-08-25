import { HamperBuilder } from '@/components/hamper-builder';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = { title: 'Build your own hamper', description: 'Create a one-of-a-kind GiftMitra hamper in eight thoughtful steps.' };

export default async function Page() {
  const supabase = createAdminClient();
  let packaging: { id: string; name: string; price: number }[] = [];
  let goodies: { id: string; name: string; category: string; price: number }[] = [];
  if (supabase) {
    const [{ data: packagingRows }, { data: goodieRows }] = await Promise.all([
      supabase.from('hamper_packaging').select('id,name,price').eq('is_active', true).gt('stock', 0).order('sort_order'),
      supabase.from('hamper_products').select('product:products(id,name,price,category:categories(name))').eq('is_active', true).order('sort_order'),
    ]);
    packaging = (packagingRows ?? []).map((row) => ({ id: row.id, name: row.name, price: Number(row.price) }));
    goodies = (goodieRows ?? []).flatMap((row) => {
      const productValue = row.product as unknown;
      const product = (Array.isArray(productValue) ? productValue[0] : productValue) as { id?: string; name?: string; price?: number; category?: { name?: string } | { name?: string }[] } | null;
      if (!product?.id || !product.name) return [];
      const categoryValue = Array.isArray(product.category) ? product.category[0] : product.category;
      return [{ id: product.id, name: product.name, price: Number(product.price ?? 0), category: categoryValue?.name ?? 'Gift' }];
    });
  }
  return <HamperBuilder packaging={packaging.length ? packaging : undefined} goodies={goodies.length ? goodies : undefined} />;
}
