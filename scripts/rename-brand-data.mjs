import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase URL and service-role key are required.');

const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const replacements = [
  ['homepage_sections', 'id', ['title', 'subtitle', 'description', 'configuration']],
  ['pages', 'id', ['title', 'content', 'seo_title', 'seo_description']],
  ['products', 'id', ['short_description', 'description', 'rich_content', 'seo_title', 'seo_description']],
  ['product_media', 'id', ['alt_text']],
  ['collections', 'id', ['description']],
  ['faqs', 'id', ['question', 'answer']],
  ['banners', 'id', ['title', 'subtitle']],
  ['announcement_bars', 'id', ['text']],
];

function rename(value) {
  if (typeof value === 'string') return value.replaceAll('GiftMitra', 'GiftsByRashii');
  if (value && typeof value === 'object') return JSON.parse(JSON.stringify(value).replaceAll('GiftMitra', 'GiftsByRashii'));
  return value;
}

let updated = 0;
for (const [table, idColumn, columns] of replacements) {
  const { data, error } = await client.from(table).select([idColumn, ...columns].join(','));
  if (error) throw new Error(`${table}: ${error.message}`);
  for (const row of data ?? []) {
    const changes = Object.fromEntries(columns.map((column) => [column, rename(row[column])]).filter(([column, value]) => JSON.stringify(value) !== JSON.stringify(row[column])));
    if (!Object.keys(changes).length) continue;
    const result = await client.from(table).update(changes).eq(idColumn, row[idColumn]);
    if (result.error) throw new Error(`${table}/${row[idColumn]}: ${result.error.message}`);
    updated += 1;
  }
}

const { data: store, error: storeError } = await client.from('site_settings').select('value').eq('key', 'store').maybeSingle();
if (storeError) throw new Error(`site_settings/store: ${storeError.message}`);
if (store) {
  const result = await client.from('site_settings').update({ value: { ...store.value, name: 'GiftsByRashii' } }).eq('key', 'store');
  if (result.error) throw new Error(`site_settings/store: ${result.error.message}`);
  updated += 1;
}

console.log(`Brand data updated successfully (${updated} rows).`);
