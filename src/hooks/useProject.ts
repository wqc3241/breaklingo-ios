import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { AppProject } from '../lib/types';

export const useProject = (user: User | null) => {
  const [currentProject, setCurrentProject] = useState<AppProject | null>(null);

  const autoSaveProject = useCallback(
    async (projectToSave: AppProject) => {
      if (!projectToSave || !user?.id) return;

      try {
        // Check if project with this URL already exists for this user
        const { data: existing, error: checkError } = await supabase
          .from('projects')
          .select('id')
          .eq('youtube_url', projectToSave.url)
          .eq('user_id', user.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existing) {
          // Update existing project
          const { error: updateError } = await supabase
            .from('projects')
            .update({
              title: projectToSave.title,
              script: projectToSave.script || '',
              vocabulary: (projectToSave.vocabulary || []) as any,
              grammar: (projectToSave.grammar || []) as any,
              practice_sentences: (projectToSave.practiceSentences || []) as any,
              detected_language: projectToSave.detectedLanguage,
              status: projectToSave.status || 'completed',
              job_id: projectToSave.jobId,
              error_message: projectToSave.errorMessage,
              last_accessed: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        } else {
          // Insert new project
          const { error: insertError } = await supabase.from('projects').insert([
            {
              youtube_url: projectToSave.url,
              title: projectToSave.title,
              script: projectToSave.script || '',
              vocabulary: (projectToSave.vocabulary || []) as any,
              grammar: (projectToSave.grammar || []) as any,
              practice_sentences: (projectToSave.practiceSentences || []) as any,
              detected_language: projectToSave.detectedLanguage,
              status: projectToSave.status || 'completed',
              job_id: projectToSave.jobId,
              error_message: projectToSave.errorMessage,
              is_favorite: false,
              user_id: user.id,
            },
          ]);

          if (insertError) throw insertError;
        }

        console.log('Project auto-saved successfully');
      } catch (error: unknown) {
        console.error('Auto-save failed:', error);
      }
    },
    [user?.id]
  );

  const fetchProjects = useCallback(async (): Promise<AppProject[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => ({
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
      }));
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      return [];
    }
  }, [user?.id]);

  const deleteProject = useCallback(
    async (projectId: string | number) => {
      if (!user?.id) return;

      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to delete project:', error);
        throw error;
      }
    },
    [user?.id]
  );

  return {
    currentProject,
    setCurrentProject,
    autoSaveProject,
    fetchProjects,
    deleteProject,
  };
};
