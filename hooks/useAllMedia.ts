import { useState, useEffect } from 'react';

export interface MediaItem {
  id: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
}

export function useAllMedia() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMedia = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api/v1";
      
      const res = await fetch(`${baseUrl}/conversations/all-media?page=${pageNum}&limit=50`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const json = await res.json();
      if (json.success) {
        if (pageNum === 1) {
          setMedia(json.data.media);
        } else {
          setMedia(prev => [...prev, ...json.data.media]);
        }
        
        const totalFetched = (pageNum - 1) * 50 + json.data.media.length;
        setHasMore(totalFetched < json.data.total);
      } else {
        setError(json.error || 'Failed to fetch media');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia(1);
  }, []);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMedia(nextPage);
    }
  };

  return {
    media,
    isLoading,
    error,
    hasMore,
    loadMore,
  };
}
