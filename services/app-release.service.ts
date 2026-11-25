export type AppReleaseType = 'PERSONAL' | 'BUSINESS';

export interface PublicAppRelease {
  id: string;
  appType: AppReleaseType;
  platform: 'ANDROID' | 'IOS';
  versionName: string;
  versionCode: number;
  fileName: string;
  fileSizeBytes: number;
  sha256Checksum: string | null;
  releaseNotes: string | null;
  minOsVersion: string | null;
  isMandatory: boolean;
  downloadCount: number;
  publishedAt: string | null;
  downloadPath: string;
}

export interface LatestPublicReleases {
  personal: PublicAppRelease | null;
  business: PublicAppRelease | null;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1'
).replace(/\/+$/, '');

export function formatApkFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

export function getApkDownloadUrl(appType: AppReleaseType): string {
  return `${API_BASE_URL}/app-releases/${appType.toLowerCase()}/download`;
}

export async function getLatestPublicReleases(): Promise<LatestPublicReleases> {
  try {
    const res = await fetch(`${API_BASE_URL}/app-releases/latest`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return { personal: null, business: null };
    }

    const json = (await res.json()) as {
      success?: boolean;
      data?: LatestPublicReleases;
    };

    return {
      personal: json?.data?.personal ?? null,
      business: json?.data?.business ?? null,
    };
  } catch {
    return { personal: null, business: null };
  }
}

export const appReleaseService = {
  getLatestPublicReleases,
  getApkDownloadUrl,
  formatApkFileSize,
};

export default appReleaseService;
