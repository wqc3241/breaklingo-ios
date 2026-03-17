export interface VocabularyItem {
  word: string;
  reading?: string;
  definition?: string;
  meaning?: string;
  partOfSpeech?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | string;
}

export interface GrammarItem {
  rule: string;
  example: string;
  explanation: string;
}

export interface PracticeSentence {
  text: string;
  translation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  usedVocabulary: string[];
  usedGrammar: string[];
}

export interface AppProject {
  id: string | number;
  title: string;
  url: string;
  script: string;
  vocabulary: VocabularyItem[];
  grammar: GrammarItem[];
  practiceSentences: PracticeSentence[];
  detectedLanguage: string;
  status?: 'pending' | 'completed' | 'failed';
  jobId?: string;
  userId?: string;
  errorMessage?: string;
  isFavorite?: boolean;
  lastAccessed?: string;
  updatedAt?: string;
}

// Quiz types
export type QuestionType =
  | 'multiple_choice'
  | 'translation'
  | 'fill_blank'
  | 'listening'
  | 'multiple_select'
  | 'word_arrange'
  | 'match_pairs'
  | 'read_after_me'
  | 'tell_meaning';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  correctAnswer: string;
  options: string[];
  sourceProject?: string;
  originalText?: string;
  // Type-specific fields
  audioText?: string;
  targetText?: string;
  words?: string[];
  correctOrder?: string[];
  pairs?: { word: string; meaning: string }[];
  correctSelections?: string[];
  context?: string;
  sentence?: string;
  blank?: string;
}

// Learning units
export interface LearningUnit {
  id: string;
  projectId: string | number;
  projectTitle: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  questions: QuizQuestion[];
  completed: boolean;
  bestScore: number;
  stars: number;
  attempts: number;
}

// Conversation types
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ConversationSummary {
  score: number;
  sentencesReviewed: { original: string; corrected: string; feedback: string }[];
  vocabularyFeedback: string[];
  grammarFeedback: string[];
  overallFeedback: string;
}

export interface ConversationSession {
  id: string;
  projectId: string | number;
  projectTitle: string;
  language: string;
  messages: ConversationMessage[];
  summary?: ConversationSummary;
  createdAt: number;
  duration: number;
}

export type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking';

// YouTube search
export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  description: string;
}

// Curated videos
export interface CuratedVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl: string;
}

// Utility functions
export const filterValidQuestions = (questions: any[]): QuizQuestion[] => {
  return questions.filter((q) => {
    if (!q.type || !q.question) return false;
    if (q.type === 'match_pairs') return q.pairs && q.pairs.length > 0;
    if (q.type === 'word_arrange') return q.words && q.correctOrder;
    if (q.type === 'multiple_select') return q.correctSelections && q.correctSelections.length > 0;
    if (q.type === 'read_after_me') return q.targetText;
    if (q.type === 'listening') return q.audioText && q.options && q.options.length > 0;
    return q.correctAnswer && q.options && q.options.length > 0;
  });
};

const parseUnitOrder = (title: string): number => {
  const match = title.match(/^Unit\s+(\d+)/i);
  return match ? parseInt(match[1], 10) - 1 : -1;
};

export const mapDbUnitToLearningUnit = (dbUnit: any, projectTitle: string): LearningUnit => {
  const title = dbUnit.title || `Unit ${dbUnit.unit_order ?? dbUnit.id ?? 0}`;
  const parsedOrder = parseUnitOrder(title);
  return {
    id: dbUnit.id,
    projectId: dbUnit.project_id,
    projectTitle,
    title,
    description: dbUnit.description || '',
    difficulty: dbUnit.difficulty || 'beginner',
    order: dbUnit.unit_order ?? (parsedOrder >= 0 ? parsedOrder : 0),
    questions: filterValidQuestions(dbUnit.questions || []),
    completed: dbUnit.completed || false,
    bestScore: dbUnit.best_score || 0,
    stars: dbUnit.stars || 0,
    attempts: dbUnit.attempts || 0,
  };
};
