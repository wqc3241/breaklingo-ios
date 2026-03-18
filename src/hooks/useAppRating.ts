import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RATING_STATUS_KEY = 'breaklingo-rating-status';
const SHOW_DELAY_MS = 60_000; // 1 minute

interface RatingStatus {
  hasRated: boolean;
  dismissCount: number;
  firstLaunchSeen: boolean;
  lastDismissedAt: string | null;
}

const DEFAULT_STATUS: RatingStatus = {
  hasRated: false,
  dismissCount: 0,
  firstLaunchSeen: false,
  lastDismissedAt: null,
};

export function useAppRating() {
  const [showRating, setShowRating] = useState(false);
  const statusRef = useRef<RatingStatus>(DEFAULT_STATUS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownThisSession = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Load persisted status
      const raw = await AsyncStorage.getItem(RATING_STATUS_KEY);
      const status: RatingStatus = raw ? JSON.parse(raw) : DEFAULT_STATUS;
      statusRef.current = status;

      // First launch ever — mark it and bail
      if (!status.firstLaunchSeen) {
        const updated = { ...status, firstLaunchSeen: true };
        statusRef.current = updated;
        await AsyncStorage.setItem(RATING_STATUS_KEY, JSON.stringify(updated));
        return;
      }

      // Already rated or dismissed 3+ times — never show
      if (status.hasRated || status.dismissCount >= 3) {
        return;
      }

      // Start the 1-minute timer
      timerRef.current = setTimeout(() => {
        if (mounted && !hasShownThisSession.current) {
          hasShownThisSession.current = true;
          setShowRating(true);
        }
      }, SHOW_DELAY_MS);
    };

    init();

    // Reset timer if app goes to background
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active' && timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    });

    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      subscription.remove();
    };
  }, []);

  const onRate = useCallback(async () => {
    const updated: RatingStatus = {
      ...statusRef.current,
      hasRated: true,
    };
    statusRef.current = updated;
    await AsyncStorage.setItem(RATING_STATUS_KEY, JSON.stringify(updated));
    setShowRating(false);
  }, []);

  const onDismiss = useCallback(async () => {
    const updated: RatingStatus = {
      ...statusRef.current,
      dismissCount: statusRef.current.dismissCount + 1,
      lastDismissedAt: new Date().toISOString(),
    };
    statusRef.current = updated;
    await AsyncStorage.setItem(RATING_STATUS_KEY, JSON.stringify(updated));
    setShowRating(false);
  }, []);

  return { showRating, onRate, onDismiss };
}
