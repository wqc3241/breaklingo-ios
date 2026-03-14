import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProjectProvider, useProjectContext } from '../../src/context/ProjectContext';
import { supabase } from '../../src/lib/supabase';
import type { AppProject } from '../../src/lib/types';

const mockUser = { id: 'test-user-id', email: 'test@test.com' } as any;

const mockProject: AppProject = {
  id: '1',
  title: 'Test Project',
  url: 'https://youtube.com/watch?v=test',
  script: 'Hello world',
  vocabulary: [{ word: 'hello', meaning: 'greeting' }],
  grammar: [{ rule: 'test', example: 'ex', explanation: 'exp' }],
  practiceSentences: [],
  detectedLanguage: 'English',
  status: 'completed',
};

// Test consumer component
const TestConsumer: React.FC<{ onValue?: (ctx: any) => void }> = ({ onValue }) => {
  const ctx = useProjectContext();
  React.useEffect(() => {
    onValue?.(ctx);
  }, [ctx, onValue]);

  return (
    <>
      <Text testID="project-title">{ctx.currentProject?.title || 'none'}</Text>
      <TouchableOpacity testID="set-project" onPress={() => ctx.setCurrentProject(mockProject)} />
      <TouchableOpacity testID="clear-project" onPress={() => ctx.setCurrentProject(null)} />
    </>
  );
};

describe('ProjectContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when used outside provider', () => {
    // Suppress console.error for expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useProjectContext must be used within a ProjectProvider');
    spy.mockRestore();
  });

  it('provides null currentProject initially', () => {
    const { getByTestId } = render(
      <ProjectProvider user={mockUser}>
        <TestConsumer />
      </ProjectProvider>
    );

    expect(getByTestId('project-title').props.children).toBe('none');
  });

  it('sets and clears current project', () => {
    const { getByTestId } = render(
      <ProjectProvider user={mockUser}>
        <TestConsumer />
      </ProjectProvider>
    );

    fireEvent.press(getByTestId('set-project'));
    expect(getByTestId('project-title').props.children).toBe('Test Project');

    fireEvent.press(getByTestId('clear-project'));
    expect(getByTestId('project-title').props.children).toBe('none');
  });

  it('provides fetchProjects function', async () => {
    let capturedCtx: any;
    const mockData = [
      {
        id: '1',
        title: 'P1',
        youtube_url: 'url',
        script: '',
        vocabulary: [],
        grammar: [],
        practice_sentences: [],
        detected_language: 'Japanese',
        status: 'completed',
        user_id: 'test-user-id',
        is_favorite: true,
      },
    ];

    // Build the mock chain
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    render(
      <ProjectProvider user={mockUser}>
        <TestConsumer onValue={(ctx) => { capturedCtx = ctx; }} />
      </ProjectProvider>
    );

    const projects = await capturedCtx.fetchProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].title).toBe('P1');
    expect(projects[0].isFavorite).toBe(true);
    expect(projects[0].detectedLanguage).toBe('Japanese');
  });

  it('provides deleteProject function', async () => {
    let capturedCtx: any;
    const mockChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    // Make the second .eq() call resolve
    mockChain.eq.mockReturnValueOnce(mockChain).mockResolvedValueOnce({ error: null });
    (supabase.from as jest.Mock).mockReturnValue(mockChain);

    render(
      <ProjectProvider user={mockUser}>
        <TestConsumer onValue={(ctx) => { capturedCtx = ctx; }} />
      </ProjectProvider>
    );

    await expect(capturedCtx.deleteProject('1')).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith('projects');
  });

  it('provides toggleFavorite function', async () => {
    let capturedCtx: any;
    const mockSelectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { is_favorite: false }, error: null }),
    };
    const mockUpdateChain = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    mockUpdateChain.eq.mockReturnValueOnce(mockUpdateChain).mockResolvedValueOnce({ error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSelectChain)
      .mockReturnValueOnce(mockUpdateChain);

    render(
      <ProjectProvider user={mockUser}>
        <TestConsumer onValue={(ctx) => { capturedCtx = ctx; }} />
      </ProjectProvider>
    );

    await expect(capturedCtx.toggleFavorite('1')).resolves.toBeUndefined();
  });

  it('autoSaveProject inserts new project', async () => {
    let capturedCtx: any;
    const mockSelectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    const mockInsertChain = {
      insert: jest.fn().mockResolvedValue({ error: null }),
    };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(mockSelectChain)
      .mockReturnValueOnce(mockInsertChain);

    render(
      <ProjectProvider user={mockUser}>
        <TestConsumer onValue={(ctx) => { capturedCtx = ctx; }} />
      </ProjectProvider>
    );

    await capturedCtx.autoSaveProject(mockProject);
    expect(mockInsertChain.insert).toHaveBeenCalled();
  });

  it('autoSaveProject does nothing without user', async () => {
    let capturedCtx: any;

    render(
      <ProjectProvider user={null}>
        <TestConsumer onValue={(ctx) => { capturedCtx = ctx; }} />
      </ProjectProvider>
    );

    await capturedCtx.autoSaveProject(mockProject);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
