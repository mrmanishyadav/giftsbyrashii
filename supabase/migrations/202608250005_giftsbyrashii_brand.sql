-- Keep existing installations and fresh database setups aligned with the public brand.
update public.site_settings
set value = jsonb_set(value, '{name}', to_jsonb('GiftsByRashii'::text), true),
    updated_at = now()
where key = 'store';

update public.homepage_sections
set title = replace(title, 'GiftMitra', 'GiftsByRashii'),
    subtitle = replace(subtitle, 'GiftMitra', 'GiftsByRashii'),
    description = replace(description, 'GiftMitra', 'GiftsByRashii'),
    configuration = replace(configuration::text, 'GiftMitra', 'GiftsByRashii')::jsonb,
    updated_at = now()
where concat_ws(' ', title, subtitle, description, configuration::text) like '%GiftMitra%';

update public.pages
set title = replace(title, 'GiftMitra', 'GiftsByRashii'),
    content = replace(content::text, 'GiftMitra', 'GiftsByRashii')::jsonb,
    seo_title = replace(seo_title, 'GiftMitra', 'GiftsByRashii'),
    seo_description = replace(seo_description, 'GiftMitra', 'GiftsByRashii'),
    updated_at = now()
where concat_ws(' ', title, content::text, seo_title, seo_description) like '%GiftMitra%';

update public.products
set short_description = replace(short_description, 'GiftMitra', 'GiftsByRashii'),
    description = replace(description, 'GiftMitra', 'GiftsByRashii'),
    rich_content = replace(rich_content::text, 'GiftMitra', 'GiftsByRashii')::jsonb,
    seo_title = replace(seo_title, 'GiftMitra', 'GiftsByRashii'),
    seo_description = replace(seo_description, 'GiftMitra', 'GiftsByRashii'),
    updated_at = now()
where concat_ws(' ', short_description, description, rich_content::text, seo_title, seo_description) like '%GiftMitra%';

update public.product_media
set alt_text = replace(alt_text, 'GiftMitra', 'GiftsByRashii')
where alt_text like '%GiftMitra%';

update public.collections
set description = replace(description, 'GiftMitra', 'GiftsByRashii')
where description like '%GiftMitra%';

update public.faqs
set question = replace(question, 'GiftMitra', 'GiftsByRashii'),
    answer = replace(answer, 'GiftMitra', 'GiftsByRashii')
where concat_ws(' ', question, answer) like '%GiftMitra%';

update public.banners
set title = replace(title, 'GiftMitra', 'GiftsByRashii'),
    subtitle = replace(subtitle, 'GiftMitra', 'GiftsByRashii')
where concat_ws(' ', title, subtitle) like '%GiftMitra%';

update public.announcement_bars
set text = replace(text, 'GiftMitra', 'GiftsByRashii')
where text like '%GiftMitra%';

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,mobile,email)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name','GiftsByRashii Customer'),coalesce(new.raw_user_meta_data->>'mobile',''),new.email);
  return new;
end
$$;
