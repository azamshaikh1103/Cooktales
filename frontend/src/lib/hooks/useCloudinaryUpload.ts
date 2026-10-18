import { useState } from 'react';
import { ApiClientError, getAccessToken } from '@/lib/api/authClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type MediaUploadContext =
  | 'USER_AVATAR'
  | 'USER_BANNER'
  | 'RECIPE_MAIN'
  | 'RECIPE_GALLERY'
  | 'RECIPE_VIDEO'
  | 'STORY_COVER'
  | 'STORY_CONTENT'
  | 'THREAD_MEDIA'
  | 'TEMP';

type MediaResourceType = 'image' | 'video' | 'raw' | 'auto';

type SignedUploadResponse = {
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  publicId: string;
  resourceType: MediaResourceType;
  uploadUrl: string;
  params: {
    folder: string;
    public_id: string;
    timestamp: number;
    overwrite: boolean;
    tags: string;
  };
};

export type CloudinaryUploadResult = {
  publicUrl: string;
  publicId: string;
  resourceType: MediaResourceType;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};

type CloudinaryUploadInput = {
  file: File;
  context: MediaUploadContext;
  entityId?: string;
  resourceType?: MediaResourceType;
};

type DeleteCloudinaryAssetInput = {
  publicId: string;
  resourceType?: Exclude<MediaResourceType, 'auto'>;
};

function withAutoOptimization(url: string) {
  if (!url.includes('/upload/') || url.includes('/upload/f_auto,q_auto/')) {
    return url;
  }

  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

async function requestSignedUpload(input: Omit<CloudinaryUploadInput, 'file'>) {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/media/sign-upload`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message[0]
      : payload.message || payload.error || 'Could not prepare upload';
    throw new ApiClientError(message, response.status);
  }

  return payload as SignedUploadResponse;
}

async function confirmUpload(upload: CloudinaryUploadResult) {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/media/confirm-upload`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      publicId: upload.publicId,
      url: upload.publicUrl,
      resourceType: upload.resourceType,
      width: upload.width,
      height: upload.height,
      bytes: upload.bytes,
      format: upload.format,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiClientError(payload.message || 'Could not confirm upload', response.status);
  }
}

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAsset = async ({ publicId, resourceType = 'image' }: DeleteCloudinaryAssetInput) => {
    const token = getAccessToken();
    const response = await fetch(`${API_URL}/media/asset`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ publicId, resourceType }),
    });

    return response.ok;
  };

  const uploadFile = async ({
    file,
    context,
    entityId,
    resourceType,
  }: CloudinaryUploadInput): Promise<CloudinaryUploadResult | null> => {
    setUploading(true);
    setError(null);

    try {
      const signed = await requestSignedUpload({
        context,
        entityId,
        resourceType,
      });
      const formData = new FormData();

      formData.set('file', file);
      formData.set('api_key', signed.apiKey);
      formData.set('timestamp', String(signed.timestamp));
      formData.set('signature', signed.signature);
      formData.set('folder', signed.params.folder);
      formData.set('public_id', signed.params.public_id);
      formData.set('overwrite', String(signed.params.overwrite));
      formData.set('tags', signed.params.tags);

      const uploadResponse = await fetch(signed.uploadUrl, {
        method: 'POST',
        body: formData,
      });
      const uploaded = await uploadResponse.json().catch(() => ({}));

      if (!uploadResponse.ok) {
        throw new Error(uploaded.error?.message || 'Cloudinary upload failed');
      }

      const result: CloudinaryUploadResult = {
        publicUrl: withAutoOptimization(uploaded.secure_url),
        publicId: uploaded.public_id || signed.publicId,
        resourceType: signed.resourceType,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format,
        bytes: uploaded.bytes,
      };
      await confirmUpload(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadFile,
    deleteAsset,
    uploading,
    error,
  };
}
