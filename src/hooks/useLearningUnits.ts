import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { LearningUnit, QuizQuestion } from '../lib/types';
import { mapDbUnitToLearningUnit, filterValidQuestions } from '../lib/types';

// Lightweight select that excludes the heavy `questions` JSONB column
const UNIT_LIST_COLUMNS =
  'id, project_id, user_id, unit_number, title, description, difficulty, is_completed, best_score, attempts, stars, question_count, created_at';

const CACHE_KEY_PREFIX = 'breaklingo-learning-units-';

const loadFromCache = async (userId: string): Promise<LearningUnit[]> => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveToCache = async (userId: string, units: LearningUnit[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(units));
  } catch {
    // Ignore cache write failures
  }
};

export const useLearningUnits = (userId: string | undefined) => {
  const [units, setUnits] = useState<LearningUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchingRef = useRef(false);

  const fetchUnits = useCallback(async () => {
    if (!userId) return;
    // Prevent concurrent fetches (polling + focus can overlap)
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // Show cached data instantly if we have no units displayed yet
      if (units.length === 0) {
        const cached = await loadFromCache(userId);
        if (cached.length > 0) {
          setUnits(cached);
          setTotalUnits(cached.length);
          // Count distinct projects from cache
          const projectSet = new Set(cached.map((u) => String(u.projectId)));
          setTotalProjects(projectSet.size);
        } else {
          setIsLoading(true);
        }
      }

      // Fetch projects
      const { data: projects, error: projError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (projError) throw projError;
      if (!projects || projects.length === 0) {
        setUnits([]);
        setTotalUnits(0);
        setTotalProjects(0);
        setIsLoading(false);
        saveToCache(userId, []);
        fetchingRef.current = false;
        return;
      }

      const projectIds = projects.map((p: any) => p.id);
      const projectTitleMap: Record<string, string> = {};
      projects.forEach((p: any) => { projectTitleMap[p.id] = p.title; });
      setTotalProjects(projects.length);

      // Fetch ALL learning units (lightweight — no questions column)
      const { data: dbUnits, error: unitsError } = await supabase
        .from('learning_units')
        .select(UNIT_LIST_COLUMNS)
        .in('project_id', projectIds)
        .order('created_at', { ascending: true });

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
        startPolling(projectIds, projectTitleMap);
        fetchingRef.current = false;
        return;
      }

      // Map and update display
      const mapped = dbUnits.map((u: any) =>
        mapDbUnitToLearningUnit(u, projectTitleMap[u.project_id] || 'Unknown')
      );
      setUnits(mapped);
      setTotalUnits(mapped.length);
      saveToCache(userId, mapped);

      // Check for projects missing units and trigger generation
      const projectsWithUnits = new Set(dbUnits.map((u: any) => String(u.project_id)));
      const projectsMissing = projects.filter((p: any) => !projectsWithUnits.has(String(p.id)));

      if (projectsMissing.length > 0) {
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
      fetchingRef.current = false;
    }
  }, [userId]);

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
          setTotalUnits(mapped.length);
          if (userId) saveToCache(userId, mapped);

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
  }, [userId]);

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
      setUnits((prev) => {
        const updated = prev.map((u) =>
          u.id === unitId
            ? {
                ...u,
                completed,
                bestScore: Math.max(u.bestScore, percentage),
                stars: Math.max(stars, u.stars),
                attempts: u.attempts + 1,
              }
            : u
        );
        // Also update cache
        if (userId) saveToCache(userId, updated);
        return updated;
      });
    } catch (error) {
      console.error('Failed to update unit progress:', error);
    }
  }, [userId]);

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
    totalUnits,
    totalProjects,
    fetchUnits,
    fetchUnitQuestions,
    updateUnitProgress,
    cleanup,
  };
};
