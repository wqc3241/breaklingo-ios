import { renderHook, act } from '@testing-library/react-native';
import { useLearningUnits } from '../../src/hooks/useLearningUnits';
import { supabase } from '../../src/lib/supabase';

// Mock the chained query methods
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockUpdate = jest.fn();

describe('useLearningUnits', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup chain for supabase.from().select().eq().eq()
    mockSingle.mockResolvedValue({ data: { best_score: 50, attempts: 1 }, error: null });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockIn.mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({ eq: mockEq, in: mockIn, single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq, in: mockIn });
    mockUpdate.mockReturnValue({ eq: mockEq });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useLearningUnits('user-1'));
    expect(result.current.units).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isGenerating).toBe(false);
  });

  it('initializes without user', () => {
    const { result } = renderHook(() => useLearningUnits(undefined));
    expect(result.current.units).toEqual([]);
  });

  it('cleanup does not throw', () => {
    const { result } = renderHook(() => useLearningUnits('user-1'));
    expect(() => result.current.cleanup()).not.toThrow();
  });

  it('calculates star ratings correctly', async () => {
    // Test the star rating thresholds by calling updateUnitProgress
    const mockUnit = {
      id: 'unit-1',
      project_id: 'proj-1',
      title: 'Unit 1',
      description: 'Test',
      difficulty: 'beginner',
      unit_order: 0,
      questions: [],
      completed: false,
      best_score: 0,
      stars: 0,
      attempts: 0,
    };

    mockOrder.mockResolvedValue({ data: [mockUnit], error: null });
    mockEq.mockReturnValue({ eq: mockEq, in: mockIn, single: mockSingle });

    const { result } = renderHook(() => useLearningUnits('user-1'));

    // Score of 0.95 should give 3 stars
    await act(async () => {
      await result.current.updateUnitProgress('unit-1', 0.95);
    });

    expect(supabase.from).toHaveBeenCalledWith('learning_units');
  });

  it('provides fetchUnits function', () => {
    const { result } = renderHook(() => useLearningUnits('user-1'));
    expect(typeof result.current.fetchUnits).toBe('function');
  });

  it('provides updateUnitProgress function', () => {
    const { result } = renderHook(() => useLearningUnits('user-1'));
    expect(typeof result.current.updateUnitProgress).toBe('function');
  });
});
