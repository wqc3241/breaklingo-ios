import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'breaklingo-search-history';
const MAX_ENTRIES = 10;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const saveHistory = async (items: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setHistory(items);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const addToHistory = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const filtered = history.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, MAX_ENTRIES);
    await saveHistory(updated);
  }, [history]);

  const removeFromHistory = useCallback(async (query: string) => {
    const updated = history.filter((item) => item !== query);
    await saveHistory(updated);
  }, [history]);

  const clearHistory = useCallback(async () => {
    await saveHistory([]);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
};
