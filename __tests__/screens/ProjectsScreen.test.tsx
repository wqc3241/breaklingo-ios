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

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@test.com' },
  }),
}));

const mockFetchProjects = jest.fn(() => Promise.resolve());
const mockFetchMore = jest.fn();
const mockUpdateProjectLocally = jest.fn();
const mockRemoveProjectLocally = jest.fn();
let mockProjects: any[] = [];
let mockIsLoading = false;

jest.mock('../../src/hooks/useProjectList', () => ({
  useProjectList: () => ({
    projects: mockProjects,
    isLoading: mockIsLoading,
    isLoadingMore: false,
    hasMore: false,
    fetchProjects: mockFetchProjects,
    fetchMore: mockFetchMore,
    refresh: mockFetchProjects,
    updateProjectLocally: mockUpdateProjectLocally,
    removeProjectLocally: mockRemoveProjectLocally,
  }),
}));

const mockSetCurrentProject = jest.fn();
const mockDeleteProject = jest.fn();
const mockToggleFavorite = jest.fn();

jest.mock('../../src/context/ProjectContext', () => ({
  useProjectContext: () => ({
    setCurrentProject: mockSetCurrentProject,
    deleteProject: mockDeleteProject,
    toggleFavorite: mockToggleFavorite,
  }),
}));

describe('ProjectsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProjects = [];
    mockIsLoading = false;
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
    mockProjects = [
      {
        id: '1',
        title: 'Japanese Lesson 1',
        detectedLanguage: 'Japanese',
        vocabulary: [{ word: 'a', meaning: 'b' }],
        grammar: [],
        status: 'completed',
        isFavorite: false,
      },
    ];

    const { getByText } = render(<ProjectsScreen />);
    await waitFor(() => {
      expect(getByText('Japanese Lesson 1')).toBeTruthy();
    });
  });
});
