import { createClient } from '@/lib/supabase/server';

const color = (value: unknown, fallback: string) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
const radius = (value: unknown) => typeof value === 'string' && /^(12|18|24|32)px$/.test(value) ? value : '24px';

export async function ThemeStyle() {
  const client = await createClient();
  if (!client) return null;
  const { data } = await client.from('theme_settings').select('values').eq('id', true).maybeSingle();
  const value = (data?.values ?? {}) as Record<string, unknown>;
  const heading = String(value.fontHeading ?? '').toLowerCase().includes('sans') ? 'var(--font-manrope)' : 'var(--font-display)';
  const css = `:root{--berry:${color(value.primary, '#7b1838')};--berry-deep:${color(value.secondary, '#581128')};--accent:${color(value.accent, '#d8899f')};--blush:${color(value.background, '#fbf0f1')};--cream:${color(value.surface, '#fffaf4')};--ink:${color(value.text, '#291c22')};--muted:${color(value.muted, '#71636a')};--font-heading:${heading};--radius:${radius(value.radius)};}.button,.field input,.field textarea,.field select{border-radius:var(--radius)}`;
  return <style data-giftmitra-theme dangerouslySetInnerHTML={{ __html: css }} />;
}
