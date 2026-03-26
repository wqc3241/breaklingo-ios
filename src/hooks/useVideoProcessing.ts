import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAIConsentContext } from '../context/AIConsentContext';
import type { AppProject, GrammarItem, PracticeSentence, VocabularyItem } from '../lib/types';

export const useVideoProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const pollingIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const { requireConsent } = useAIConsentContext();

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const fetchAvailableLanguages = async (videoId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-available-languages', {
        body: { videoId },
      });
      if (error || !data?.success) return null;
      return data.availableLanguages || [];
    } catch {
      return null;
    }
  };

  const fetchTranscript = async (videoId: string, languageCode?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-transcript', {
        body: { videoId, languageCode },
      });

      if (data?.status === 'pending' && data?.jobId) {
        return {
          status: 'pending' as const,
          jobId: data.jobId,
          videoTitle: `Video Lesson - ${videoId}`,
        };
      }

      if (data?.error && data.error.includes('Rate limit exceeded')) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }

      if (!error && data?.success && data.transcript) {
        return {
          status: 'completed' as const,
          transcript: data.transcript as string,
          videoTitle: (data.videoTitle || `Video Lesson - ${videoId}`) as string,
          captionsAvailable: (data.captionsAvailable || false) as boolean,
          detectedLanguage: data.detectedLanguage as string | undefined,
        };
      }

      if (data?.error && data.error.includes('more than 50 words')) {
        throw new Error(data.error);
      }

      // If none of the above conditions matched, the response was unexpected
      throw new Error(data?.error || 'Unexpected response from transcript service. Please try again.');
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error('Could not extract transcript. Please ensure the video has captions available and try again.');
    }
  };

  const analyzeContentWithAI = async (script: string, targetLanguage?: string) => {
    const body: Record<string, any> = { transcript: script };
    if (targetLanguage) {
      body.targetLanguage = targetLanguage;
    }
    const { data, error } = await supabase.functions.invoke('analyze-content', {
      body,
    });

    if (error) {
      console.error('analyze-content error:', error);
      throw new Error('AI analysis failed. Please try again.');
    }

    // Edge function may return an error in the data body
    if (data?.error) {
      console.error('analyze-content returned error:', data.error);
      throw new Error(typeof data.error === 'string' ? data.error : 'AI analysis returned an error. Please try again.');
    }

    if (!data?.vocabulary || !data?.grammar) {
      console.error('analyze-content returned incomplete data:', JSON.stringify(data).slice(0, 200));
      throw new Error('AI analysis returned incomplete results. Please try again.');
    }

    return {
      vocabulary: (data.vocabulary || []) as VocabularyItem[],
      grammar: (data.grammar || []) as GrammarItem[],
      detectedLanguage: (data.detectedLanguage || '') as string,
    };
  };

  const generatePracticeSentences = async (
    vocabulary: VocabularyItem[],
    grammar: GrammarItem[],
    detectedLanguage: string
  ): Promise<PracticeSentence[]> => {
    try {
      // Scale practice sentence count based on vocabulary size
      const sentenceCount = vocabulary.length >= 20 ? 15 : 10;
      const { data, error } = await supabase.functions.invoke('generate-practice-sentences', {
        body: { vocabulary, grammar, detectedLanguage, count: sentenceCount },
      });

      if (error) {
        console.warn('Practice sentence generation failed:', error);
        return [];
      }
      if (data?.sentences && data.sentences.length > 0) return data.sentences;
      return [];
    } catch (err) {
      console.warn('Practice sentence generation error:', err);
      return [];
    }
  };

  const completeProjectProcessing = async (
    initialProject: AppProject,
    transcript: string,
    videoTitle: string,
    onComplete: (project: AppProject) => void
  ) => {
    try {
      const { vocabulary, grammar, detectedLanguage } = await analyzeContentWithAI(transcript, initialProject.detectedLanguage);
      const practiceSentences = await generatePracticeSentences(vocabulary, grammar, detectedLanguage);

      const completedProject: AppProject = {
        ...initialProject,
        title: videoTitle,
        script: transcript,
        vocabulary,
        grammar,
        detectedLanguage,
        practiceSentences,
        status: 'completed',
        jobId: undefined,
        errorMessage: undefined,
      };

      // Update in database
      await supabase
        .from('projects')
        .update({
          title: videoTitle,
          script: transcript,
          vocabulary: vocabulary as any,
          grammar: grammar as any,
          practice_sentences: practiceSentences as any,
          detected_language: detectedLanguage,
          vocabulary_count: vocabulary.length,
          grammar_count: grammar.length,
          status: 'completed',
          job_id: null,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('job_id', initialProject.jobId)
        .eq('user_id', initialProject.userId);

      Alert.alert('Video ready!', `"${videoTitle}" is now ready for study.`);
      onComplete(completedProject);
    } catch (error) {
      console.error('Failed to complete project processing:', error);
      const message = error instanceof Error ? error.message : 'Could not finish processing the video.';
      Alert.alert('Processing failed', message);
    }
  };

  const startJobPolling = (
    jobId: string,
    videoId: string,
    initialProject: AppProject,
    onComplete: (project: AppProject) => void
  ) => {
    // Clear any existing polling for this jobId to prevent leaks
    const existingInterval = pollingIntervalsRef.current.get(jobId);
    if (existingInterval) {
      clearInterval(existingInterval);
      pollingIntervalsRef.current.delete(jobId);
    }

    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('poll-transcript-job', {
          body: { jobId, videoId },
        });

        if (error) return;

        if (data.status === 'completed') {
          clearInterval(pollInterval);
          pollingIntervalsRef.current.delete(jobId);
          await completeProjectProcessing(initialProject, data.transcript, data.videoTitle, onComplete);
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          pollingIntervalsRef.current.delete(jobId);
          Alert.alert('Generation failed', data.error);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 60000);

    pollingIntervalsRef.current.set(jobId, pollInterval);
  };

  const processVideo = async (
    videoId: string,
    languageCode?: string,
    selectedLanguageName?: string,
    userId?: string,
    onProjectUpdate?: (project: AppProject) => void
  ): Promise<AppProject> => {
    if (!requireConsent()) {
      throw new Error('AI_CONSENT_REQUIRED');
    }
    setIsProcessing(true);
    setProcessingStep('Extracting transcript...');

    try {
      const result = await fetchTranscript(videoId, languageCode);

      if (result.status === 'pending' && 'jobId' in result && result.jobId) {
        const pendingProject: AppProject = {
          id: Date.now(),
          title: result.videoTitle,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          script: '',
          vocabulary: [],
          grammar: [],
          detectedLanguage: selectedLanguageName || 'Unknown',
          practiceSentences: [],
          status: 'pending',
          jobId: result.jobId,
          userId,
        };

        Alert.alert('AI generation started', 'Generating the script by AI. You can keep pulling other videos.');

        if (onProjectUpdate) {
          startJobPolling(result.jobId, videoId, pendingProject, onProjectUpdate);
        }

        setIsProcessing(false);
        setProcessingStep('');
        return pendingProject;
      }

      const { transcript, videoTitle, detectedLanguage: edgeFnLang } = result as {
        transcript: string;
        videoTitle: string;
        detectedLanguage?: string;
      };

      // Use the edge function's detected language (from YouTube Data API) as the hint for AI analysis
      const languageHint = selectedLanguageName || edgeFnLang;

      setProcessingStep('Analyzing content with AI...');
      const { vocabulary, grammar, detectedLanguage: aiDetectedLang } = await analyzeContentWithAI(transcript, languageHint);

      // Priority: AI detection from actual content > edge function detection > user-provided name
      const finalLanguage = aiDetectedLang || edgeFnLang || selectedLanguageName || 'Unknown';

      if (vocabulary.length === 0 && grammar.length === 0) {
        Alert.alert('Analysis incomplete', 'AI could not extract vocabulary or grammar from this video. The transcript has been saved — you can try regenerating later.');
      }

      let practiceSentences: PracticeSentence[] = [];
      if (vocabulary.length > 0 && grammar.length > 0) {
        setProcessingStep('Generating practice sentences...');
        practiceSentences = await generatePracticeSentences(vocabulary, grammar, finalLanguage);
      }

      const project: AppProject = {
        id: Date.now(),
        title: videoTitle || `Video Lesson - ${videoId}`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        script: transcript,
        vocabulary,
        grammar,
        detectedLanguage: finalLanguage,
        practiceSentences,
        status: 'completed',
        userId,
      };

      return project;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process video';
      if (message === 'RATE_LIMIT_EXCEEDED') {
        Alert.alert('Rate Limit Exceeded', 'Please wait a few minutes and try again.');
      } else {
        Alert.alert('Processing failed', message);
      }
      throw error;
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const regenerateAnalysis = async (currentProject: AppProject | null): Promise<AppProject | null> => {
    if (!currentProject) return null;

    setIsProcessing(true);
    setProcessingStep('Re-analyzing content with AI...');

    try {
      const { vocabulary, grammar, detectedLanguage } = await analyzeContentWithAI(currentProject.script, currentProject.detectedLanguage);

      setProcessingStep('Generating practice sentences...');
      const practiceSentences = await generatePracticeSentences(vocabulary, grammar, detectedLanguage);

      return {
        ...currentProject,
        vocabulary,
        grammar,
        detectedLanguage,
        practiceSentences,
      };
    } catch {
      Alert.alert('Regeneration failed', 'Could not regenerate analysis');
      return null;
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const cleanup = useCallback(() => {
    pollingIntervalsRef.current.forEach((interval) => clearInterval(interval));
    pollingIntervalsRef.current.clear();
  }, []);

  return {
    isProcessing,
    processingStep,
    setProcessingStep,
    setIsProcessing,
    extractVideoId,
    fetchAvailableLanguages,
    processVideo,
    regenerateAnalysis,
    analyzeContentWithAI,
    generatePracticeSentences,
    cleanup,
  };
};
