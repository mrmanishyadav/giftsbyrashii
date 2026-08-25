import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { safeFilename } from '@/lib/request-security';

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const allowedExtensions = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg', 'mp4', 'webm', 'mov'
]);

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get('file');
    const folder = String(form.get('folder') ?? 'media').replace(/[^a-z0-9-_]/gi, '') || 'media';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Please choose a valid file to upload.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mimeValid = allowedMimeTypes.has(file.type.toLowerCase()) || allowedExtensions.has(ext);

    if (!mimeValid || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Please upload an image (JPG, PNG, WebP, AVIF, GIF) or video under 25 MB.' },
        { status: 400 }
      );
    }

    const client = createAdminClient();
    if (!client) {
      return NextResponse.json({ error: 'Storage database is unavailable.' }, { status: 503 });
    }

    const bucketName = 'giftmitra-media';

    // Ensure bucket exists
    const { data: buckets } = await client.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === bucketName);
    if (!bucketExists) {
      await client.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 26214400,
        allowedMimeTypes: Array.from(allowedMimeTypes),
      });
    }

    const cleanFilename = safeFilename(file.name);
    const path = `${folder}/${cleanFilename}`;
    const contentType = file.type || (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');

    const { error: uploadError } = await client.storage
      .from(bucketName)
      .upload(path, file, { contentType, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 400 });
    }

    const { data: urlData } = client.storage.from(bucketName).getPublicUrl(path);
    return NextResponse.json({
      ok: true,
      path,
      url: urlData.publicUrl,
      type: contentType,
      size: file.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
