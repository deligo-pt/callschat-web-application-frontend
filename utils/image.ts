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
  } else if (key.startsWith('blob:')) {
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
  } else if (key.startsWith('blob:')) {
    return key;
  }
  
  // Use the backend proxy endpoint for raw media to handle presigned URLs and authentication
  const backendUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  let url = `${backendUrl}/media/download/${rawKey}`;
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      url += `?token=${token}`;
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

