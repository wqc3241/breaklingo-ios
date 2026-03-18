import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import type { LearningUnit, QuizQuestion } from '../lib/types';
import { mapDbUnitToLearningUnit, filterValidQuestions } from '../lib/types';

const PAGE_SIZE = 10;

// Lightweight select that excludes the heavy `questions` JSONB column
const UNIT_LIST_COLUMNS =
  'id, project_id, user_id, unit_number, title, description, difficulty, is_completed, best_score, attempts, stars, question_count, created_at';

export const useLearningUnits = (userId: string | undefined) => {
  const [units, setUnits] = useState<LearningUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projectTitleMapRef = useRef<Record<string, string>>({});
  const projectIdsRef = useRef<any[]>([]);

  const fetchUnits = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setPage(0);
    setHasMore(true);

    try {
      // Fetch projects
      const { data: projects, error: projError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (projError) throw projError;
      if (!projects || projects.length === 0) {
        setUnits([]);
        setIsLoading(false);
        return;
      }

      const projectIds = projects.map((p: any) => p.id);
      const projectTitleMap: Record<string, string> = {};
      projects.forEach((p: any) => { projectTitleMap[p.id] = p.title; });
      projectTitleMapRef.current = projectTitleMap;
      projectIdsRef.current = projectIds;
      setTotalProjects(projects.length);

      // Fetch learning units (first page, lightweight — no questions column)
      const { data: dbUnits, error: unitsError } = await supabase
        .from('learning_units')
        .select(UNIT_LIST_COLUMNS)
        .in('project_id', projectIds)
        .order('created_at', { ascending: true })
        .range(0, PAGE_SIZE - 1);

      if (unitsError) throw unitsError;

      if (!dbUnits || dbUnits.length === 0) {
        // Auto-generate for projects missing units
        setIsGenerating(true);
        for (const project of projects) {
          try {
            await supabase.functions.invoke('generate-learning-units', {
              body: { projectId: project.id },
            });
          } catch (e) {
            console.error('Failed to trigger unit generation for', project.id, e);
          }
        }
        // Start polling
        startPolling(projectIds, projectTitleMap);
        return;
      }

      // Show existing units immediately
      const mapped = dbUnits.map((u: any) =>
        mapDbUnitToLearningUnit(u, projectTitleMap[u.project_id] || 'Unknown')
      );
      setUnits(mapped);
      setHasMore(dbUnits.length >= PAGE_SIZE);

      // Check ALL projects for missing units (not just those in the first page).
      // The paginated dbUnits may only contain units from older projects, so we
      // query distinct project_ids across all learning_units to detect new projects
      // that still need unit generation.
      let projectsWithUnits: Set<string>;
      const { data: allUnitProjects, error: coverageError } = await supabase
        .from('learning_units')
        .select('project_id')
        .in('project_id', projectIds);

      if (coverageError || !allUnitProjects) {
        // Fallback to checking only first-page units
        projectsWithUnits = new Set(dbUnits.map((u: any) => String(u.project_id)));
        setTotalUnits(dbUnits.length);
      } else {
        projectsWithUnits = new Set(allUnitProjects.map((u: any) => String(u.project_id)));
        setTotalUnits(allUnitProjects.length);
      }
      const projectsMissing = projects.filter((p: any) => !projectsWithUnits.has(String(p.id)));

      if (projectsMissing.length > 0) {
        // Fire-and-forget: generate in background, don't block UI
        for (const project of projectsMissing) {
          supabase.functions.invoke('generate-learning-units', {
            body: { projectId: project.id },
          }).catch((e) => {
            console.error('Failed to trigger unit generation for', project.id, e);
          });
        }
        startPolling(projectIds, projectTitleMap);
      }
    } catch (error) {
      console.error('Failed to fetch learning units:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchMoreUnits = useCallback(async () => {
    if (!userId || !hasMore || isLoading) return;
    const nextPage = page + 1;
    setIsLoading(true);

    try {
      const { data: dbUnits, error } = await supabase
        .from('learning_units')
        .select(UNIT_LIST_COLUMNS)
        .in('project_id', projectIdsRef.current)
        .order('created_at', { ascending: true })
        .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      if (!dbUnits || dbUnits.length === 0) {
        setHasMore(false);
      } else {
        const mapped = dbUnits.map((u: any) =>
          mapDbUnitToLearningUnit(u, projectTitleMapRef.current[u.project_id] || 'Unknown')
        );
        setUnits((prev) => {
          const existingIds = new Set(prev.map((u) => u.id));
          const newUnits = mapped.filter((u) => !existingIds.has(u.id));
          return [...prev, ...newUnits];
        });
        setPage(nextPage);
        setHasMore(dbUnits.length >= PAGE_SIZE);
      }
    } catch (error) {
      console.error('Failed to fetch more learning units:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, hasMore, isLoading, page]);

  const fetchUnitQuestions = useCallback(async (unitId: string): Promise<QuizQuestion[]> => {
    try {
      const { data, error } = await supabase
        .from('learning_units')
        .select('questions')
        .eq('id', unitId)
        .single();

      if (error || !data) return [];
      return filterValidQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch unit questions:', error);
      return [];
    }
  }, []);

  const startPolling = useCallback((projectIds: any[], projectTitleMap: Record<string, string>) => {
    let attempts = 0;
    const maxAttempts = 24; // 120s / 5s

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setIsGenerating(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: dbUnits, error } = await supabase
          .from('learning_units')
          .select(UNIT_LIST_COLUMNS)
          .in('project_id', projectIds)
          .order('created_at', { ascending: true });

        if (error) return;

        if (dbUnits && dbUnits.length > 0) {
          const mapped = dbUnits.map((u: any) =>
            mapDbUnitToLearningUnit(u, projectTitleMap[u.project_id] || 'Unknown')
          );
          setUnits(mapped);

          // Check if all projects have units
          const projectsWithUnits = new Set(dbUnits.map((u: any) => String(u.project_id)));
          const allHaveUnits = projectIds.every((id) => projectsWithUnits.has(String(id)));

          if (allHaveUnits) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsGenerating(false);
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 5000);
  }, []);

  const updateUnitProgress = useCallback(async (unitId: string, score: number) => {
    try {
      const percentage = Math.round(score * 100);
      const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 60 ? 1 : 0;
      const completed = percentage >= 60;

      // Fetch current unit to check best score
      const { data: current } = await supabase
        .from('learning_units')
        .select('best_score, attempts')
        .eq('id', unitId)
        .single();

      const currentBest = current?.best_score || 0;
      const currentAttempts = current?.attempts || 0;

      const { error } = await supabase
        .from('learning_units')
        .update({
          is_completed: completed,
          best_score: Math.max(currentBest, percentage),
          stars: Math.max(stars, 0),
          attempts: currentAttempts + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq('id', unitId);

      if (error) throw error;

      // Update local state
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unitId
            ? {
                ...u,
                completed,
                bestScore: Math.max(u.bestScore, percentage),
                stars: Math.max(stars, u.stars),
                attempts: u.attempts + 1,
              }
            : u
        )
      );
    } catch (error) {
      console.error('Failed to update unit progress:', error);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  return {
    units,
    isLoading,
    isGenerating,
    hasMore,
    totalUnits,
    totalProjects,
    fetchUnits,
    fetchMoreUnits,
    fetchUnitQuestions,
    updateUnitProgress,
    cleanup,
  };
};
