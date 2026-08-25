-- Connect the seeded catalog to every managed storefront discovery surface.
alter table public.product_occasions enable row level security;
alter table public.product_recipients enable row level security;
alter table public.collection_products enable row level security;
alter table public.hamper_products enable row level security;
drop policy if exists "public product occasions" on public.product_occasions;
drop policy if exists "public product recipients" on public.product_recipients;
drop policy if exists "public collection products" on public.collection_products;
drop policy if exists "public hamper products" on public.hamper_products;
create policy "public product occasions" on public.product_occasions for select using(exists(select 1 from public.products product where product.id=product_id and product.is_active));
create policy "public product recipients" on public.product_recipients for select using(exists(select 1 from public.products product where product.id=product_id and product.is_active));
create policy "public collection products" on public.collection_products for select using(exists(select 1 from public.products product where product.id=product_id and product.is_active));
create policy "public hamper products" on public.hamper_products for select using(is_active and exists(select 1 from public.products product where product.id=product_id and product.is_active));

insert into public.collections(name,slug,description,rules,is_active)
values
  ('Most-Loved Gifts','most-loved','GiftMitra favourites customers return to.',jsonb_build_object('tags',jsonb_build_array('bestseller')),true),
  ('Personalised With Love','personalised-with-love','Gifts that carry their name, photo or message.',jsonb_build_object('tags',jsonb_build_array('personalised')),true),
  ('Little Joys Under 999','under-999','Thoughtful gifting within a lovely budget.',jsonb_build_object('maximumPrice',999),true)
on conflict(slug) do update set name=excluded.name,description=excluded.description,rules=excluded.rules,is_active=true;

insert into public.homepage_sections(section_type,title,subtitle,is_enabled,sort_order)
select values.* from (values
  ('hero_slider','Gifts as lovely as she is','Colorful little joys, curated with heart.',true,0),
  ('recipient_collection','Made for their kind of wonderful','Start with them. We’ll help with the magic.',true,1),
  ('product_grid','This week’s most-loved gifts','Thoughtful, beautiful and ready to make their day.',true,2),
  ('occasion_collection','Gifts for every beautiful reason',null,true,3),
  ('price_collection','Find their joy, your way',null,true,4),
  ('custom_hamper','A hamper as unique as they are.',null,true,5),
  ('corporate_gifting','Make work feel a little more wonderful.',null,true,6),
  ('testimonials','Notes that made us smile',null,true,7),
  ('usp','Why GiftMitra',null,true,8),
  ('newsletter','Be the first to know what’s worth gifting.',null,true,9)
) as values(section_type,title,subtitle,is_enabled,sort_order)
where not exists(select 1 from public.homepage_sections section where section.section_type=values.section_type);

insert into public.product_occasions(product_id,occasion_id)
select product.id,occasion.id
from public.products product
join public.categories category on category.id=product.category_id
join public.occasions occasion on occasion.slug = case
  when category.slug='birthday-gifts' then 'birthday'
  when category.slug='anniversary-gifts' then 'anniversary'
  when category.slug='wedding-gifts' then 'wedding'
  when category.slug='corporate-gifts' then 'corporate'
  else 'birthday' end
on conflict do nothing;

insert into public.product_recipients(product_id,recipient_id)
select product.id,recipient.id
from public.products product
join public.categories category on category.id=product.category_id
join (values
  ('gifts-for-her','for-her'),('gifts-for-her','for-parents'),
  ('gifts-for-him','for-him'),('gifts-for-him','for-parents'),
  ('anniversary-gifts','for-couples'),('wedding-gifts','for-couples'),
  ('birthday-gifts','for-bestie'),('birthday-gifts','for-kids'),('birthday-gifts','for-parents'),
  ('corporate-gifts','for-him'),('corporate-gifts','for-her'),
  ('personalised-gifts','for-her'),('personalised-gifts','for-him'),('personalised-gifts','for-couples'),
  ('hampers','for-her'),('hampers','for-him'),('hampers','for-bestie'),
  ('make-your-own-hamper','for-her'),('make-your-own-hamper','for-him'),('make-your-own-hamper','for-bestie')
) as mapping(category_slug,recipient_slug) on mapping.category_slug=category.slug
join public.recipients recipient on recipient.slug=mapping.recipient_slug
on conflict do nothing;

insert into public.hamper_products(product_id,is_active,sort_order)
select product.id,true,row_number() over(order by product.is_featured desc,product.rating_average desc)::int
from public.products product
join public.categories category on category.id=product.category_id
where category.slug in('hampers','personalised-gifts','gifts-for-her','gifts-for-him')
on conflict(product_id) do update set is_active=true,sort_order=excluded.sort_order;
