import { filterValidQuestions, mapDbUnitToLearningUnit } from '../../src/lib/types';

describe('filterValidQuestions', () => {
  it('filters out questions missing type', () => {
    const questions = [
      { question: 'test', correctAnswer: 'a', options: ['a', 'b'] },
      { type: 'multiple_choice', question: 'q', correctAnswer: 'a', options: ['a', 'b'] },
    ];
    const result = filterValidQuestions(questions);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('multiple_choice');
  });

  it('filters out questions missing question text', () => {
    const questions = [
      { type: 'multiple_choice', correctAnswer: 'a', options: ['a', 'b'] },
    ];
    expect(filterValidQuestions(questions)).toHaveLength(0);
  });

  it('keeps valid multiple_choice questions', () => {
    const questions = [
      { type: 'multiple_choice', question: 'What?', correctAnswer: 'a', options: ['a', 'b', 'c', 'd'] },
    ];
    expect(filterValidQuestions(questions)).toHaveLength(1);
  });

  it('validates match_pairs questions require pairs', () => {
    const valid = [{ type: 'match_pairs', question: 'Match', pairs: [{ word: 'a', meaning: 'b' }] }];
    const invalid = [{ type: 'match_pairs', question: 'Match', pairs: [] }];
    expect(filterValidQuestions(valid)).toHaveLength(1);
    expect(filterValidQuestions(invalid)).toHaveLength(0);
  });

  it('validates word_arrange questions require words and correctOrder', () => {
    const valid = [{ type: 'word_arrange', question: 'Arrange', words: ['a'], correctOrder: ['a'] }];
    const invalid = [{ type: 'word_arrange', question: 'Arrange', words: ['a'] }];
    expect(filterValidQuestions(valid)).toHaveLength(1);
    expect(filterValidQuestions(invalid)).toHaveLength(0);
  });

  it('validates multiple_select questions require correctSelections', () => {
    const valid = [{ type: 'multiple_select', question: 'Select', options: ['a'], correctSelections: ['a'] }];
    const invalid = [{ type: 'multiple_select', question: 'Select', options: ['a'] }];
    expect(filterValidQuestions(valid)).toHaveLength(1);
    expect(filterValidQuestions(invalid)).toHaveLength(0);
  });

  it('validates read_after_me questions require targetText', () => {
    const valid = [{ type: 'read_after_me', question: 'Read', targetText: 'Hello' }];
    const invalid = [{ type: 'read_after_me', question: 'Read' }];
    expect(filterValidQuestions(valid)).toHaveLength(1);
    expect(filterValidQuestions(invalid)).toHaveLength(0);
  });

  it('validates listening questions require audioText', () => {
    const valid = [{ type: 'listening', question: 'Listen', audioText: 'Hello', correctAnswer: 'a', options: ['a'] }];
    const invalid = [{ type: 'listening', question: 'Listen', correctAnswer: 'a', options: ['a'] }];
    expect(filterValidQuestions(valid)).toHaveLength(1);
    expect(filterValidQuestions(invalid)).toHaveLength(0);
  });

  it('handles empty array', () => {
    expect(filterValidQuestions([])).toHaveLength(0);
  });
});

describe('mapDbUnitToLearningUnit', () => {
  const mockDbUnit = {
    id: 'unit-1',
    project_id: 'proj-1',
    title: 'Basic Greetings',
    description: 'Learn greetings',
    difficulty: 'beginner',
    unit_order: 0,
    questions: [
      { type: 'multiple_choice', question: 'What?', correctAnswer: 'a', options: ['a', 'b', 'c', 'd'] },
    ],
    completed: true,
    best_score: 85,
    stars: 2,
    attempts: 3,
  };

  it('maps database fields to LearningUnit interface', () => {
    const result = mapDbUnitToLearningUnit(mockDbUnit, 'Test Project');
    expect(result).toEqual({
      id: 'unit-1',
      projectId: 'proj-1',
      projectTitle: 'Test Project',
      title: 'Basic Greetings',
      description: 'Learn greetings',
      difficulty: 'beginner',
      order: 0,
      questions: expect.any(Array),
      completed: true,
      bestScore: 85,
      stars: 2,
      attempts: 3,
    });
  });

  it('provides defaults for missing fields', () => {
    const minimal = { id: 'u1', project_id: 'p1' };
    const result = mapDbUnitToLearningUnit(minimal, 'Project');
    expect(result.title).toBe('Unit u1');
    expect(result.description).toBe('');
    expect(result.difficulty).toBe('beginner');
    expect(result.order).toBe(0);
    expect(result.questions).toEqual([]);
    expect(result.completed).toBe(false);
    expect(result.bestScore).toBe(0);
    expect(result.stars).toBe(0);
    expect(result.attempts).toBe(0);
  });

  it('filters invalid questions during mapping', () => {
    const dbUnit = {
      ...mockDbUnit,
      questions: [
        { type: 'multiple_choice', question: 'Good', correctAnswer: 'a', options: ['a'] },
        { question: 'Missing type' },
      ],
    };
    const result = mapDbUnitToLearningUnit(dbUnit, 'P');
    expect(result.questions).toHaveLength(1);
  });
});
