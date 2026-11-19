// utils/image.ts

export function getOptimizedImageUrl(key?: string | null, width = 0, height = 0): string {
  // If no key is provided, return a default avatar
  if (!key) return '/default-avatar.png';

  // Optimistic upload previews and base64 strings
  if (key.startsWith('blob:') || key.startsWith('data:')) {
    return key;
  }

  const rustFsUrl = process.env.NEXT_PUBLIC_RUSTFS_URL || 'http://localhost:9100';
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'calls-chat-media';
  const imgproxyUrl = process.env.NEXT_PUBLIC_IMGPROXY_URL;
  const useImgproxy = process.env.NEXT_PUBLIC_USE_IMGPROXY === 'true';

  let rawKey = key;

  // Intercept RustFs full URLs and extract the key
  if (key.startsWith(rustFsUrl)) {
    const prefix = `${rustFsUrl}/${bucket}/`;
    if (key.startsWith(prefix)) {
      rawKey = key.slice(prefix.length);
    }
  } else if (key.startsWith('http://') || key.startsWith('https://')) {
    // Already an absolute HTTP/HTTPS URL (e.g. Google OAuth photo or UI avatars)
    return key;
  }

  // Strip leading slash if any
  rawKey = rawKey.replace(/^\/+/, '');

  // If imgproxy is explicitly enabled and configured, and rawKey is valid
  if (useImgproxy && imgproxyUrl && !imgproxyUrl.includes('test-img.callschat.com')) {
    if (width === 0 && height === 0) {
      return `${imgproxyUrl}/insecure/plain/s3://${bucket}/${rawKey}`;
    }
    return `${imgproxyUrl}/insecure/rs:fill:${width}:${height}/plain/s3://${bucket}/${rawKey}`;
  }

  // Production-grade resilient resolution: route via the backend streaming proxy endpoint
  // (/api/v1/media/download/*). This guarantees CORS, Range support, and token authentication.
  return getRawMediaUrl(rawKey);
}

export function getRawMediaUrl(key?: string | null): string {
  if (!key) return '';

  if (key.startsWith('blob:') || key.startsWith('data:')) {
    return key;
  }

  const rustFsUrl = process.env.NEXT_PUBLIC_RUSTFS_URL || 'http://localhost:9100';
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || 'calls-chat-media';

  let rawKey = key;

  // Intercept RustFs full URLs and extract the key for backend proxy
  if (key.startsWith(rustFsUrl)) {
    const prefix = `${rustFsUrl}/${bucket}/`;
    if (key.startsWith(prefix)) {
      rawKey = key.slice(prefix.length);
    }
  } else if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }

  // Strip leading slash if any
  rawKey = rawKey.replace(/^\/+/, '');

  // Use the backend proxy endpoint for media streaming
  const backendUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000/api/v1';
  let url = `${backendUrl}/media/download/${rawKey}`;

  // Public catalog assets and avatars do not require an authorization token.
  // Private assets (e.g. chats/...) receive ?token= for browser img/audio/video elements.
  if (
    typeof window !== 'undefined' &&
    !rawKey.startsWith('avatars/') &&
    !rawKey.startsWith('catalog/')
  ) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      url += `?token=${encodeURIComponent(token)}`;
    }
  }

  return url;
}

/**
 * Compresses an image file on the client side using the Canvas API.
 * This prevents massive file uploads from crashing against Nginx 1MB limits
 * and saves user bandwidth, creating a production-grade experience.
 * 
 * @param file The original image file
 * @param maxDim Maximum width or height (preserves aspect ratio)
 * @param quality JPEG compression quality (0 to 1)
 */
export async function compressImage(file: File, maxDim = 800, quality = 0.7): Promise<File> {
  return new Promise((resolve) => {
    // If it's not an image (e.g. video/pdf), just return the original file
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and new dimensions if the image is too large
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file); // Fallback if canvas is not supported

        ctx.drawImage(img, 0, 0, width, height);

        // Convert the canvas drawing back to a Blob, forcing JPEG for best compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              const compressedFile = new File([blob], newFileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => resolve(file); // Fallback on image load error
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => resolve(file); // Fallback on read error
    reader.readAsDataURL(file);
  });
}

