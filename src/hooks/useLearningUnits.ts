import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import type { LearningUnit } from '../lib/types';
import { mapDbUnitToLearningUnit } from '../lib/types';

export const useLearningUnits = (userId: string | undefined) => {
  const [units, setUnits] = useState<LearningUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnits = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

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

      // Fetch learning units
      const { data: dbUnits, error: unitsError } = await supabase
        .from('learning_units')
        .select('*')
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
        // Start polling
        startPolling(projectIds, projectTitleMap);
        return;
      }

      // Check if any projects are missing units
      const projectsWithUnits = new Set(dbUnits.map((u: any) => String(u.project_id)));
      const projectsMissing = projects.filter((p: any) => !projectsWithUnits.has(String(p.id)));

      if (projectsMissing.length > 0) {
        setIsGenerating(true);
        for (const project of projectsMissing) {
          try {
            await supabase.functions.invoke('generate-learning-units', {
              body: { projectId: project.id },
            });
          } catch (e) {
            console.error('Failed to trigger unit generation for', project.id, e);
          }
        }
        startPolling(projectIds, projectTitleMap);
      }

      const mapped = dbUnits.map((u: any) =>
        mapDbUnitToLearningUnit(u, projectTitleMap[u.project_id] || 'Unknown')
      );
      setUnits(mapped);
    } catch (error) {
      console.error('Failed to fetch learning units:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

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
          .select('*')
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
          completed,
          best_score: Math.max(currentBest, percentage),
          stars: Math.max(stars, 0),
          attempts: currentAttempts + 1,
          updated_at: new Date().toISOString(),
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
    fetchUnits,
    updateUnitProgress,
    cleanup,
  };
};
