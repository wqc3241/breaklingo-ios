import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { AppProject } from '../lib/types';

interface ProjectContextType {
  currentProject: AppProject | null;
  setCurrentProject: (project: AppProject | null) => void;
  autoSaveProject: (project: AppProject) => Promise<void>;
  fetchProjects: () => Promise<AppProject[]>;
  deleteProject: (projectId: string | number) => Promise<void>;
  toggleFavorite: (projectId: string | number) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  user: User | null;
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ user, children }) => {
  const [currentProject, setCurrentProject] = useState<AppProject | null>(null);

  const autoSaveProject = useCallback(
    async (projectToSave: AppProject) => {
      if (!projectToSave || !user?.id) return;

      try {
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
        isFavorite: p.is_favorite || false,
        lastAccessed: p.last_accessed || null,
        updatedAt: p.updated_at || null,
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

  const toggleFavorite = useCallback(
    async (projectId: string | number) => {
      if (!user?.id) return;

      try {
        // Fetch current favorite status
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('is_favorite')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const newValue = !data.is_favorite;

        const { error } = await supabase
          .from('projects')
          .update({ is_favorite: newValue })
          .eq('id', projectId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        throw error;
      }
    },
    [user?.id]
  );

  const value = useMemo(
    () => ({
      currentProject,
      setCurrentProject,
      autoSaveProject,
      fetchProjects,
      deleteProject,
      toggleFavorite,
    }),
    [currentProject, autoSaveProject, fetchProjects, deleteProject, toggleFavorite]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
