import { notFound } from 'next/navigation';
import { AdminConfigStudio } from '@/components/admin-config-studio';
import { AdminResourceManager } from '@/components/admin-resource-manager';
import { adminResources } from '@/lib/admin-resources';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ section: string[] }> }) {
  await requireAdmin();
  const { section } = await params;
  const key = section[0];
  const resource = adminResources[key];
  if (!resource) notFound();
  const client = createAdminClient();
  let rows: Record<string, unknown>[] = [];
  let errorText = '';
  const lookups: Record<string, { value: string; label: string }[]> = {};
  if (client) {
    const [{ data, error }, lookupResults] = await Promise.all([
      client.from(resource.table).select(resource.columns).limit(200),
      Promise.all(resource.fields.filter((field) => field.lookup).map(async (field) => {
        const lookup = field.lookup!;
        const result = await client.from(lookup.table).select(`${lookup.value},${lookup.label}`).limit(500);
        return { field: field.name, lookup, ...result };
      })),
    ]);
    rows = (data ?? []) as unknown as Record<string, unknown>[];
    errorText = error?.message ?? '';
    for (const result of lookupResults) {
      if (result.error) {
        errorText ||= result.error.message;
        continue;
      }
      lookups[result.field] = ((result.data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
        value: String(row[result.lookup.value]),
        label: String(row[result.lookup.label] ?? row[result.lookup.value]),
      }));
    }
  } else {
    errorText = 'Supabase service role is not configured.';
  }
  return (
    <div className="admin-page">
      <div className="admin-title"><div><span>LIVE MANAGEMENT</span><h1>{resource.title}</h1><p>{resource.description}</p></div></div>
      {errorText && <p className="form-notice">{errorText}</p>}
      {key === 'settings' || key === 'theme'
        ? <AdminConfigStudio mode={key} rows={rows} />
        : <AdminResourceManager resourceKey={key} resource={resource} initialRows={rows} lookups={lookups} />}
    </div>
  );
}
