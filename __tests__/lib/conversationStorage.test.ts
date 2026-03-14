import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveSession,
  loadSessions,
  deleteSession,
  clearAllSessions,
} from '../../src/lib/conversationStorage';
import type { ConversationSession } from '../../src/lib/types';

const makeMockSession = (id: string, overrides?: Partial<ConversationSession>): ConversationSession => ({
  id,
  projectId: 'proj-1',
  projectTitle: 'Test Project',
  language: 'Japanese',
  messages: [{ role: 'assistant', content: 'Hello', timestamp: 1000 }],
  createdAt: Date.now(),
  duration: 60000,
  ...overrides,
});

describe('conversationStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('saveSession', () => {
    it('saves a new session', async () => {
      const session = makeMockSession('s1');
      await saveSession(session);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'breaklingo-conversation-history',
        expect.any(String)
      );

      const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedArg);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('s1');
    });

    it('prepends new session to existing sessions', async () => {
      const existing = [makeMockSession('s1')];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));

      await saveSession(makeMockSession('s2'));

      const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedArg);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('s2');
      expect(parsed[1].id).toBe('s1');
    });

    it('deduplicates sessions by id', async () => {
      const existing = [makeMockSession('s1')];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));

      await saveSession(makeMockSession('s1', { duration: 120000 }));

      const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedArg);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].duration).toBe(120000);
    });

    it('limits to 50 sessions max', async () => {
      const existing = Array.from({ length: 55 }, (_, i) => makeMockSession(`s${i}`));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existing));

      await saveSession(makeMockSession('new'));

      const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedArg);
      expect(parsed.length).toBeLessThanOrEqual(50);
      expect(parsed[0].id).toBe('new');
    });
  });

  describe('loadSessions', () => {
    it('returns empty array when no data stored', async () => {
      const sessions = await loadSessions();
      expect(sessions).toEqual([]);
    });

    it('returns parsed sessions from storage', async () => {
      const data = [makeMockSession('s1'), makeMockSession('s2')];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const sessions = await loadSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe('s1');
    });

    it('returns empty array on parse error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('fail'));
      const sessions = await loadSessions();
      expect(sessions).toEqual([]);
    });
  });

  describe('deleteSession', () => {
    it('removes session by id', async () => {
      const data = [makeMockSession('s1'), makeMockSession('s2')];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      await deleteSession('s1');

      const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedArg);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('s2');
    });

    it('does nothing when session not found', async () => {
      const data = [makeMockSession('s1')];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      await deleteSession('nonexistent');

      const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(savedArg);
      expect(parsed).toHaveLength(1);
    });
  });

  describe('clearAllSessions', () => {
    it('removes the storage key', async () => {
      await clearAllSessions();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('breaklingo-conversation-history');
    });
  });
});
