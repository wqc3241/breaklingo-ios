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
    processVideo: jest.fn(),
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

describe('InputScreen', () => {
  it('renders search input', () => {
    const { getByPlaceholderText } = render(<InputScreen />);
    expect(getByPlaceholderText('Search YouTube videos...')).toBeTruthy();
  });

  it('renders curated recommendations section', () => {
    const { getByText } = render(<InputScreen />);
    expect(getByText('Recommended Videos')).toBeTruthy();
  });

  it('renders URL paste toggle', () => {
    const { getByText } = render(<InputScreen />);
    expect(getByText('Paste YouTube URL instead')).toBeTruthy();
  });

  it('shows URL input when paste button pressed', () => {
    const { getByText, getByPlaceholderText } = render(<InputScreen />);
    fireEvent.press(getByText('Paste YouTube URL instead'));
    expect(getByPlaceholderText('Paste YouTube URL...')).toBeTruthy();
  });

  it('renders language recommendation tabs', () => {
    const { getByText } = render(<InputScreen />);
    expect(getByText('Japanese')).toBeTruthy();
  });
});
