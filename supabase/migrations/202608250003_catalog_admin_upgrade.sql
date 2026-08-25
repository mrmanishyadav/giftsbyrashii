-- GiftMitra catalog/admin upgrade. Safe to run repeatedly.
alter table public.products add column if not exists main_image_url text;
alter table public.products add column if not exists tags text[] not null default '{}';
alter table public.products add column if not exists whats_inside text[] not null default '{}';
alter table public.products add column if not exists specifications jsonb not null default '{}';
alter table public.products add column if not exists personalization_config jsonb not null default '{}';
alter table public.products add column if not exists publication_status text not null default 'draft';
do $$ begin
  alter table public.products add constraint products_publication_status_check check(publication_status in ('draft','published','archived'));
exception when duplicate_object then null; end $$;

insert into public.categories(name,slug,description,image_url,is_active,sort_order) values
('Birthday Gifts','birthday-gifts','Joyful birthday surprises for every age.','https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=82',true,1),
('Anniversary Gifts','anniversary-gifts','Romantic keepsakes for meaningful milestones.','https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=82',true,2),
('Wedding Gifts','wedding-gifts','Elegant wedding and newlywed gifting.','https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=82',true,3),
('Personalised Gifts','personalised-gifts','Made-for-you gifts with names, photos and messages.','https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=82',true,4),
('Gifts For Her','gifts-for-her','Lovely, thoughtful and stylish gifts for her.','https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=82',true,5),
('Gifts For Him','gifts-for-him','Useful and memorable gifts for him.','https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=900&q=82',true,6),
('Corporate Gifts','corporate-gifts','Premium employee, client and event gifting.','https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=900&q=82',true,7),
('Make Your Own Hamper','make-your-own-hamper','Build a beautiful hamper, exactly their way.','https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=900&q=82',true,8)
on conflict(slug) do update set name=excluded.name,description=excluded.description,image_url=excluded.image_url,is_active=true,sort_order=excluded.sort_order;

do $$
declare
  cats text[]:=array['birthday-gifts','anniversary-gifts','wedding-gifts','personalised-gifts','gifts-for-her','gifts-for-him','corporate-gifts','make-your-own-hamper'];
  cat_names text[]:=array['Birthday','Anniversary','Wedding','Personalised','For Her','For Him','Corporate','Build-a-Hamper'];
  styles text[]:=array['Blush Bloom Box','Chocolate Celebration Crate','Golden Moments Hamper','Cozy Candle Ritual','Sweet Memory Keepsake','Luxury Self-Care Edit','Festive Treat Basket','Photo Story Surprise','Artisan Gourmet Box','Signature Joy Bundle'];
  imgs text[]:=array[
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1200&q=86',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=86',
    'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=86',
    'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=1200&q=86',
    'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=1200&q=86',
    'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1200&q=86',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=86',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=86'
  ];
  c int; n int; pid uuid; pslug text; main_img text;
begin
  for c in 1..array_length(cats,1) loop
    for n in 1..10 loop
      pslug:=cats[c]||'-'||lpad(n::text,2,'0'); main_img:=imgs[((c+n-2)%array_length(imgs,1))+1];
      insert into public.products(category_id,name,slug,short_description,description,sku,price,mrp,cost_price,tax_rate,stock,low_stock_threshold,is_active,is_featured,is_personalized,is_cod_enabled,rating_average,rating_count,main_image_url,tags,whats_inside,specifications,personalization_config,publication_status,seo_title,seo_description)
      select id,cat_names[c]||' '||styles[n],pslug,'A lovingly curated '||lower(cat_names[c])||' gift, ready to delight.','Beautifully packed by GiftMitra with premium products, a greeting card and secure pan-India delivery. Every detail can be managed from the admin control room.','GM-'||upper(substr(replace(cats[c],'-',''),1,4))||'-'||lpad(n::text,3,'0'),699+(c*70)+(n*55),999+(c*90)+(n*75),420+(n*30),18,18+(n*3),5,true,n<=3,c in(4,8),true,round((4.10+(n%8)*0.10)::numeric,2),12+n*7,main_img,array[lower(cat_names[c]),'gift-ready',case when n<=3 then 'bestseller' else 'new' end],array['Premium gift assortment','Message card','Signature GiftMitra packaging'],jsonb_build_object('care','Keep in a cool, dry place','dispatch','1–2 working days','country','India'),case when c in(4,8) then jsonb_build_object('enabled',true,'fields',jsonb_build_array('name','message','photo')) else '{}'::jsonb end,'published',cat_names[c]||' '||styles[n]||' | GiftMitra','Shop this curated gift with secure checkout, COD options and thoughtful packaging.'
      from public.categories where slug=cats[c]
      on conflict(slug) do update set category_id=excluded.category_id,name=excluded.name,short_description=excluded.short_description,description=excluded.description,price=excluded.price,mrp=excluded.mrp,stock=excluded.stock,is_active=true,main_image_url=excluded.main_image_url,tags=excluded.tags,whats_inside=excluded.whats_inside,specifications=excluded.specifications,publication_status='published'
      returning id into pid;
      delete from public.product_media where product_id=pid;
      insert into public.product_media(product_id,url,media_type,alt_text,sort_order) values
      (pid,main_img,'image',cat_names[c]||' '||styles[n]||' main image',0),
      (pid,imgs[((c+n)%array_length(imgs,1))+1],'image',cat_names[c]||' gift gallery view',1),
      (pid,imgs[((c+n+2)%array_length(imgs,1))+1],'image','GiftMitra premium packaging detail',2);
    end loop;
  end loop;
end $$;

insert into public.site_settings(key,value) values
('payments','{"razorpayEnabled":true,"codEnabled":true,"codSurcharge":49,"codMinimum":299,"codMaximum":5000,"currency":"INR"}'),
('shipping','{"freeShippingAbove":999,"standardCharge":79,"expressCharge":149,"estimatedDays":"3–7","panIndia":true}'),
('store','{"name":"GiftMitra","supportEmail":"hello@giftmitra.in","supportPhone":"+91 98765 43210","whatsapp":"+91 98765 43210"}'),
('social','{"instagram":"https://instagram.com/giftmitra","facebook":"","youtube":""}')
on conflict(key) do update set value=excluded.value,updated_at=now();
insert into public.theme_settings(id,values) values(true,'{"primary":"#e84f78","secondary":"#7756a7","accent":"#ffb35c","background":"#fff8fb","surface":"#ffffff","text":"#2f2432","muted":"#756b78","fontHeading":"Playfair Display","fontBody":"Inter","radius":"24px"}') on conflict(id) do update set values=excluded.values,updated_at=now();
insert into public.banners(title,subtitle,desktop_image,url,is_enabled,sort_order)
select v.* from(values
('Gifts as lovely as she is','Colorful little joys, curated with a whole lot of heart.','https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1800&q=88','/category/gifts-for-her',true,1),
('Build her dream hamper','Choose the box, treats, keepsakes and your personal note.','https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=1800&q=88','/hamper-builder',true,2)
)v(title,subtitle,desktop_image,url,is_enabled,sort_order) where not exists(select 1 from public.banners b where b.title=v.title);
insert into public.faqs(question,answer,scope,is_enabled,sort_order)
select v.* from(values
('Can I personalise my gift?','Yes. Products marked Personalised let you add the requested name, photo or message before checkout.','global',true,1),
('Is cash on delivery available?','COD availability is checked against the order value and the current admin settings at checkout.','checkout',true,2),
('How long does delivery take?','Standard delivery usually takes 3–7 working days; the current promise is shown during checkout.','global',true,3)
)v(question,answer,scope,is_enabled,sort_order) where not exists(select 1 from public.faqs f where f.question=v.question);

-- Public theme/settings are readable, while all writes still go through authenticated admin APIs.
alter table public.site_settings enable row level security;
alter table public.theme_settings enable row level security;
drop policy if exists "public site settings" on public.site_settings;
drop policy if exists "public theme settings" on public.theme_settings;
create policy "public site settings" on public.site_settings for select using(true);
create policy "public theme settings" on public.theme_settings for select using(true);
