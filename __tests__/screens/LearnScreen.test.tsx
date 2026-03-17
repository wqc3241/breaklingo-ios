import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LearnScreen from '../../src/screens/LearnScreen';

// Mock hooks
const mockFetchUnits = jest.fn();
const mockCleanup = jest.fn();
let mockUnits: any[] = [];
let mockIsLoading = false;
let mockIsGenerating = false;

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
  }),
}));

jest.mock('../../src/hooks/useLearningUnits', () => ({
  useLearningUnits: () => ({
    units: mockUnits,
    isLoading: mockIsLoading,
    isGenerating: mockIsGenerating,
    fetchUnits: mockFetchUnits,
    cleanup: mockCleanup,
  }),
}));

describe('LearnScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnits = [];
    mockIsLoading = false;
    mockIsGenerating = false;
  });

  it('shows empty state when no units', () => {
    const { getByText } = render(<LearnScreen />);
    expect(getByText('No lessons yet')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockIsLoading = true;
    const { getByText } = render(<LearnScreen />);
    expect(getByText('Loading learning path...')).toBeTruthy();
  });

  it('shows generating state', () => {
    mockIsGenerating = true;
    const { getByText } = render(<LearnScreen />);
    expect(getByText('Generating lessons...')).toBeTruthy();
  });

  it('calls fetchUnits on mount', () => {
    render(<LearnScreen />);
    expect(mockFetchUnits).toHaveBeenCalled();
  });

  it('renders units when available', () => {
    mockUnits = [
      {
        id: 'u1',
        projectId: 'p1',
        projectTitle: 'Test Project',
        title: 'Introduction',
        description: 'Learn the basics',
        difficulty: 'beginner',
        order: 0,
        questions: [],
        completed: false,
        bestScore: 0,
        stars: 0,
        attempts: 0,
      },
    ];

    const { getByText } = render(<LearnScreen />);
    expect(getByText('Test Project')).toBeTruthy();
    expect(getByText('Introduction')).toBeTruthy();
    expect(getByText('beginner')).toBeTruthy();
  });

  it('shows stars for attempted units', () => {
    mockUnits = [
      {
        id: 'u1',
        projectId: 'p1',
        projectTitle: 'Test',
        title: 'Unit 1',
        description: '',
        difficulty: 'intermediate',
        order: 0,
        questions: [],
        completed: true,
        bestScore: 85,
        stars: 2,
        attempts: 3,
      },
    ];

    const { getAllByTestId, getByText } = render(<LearnScreen />);
    // Stars are now individual Lucide Star icon components
    expect(getAllByTestId('icon-Star').length).toBe(3);
    expect(getByText('Best: 85%')).toBeTruthy();
  });
});
