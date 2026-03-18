import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { AppProject } from '../lib/types';

const PAGE_SIZE = 10;

interface UseProjectListOptions {
  /** When true, only return completed projects with vocabulary */
  completedWithVocabOnly?: boolean;
}

const mapDbProjectToAppProject = (p: any): AppProject => ({
  id: p.id,
  title: p.title || '',
  url: p.youtube_url || '',
  script: p.script || '',
  vocabulary: (p.vocabulary as any) || [],
  grammar: (p.grammar as any) || [],
  practiceSentences: (p.practice_sentences as any) || [],
  detectedLanguage: p.detected_language || 'Unknown',
  status: p.status || 'completed',
  jobId: p.job_id,
  userId: p.user_id,
  errorMessage: p.error_message,
  isFavorite: p.is_favorite || false,
  lastAccessed: p.last_accessed || null,
  updatedAt: p.updated_at || null,
});

export const useProjectList = (
  userId: string | undefined,
  options: UseProjectListOptions = {},
) => {
  const { completedWithVocabOnly = false } = options;

  const [projects, setProjects] = useState<AppProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const searchQueryRef = useRef('');

  const buildQuery = useCallback(
    (search?: string) => {
      let query = supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('user_id', userId!);

      if (completedWithVocabOnly) {
        query = query.eq('status', 'completed');
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      // Sort: favorites first, then most recently updated
      query = query
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false });

      return query;
    },
    [userId, completedWithVocabOnly],
  );

  const fetchProjects = useCallback(
    async (search?: string) => {
      if (!userId) return;
      setIsLoading(true);
      setPage(0);
      setHasMore(true);
      searchQueryRef.current = search || '';

      try {
        const query = buildQuery(search);
        const { data, error } = await query.range(0, PAGE_SIZE - 1);

        if (error) throw error;

        let mapped = (data || []).map(mapDbProjectToAppProject);

        // Client-side filter for vocabulary presence (can't filter JSONB array length in Supabase easily)
        if (completedWithVocabOnly) {
          mapped = mapped.filter((p) => (p.vocabulary?.length || 0) > 0);
        }

        setProjects(mapped);
        setHasMore((data?.length || 0) === PAGE_SIZE);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, buildQuery, completedWithVocabOnly],
  );

  const fetchMore = useCallback(async () => {
    if (!userId || !hasMore || isLoading || isLoadingMore) return;
    const nextPage = page + 1;
    const offset = nextPage * PAGE_SIZE;
    setIsLoadingMore(true);

    try {
      const query = buildQuery(searchQueryRef.current || undefined);
      const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setHasMore(false);
      } else {
        let mapped = data.map(mapDbProjectToAppProject);

        if (completedWithVocabOnly) {
          mapped = mapped.filter((p) => (p.vocabulary?.length || 0) > 0);
        }

        setProjects((prev) => {
          const existingIds = new Set(prev.map((p) => String(p.id)));
          const newProjects = mapped.filter((p) => !existingIds.has(String(p.id)));
          return [...prev, ...newProjects];
        });
        setPage(nextPage);
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Failed to fetch more projects:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, hasMore, isLoading, isLoadingMore, page, buildQuery, completedWithVocabOnly]);

  const refresh = useCallback(async () => {
    await fetchProjects(searchQueryRef.current || undefined);
  }, [fetchProjects]);

  const updateProjectLocally = useCallback(
    (projectId: string | number, updates: Partial<AppProject>) => {
      setProjects((prev) =>
        prev.map((p) => (String(p.id) === String(projectId) ? { ...p, ...updates } : p)),
      );
    },
    [],
  );

  const removeProjectLocally = useCallback((projectId: string | number) => {
    setProjects((prev) => prev.filter((p) => String(p.id) !== String(projectId)));
  }, []);

  return {
    projects,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchProjects,
    fetchMore,
    refresh,
    updateProjectLocally,
    removeProjectLocally,
  };
};
