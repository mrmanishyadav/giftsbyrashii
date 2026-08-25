import { createClient } from '@/lib/supabase/server';

export function contentLines(value: unknown): string[] {
  if (typeof value === 'string') return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.flatMap(contentLines);
  if (value && typeof value === 'object') return Object.values(value).flatMap(contentLines);
  return value === null || value === undefined ? [] : [String(value)];
}

export async function getPublishedPage(slug: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from('pages').select('title,content,seo_title,seo_description').eq('slug', slug).eq('is_published', true).maybeSingle();
  return data ? { ...data, body: contentLines(data.content) } : null;
}
