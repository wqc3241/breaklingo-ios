import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { YouTubeSearchResult } from '../lib/types';

export const useYouTubeSearch = () => {
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (query: string, languageCode?: string, maxResults: number = 10) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query, languageCode, maxResults },
      });

      if (error) throw error;

      if (data?.results && Array.isArray(data.results)) {
        setResults(data.results.map((r: any) => {
          const videoId = r.videoId || r.id?.videoId || '';
          return {
            videoId,
            title: r.title || '',
            channelTitle: r.channelTitle || '',
            publishedAt: r.publishedAt || '',
            thumbnailUrl: r.thumbnailUrl || r.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''),
            description: r.description || '',
          };
        }));
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('YouTube search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setResults([]);
    setHasSearched(false);
  }, []);

  return { results, isSearching, hasSearched, search, clearSearch };
};
