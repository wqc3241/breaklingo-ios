import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ProjectsScreen from '../../src/screens/ProjectsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
}));

const mockFetchProjects = jest.fn(() => Promise.resolve([] as any[]));
const mockSetCurrentProject = jest.fn();
const mockDeleteProject = jest.fn();
const mockToggleFavorite = jest.fn();

jest.mock('../../src/context/ProjectContext', () => ({
  useProjectContext: () => ({
    setCurrentProject: mockSetCurrentProject,
    fetchProjects: mockFetchProjects,
    deleteProject: mockDeleteProject,
    toggleFavorite: mockToggleFavorite,
  }),
}));

describe('ProjectsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchProjects.mockResolvedValue([]);
  });

  it('renders search input', () => {
    const { getByPlaceholderText } = render(<ProjectsScreen />);
    expect(getByPlaceholderText('Search projects...')).toBeTruthy();
  });

  it('shows empty state when no projects loaded', async () => {
    const { getByText } = render(<ProjectsScreen />);
    await waitFor(() => {
      expect(getByText('No saved projects')).toBeTruthy();
    });
  });

  it('renders projects after loading', async () => {
    mockFetchProjects.mockResolvedValue([
      {
        id: '1',
        title: 'Japanese Lesson 1',
        detectedLanguage: 'Japanese',
        vocabulary: [{ word: 'a', meaning: 'b' }],
        grammar: [],
        status: 'completed',
        is_favorite: false,
      },
    ]);

    const { getByText } = render(<ProjectsScreen />);
    await waitFor(() => {
      expect(getByText('Japanese Lesson 1')).toBeTruthy();
    });
  });
});
