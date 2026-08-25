import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const environment = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, '')];
    }),
);
const client = createClient(environment.NEXT_PUBLIC_SUPABASE_URL, environment.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const [categoryResult, occasionResult, recipientResult, productResult] = await Promise.all([
  client.from('categories').select('id,slug'),
  client.from('occasions').select('id,slug'),
  client.from('recipients').select('id,slug'),
  client.from('products').select('id,category_id'),
]);
for (const result of [categoryResult, occasionResult, recipientResult, productResult]) if (result.error) throw result.error;

const categories = Object.fromEntries(categoryResult.data.map((row) => [row.id, row.slug]));
const occasions = Object.fromEntries(occasionResult.data.map((row) => [row.slug, row.id]));
const recipients = Object.fromEntries(recipientResult.data.map((row) => [row.slug, row.id]));
const occasionMap = {
  'birthday-gifts': ['birthday'], 'anniversary-gifts': ['anniversary'], 'wedding-gifts': ['wedding'], 'corporate-gifts': ['corporate'],
  'gifts-for-her': ['birthday'], 'gifts-for-him': ['birthday'], hampers: ['birthday'], 'make-your-own-hamper': ['birthday'], 'personalised-gifts': ['anniversary'],
};
const recipientMap = {
  'gifts-for-her': ['for-her', 'for-parents'], 'gifts-for-him': ['for-him', 'for-parents'], 'anniversary-gifts': ['for-couples'],
  'wedding-gifts': ['for-couples'], 'birthday-gifts': ['for-bestie', 'for-kids', 'for-parents'], 'corporate-gifts': ['for-him', 'for-her'],
  'personalised-gifts': ['for-her', 'for-him', 'for-couples'], hampers: ['for-her', 'for-him', 'for-bestie'],
  'make-your-own-hamper': ['for-her', 'for-him', 'for-bestie'],
};
const occasionRows = [];
const recipientRows = [];
const hamperRows = [];
let sortOrder = 0;
for (const product of productResult.data) {
  const category = categories[product.category_id];
  for (const slug of occasionMap[category] ?? []) if (occasions[slug]) occasionRows.push({ product_id: product.id, occasion_id: occasions[slug] });
  for (const slug of recipientMap[category] ?? []) if (recipients[slug]) recipientRows.push({ product_id: product.id, recipient_id: recipients[slug] });
  if (['hampers', 'personalised-gifts', 'gifts-for-her', 'gifts-for-him'].includes(category)) hamperRows.push({ product_id: product.id, is_active: true, sort_order: sortOrder++ });
}
const writes = [
  client.from('product_occasions').upsert(occasionRows, { onConflict: 'product_id,occasion_id' }),
  client.from('product_recipients').upsert(recipientRows, { onConflict: 'product_id,recipient_id' }),
  client.from('hamper_products').upsert(hamperRows, { onConflict: 'product_id' }),
  client.from('collections').upsert([
    { name: 'Most-Loved Gifts', slug: 'most-loved', description: 'GiftsByRashii favourites customers return to.', rules: { tags: ['bestseller'] }, is_active: true },
    { name: 'Personalised With Love', slug: 'personalised-with-love', description: 'Gifts that carry their name, photo or message.', rules: { tags: ['personalised'] }, is_active: true },
    { name: 'Little Joys Under 999', slug: 'under-999', description: 'Thoughtful gifting within a lovely budget.', rules: { maximumPrice: 999 }, is_active: true },
  ], { onConflict: 'slug' }),
];
const writeResults = await Promise.all(writes);
for (const result of writeResults) if (result.error) throw result.error;

const existing = await client.from('homepage_sections').select('section_type');
if (existing.error) throw existing.error;
const existingTypes = new Set(existing.data.map((row) => row.section_type));
const sections = [
  ['hero_slider', 'Gifts as lovely as she is'], ['recipient_collection', 'Made for their kind of wonderful'],
  ['product_grid', 'This week’s most-loved gifts'], ['occasion_collection', 'Gifts for every beautiful reason'],
  ['price_collection', 'Find their joy, your way'], ['custom_hamper', 'A hamper as unique as they are.'],
  ['corporate_gifting', 'Make work feel a little more wonderful.'], ['testimonials', 'Notes that made us smile'],
  ['usp', 'Why GiftsByRashii'], ['newsletter', 'Be the first to know what’s worth gifting.'],
].filter(([type]) => !existingTypes.has(type)).map(([section_type, title], sort_order) => ({ section_type, title, is_enabled: true, sort_order }));
if (sections.length) {
  const inserted = await client.from('homepage_sections').insert(sections);
  if (inserted.error) throw inserted.error;
}

for (const table of ['collections', 'homepage_sections', 'product_occasions', 'product_recipients', 'hamper_products']) {
  const result = await client.from(table).select('*', { count: 'exact', head: true });
  if (result.error) throw result.error;
  console.log(`${table}=${result.count}`);
}
