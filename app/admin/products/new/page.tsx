import { AdminProductForm } from '@/components/admin-product-form';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function Page() {
  await requireAdmin();
  const client = createAdminClient();
  const [categories, occasions, recipients, collections] = client ? await Promise.all([
    client.from('categories').select('id,name').eq('is_active', true).order('sort_order'),
    client.from('occasions').select('id,name').eq('is_active', true).order('sort_order'),
    client.from('recipients').select('id,name').eq('is_active', true).order('sort_order'),
    client.from('collections').select('id,name').eq('is_active', true).order('name'),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
  return <div className="admin-page"><div className="admin-title"><div><span>CATALOG</span><h1>Add product</h1><p>Main image, gallery, discovery, content, stock, SEO and publication in one place.</p></div></div><AdminProductForm categories={categories.data ?? []} occasions={occasions.data ?? []} recipients={recipients.data ?? []} collections={collections.data ?? []} /></div>;
}
