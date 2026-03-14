import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConversationSession } from './types';

const STORAGE_KEY = 'breaklingo-conversation-history';
const MAX_SESSIONS = 50;

export const saveSession = async (session: ConversationSession): Promise<void> => {
  try {
    const existing = await loadSessions();
    const updated = [session, ...existing.filter((s) => s.id !== session.id)].slice(0, MAX_SESSIONS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save conversation session:', error);
  }
};

export const loadSessions = async (): Promise<ConversationSession[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load conversation sessions:', error);
    return [];
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const existing = await loadSessions();
    const updated = existing.filter((s) => s.id !== sessionId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete conversation session:', error);
  }
};

export const clearAllSessions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear conversation sessions:', error);
  }
};
