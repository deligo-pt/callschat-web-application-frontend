// utils/image.ts

export function getOptimizedImageUrl(key?: string | null, width = 0, height = 0): string {
  // If no key is provided, return a default avatar
  if (!key) return '/default-avatar.png';
  
  const rustFsUrl = process.env.NEXT_PUBLIC_RUSTFS_URL || 'http://localhost:9100';
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'calls-chat-media';
  const baseUrl = process.env.NEXT_PUBLIC_IMGPROXY_URL || 'http://localhost:8080';

  let rawKey = key;

  // Intercept RustFs full URLs and extract the key for imgproxy
  if (key.startsWith(rustFsUrl)) {
    const prefix = `${rustFsUrl}/${bucket}/`;
    if (key.startsWith(prefix)) {
      rawKey = key.slice(prefix.length);
    }
  } else if (key.startsWith('http')) {
    // If it's already a full HTTP URL (e.g. Google OAuth photo or external), return it directly
    return key;
  }

  // If width/height are 0, serve the original raw size
  if (width === 0 && height === 0) {
    return `${baseUrl}/insecure/plain/s3://${bucket}/${rawKey}`;
  }

  // Otherwise, use imgproxy to resize and crop it dynamically
  return `${baseUrl}/insecure/rs:fill:${width}:${height}/plain/s3://${bucket}/${rawKey}`;
}

export function getRawMediaUrl(key?: string | null): string {
  if (!key) return '';

  const rustFsUrl = process.env.NEXT_PUBLIC_RUSTFS_URL || 'http://localhost:9100';
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'calls-chat-media';

  let rawKey = key;
  
  // Intercept RustFs full URLs and extract the key for backend proxy
  if (key.startsWith(rustFsUrl)) {
    const prefix = `${rustFsUrl}/${bucket}/`;
    if (key.startsWith(prefix)) {
      rawKey = key.slice(prefix.length);
    }
  } else if (key.startsWith('http')) {
    return key;
  }
  
  // Use the backend proxy endpoint for raw media to handle presigned URLs and authentication
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  let url = `${backendUrl}/media/download/${rawKey}`;
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      url += `?token=${token}`;
    }
  }
  
  return url;
}
