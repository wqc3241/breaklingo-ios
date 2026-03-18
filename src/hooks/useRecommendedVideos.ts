import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { YouTubeSearchResult } from '../lib/types';

const MAX_TERMS = 3;
const VIDEOS_PER_TERM = 2;

export const useRecommendedVideos = (searchHistory: string[]) => {
  const [recommendations, setRecommendations] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchedTermsRef = useRef<string>('');

  const hasHistory = searchHistory.length > 0;

  const fetchRecommendations = useCallback(async (terms: string[]) => {
    if (terms.length === 0) return;

    // Create a stable key from the terms to avoid redundant fetches
    const termsKey = terms.join('|');
    if (termsKey === lastFetchedTermsRef.current) return;

    setIsLoading(true);
    try {
      const allResults: YouTubeSearchResult[] = [];
      const seenIds = new Set<string>();

      // Fetch in parallel for all terms
      const promises = terms.map(async (term) => {
        try {
          const { data, error } = await supabase.functions.invoke('youtube-search', {
            body: { query: term, maxResults: VIDEOS_PER_TERM + 2 },
          });

          if (error) throw error;

          if (data?.results && Array.isArray(data.results)) {
            return data.results.map((r: any) => ({
              videoId: r.videoId || r.id?.videoId || '',
              title: r.title || '',
              channelTitle: r.channelTitle || '',
              publishedAt: r.publishedAt || '',
              thumbnailUrl: r.thumbnailUrl || r.thumbnail || '',
              description: r.description || '',
            })) as YouTubeSearchResult[];
          }
          return [];
        } catch {
          return [];
        }
      });

      const resultsPerTerm = await Promise.all(promises);

      // Take VIDEOS_PER_TERM from each term, deduplicating
      for (const termResults of resultsPerTerm) {
        let added = 0;
        for (const video of termResults) {
          if (added >= VIDEOS_PER_TERM) break;
          if (video.videoId && !seenIds.has(video.videoId)) {
            seenIds.add(video.videoId);
            allResults.push(video);
            added++;
          }
        }
      }

      lastFetchedTermsRef.current = termsKey;
      setRecommendations(allResults);
    } catch {
      // Keep existing recommendations on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchHistory.length === 0) {
      setRecommendations([]);
      lastFetchedTermsRef.current = '';
      return;
    }

    const recentTerms = searchHistory.slice(0, MAX_TERMS);
    fetchRecommendations(recentTerms);
  }, [searchHistory, fetchRecommendations]);

  return { recommendations, isLoading, hasHistory };
};
