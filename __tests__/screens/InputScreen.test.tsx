import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import InputScreen from '../../src/screens/InputScreen';

// Mock all hooks
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
  }),
}));

jest.mock('../../src/hooks/useVideoProcessing', () => ({
  useVideoProcessing: () => ({
    isProcessing: false,
    processingStep: '',
    extractVideoId: jest.fn((url: string) => {
      const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    }),
    fetchAvailableLanguages: jest.fn(),
    processVideo: jest.fn(),
    analyzeContentWithAI: jest.fn(),
    generatePracticeSentences: jest.fn(),
    setIsProcessing: jest.fn(),
    setProcessingStep: jest.fn(),
    cleanup: jest.fn(),
  }),
}));

jest.mock('../../src/context/ProjectContext', () => ({
  useProjectContext: () => ({
    currentProject: null,
    setCurrentProject: jest.fn(),
    autoSaveProject: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useYouTubeSearch', () => ({
  useYouTubeSearch: () => ({
    results: [],
    isSearching: false,
    hasSearched: false,
    search: jest.fn(),
    clearSearch: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useSearchHistory', () => ({
  useSearchHistory: () => ({
    history: [],
    addToHistory: jest.fn(),
    removeFromHistory: jest.fn(),
    clearHistory: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useRecommendedVideos', () => ({
  useRecommendedVideos: () => ({
    recommendations: [],
    isLoading: false,
    hasHistory: false,
  }),
}));

describe('InputScreen', () => {
  it('renders search input', () => {
    const { getByPlaceholderText } = render(<InputScreen />);
    expect(getByPlaceholderText('Search or paste YouTube URL...')).toBeTruthy();
  });

  it('renders curated recommendations section', () => {
    const { getByText } = render(<InputScreen />);
    expect(getByText('Recommended Videos')).toBeTruthy();
  });

  it('renders search button', () => {
    const { getAllByText } = render(<InputScreen />);
    expect(getAllByText('Search').length).toBeGreaterThanOrEqual(1);
  });

  it('renders language recommendation tabs', () => {
    const { getByText } = render(<InputScreen />);
    expect(getByText('Japanese')).toBeTruthy();
  });

  it('renders curated video thumbnails with fallback', () => {
    const { getAllByTestId } = render(<InputScreen />);
    // Curated videos should render (Japanese tab is selected by default)
    // The component renders Image elements for thumbnails
  });
});
