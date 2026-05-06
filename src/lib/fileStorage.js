import { isSupabaseConfigured, supabase } from './supabase.js';

export const FILE_BUCKET = 'project-files';

const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2, 9));

function safeFileName(name) {
  const fallback = 'upload';
  const cleaned = String(name || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleaned || fallback;
}

export async function uploadProjectFile(projectId, file, userId) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Storage is not configured.');
  }
  if (!userId) {
    throw new Error('Sign in before uploading files.');
  }

  const fileId = uid();
  const uploadedAt = new Date();
  const storagePath = `${userId}/projects/${projectId}/${fileId}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage
    .from(FILE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) throw error;

  const metadata = {
    id: fileId,
    user_id: userId,
    project_id: projectId,
    name: file.name,
    kind: 'upload',
    path: '',
    storage_bucket: FILE_BUCKET,
    storage_path: storagePath,
    public_url: '',
    mime_type: file.type || '',
    size_bytes: file.size,
    date_label: uploadedAt.toLocaleDateString(),
    updated_at: uploadedAt.toISOString(),
    deleted_at: null,
  };

  const { error: metadataError } = await supabase
    .from('files')
    .upsert(metadata, { onConflict: 'id' });

  if (metadataError) throw metadataError;

  return {
    id: fileId,
    name: file.name,
    kind: 'upload',
    path: '',
    storage_bucket: FILE_BUCKET,
    storage_path: storagePath,
    public_url: '',
    mimeType: file.type || '',
    size: file.size,
    date: uploadedAt.toLocaleDateString(),
    updated_at: uploadedAt.toISOString(),
    deleted_at: null,
    sync_pending: false,
  };
}

export async function getProjectFileUrl(file) {
  if (!file.storage_path && (file.public_url || file.path)) {
    return file.public_url || file.path;
  }

  if (!isSupabaseConfigured || !supabase || !file.storage_path) {
    throw new Error('This uploaded file is missing Storage metadata.');
  }

  const { data, error } = await supabase.storage
    .from(file.storage_bucket || FILE_BUCKET)
    .createSignedUrl(file.storage_path, 60 * 10);

  if (error) {
    if (file.public_url || file.path) return file.public_url || file.path;
    throw error;
  }
  return data?.signedUrl || '';
}
