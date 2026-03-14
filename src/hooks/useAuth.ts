import { useState, useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { DEV_TEST_MODE, TEST_ACCOUNT, APP_SCHEME } from '../lib/constants';
import type { User, Session } from '@supabase/supabase-js';

// Global lock for auto-login to prevent multiple concurrent attempts
const autoLoginLock = {
  inProgress: false,
  failed: false,
  promise: null as Promise<Session | null> | null,
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authCheckComplete = false;

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session || authCheckComplete) {
        setIsCheckingAuth(false);
      }
    });

    if (DEV_TEST_MODE) {
      const autoLogin = async () => {
        try {
          if (autoLoginLock.failed) {
            authCheckComplete = true;
            if (mounted) setIsCheckingAuth(false);
            return;
          }

          if (autoLoginLock.inProgress && autoLoginLock.promise) {
            const resultSession = await autoLoginLock.promise;
            authCheckComplete = true;
            if (mounted && resultSession) {
              setSession(resultSession);
              setUser(resultSession.user);
            }
            if (mounted) setIsCheckingAuth(false);
            return;
          }

          if (autoLoginLock.inProgress && !autoLoginLock.promise) {
            autoLoginLock.inProgress = false;
          }

          autoLoginLock.inProgress = true;

          const {
            data: { session: existingSession },
          } = await supabase.auth.getSession();

          if (!mounted) return;

          if (existingSession) {
            setSession(existingSession);
            setUser(existingSession.user);
            autoLoginLock.inProgress = false;
            setIsCheckingAuth(false);
            return;
          }

          console.log('DEV TEST MODE: Signing in with test account...');

          autoLoginLock.promise = (async (): Promise<Session | null> => {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: TEST_ACCOUNT.email,
              password: TEST_ACCOUNT.password,
            });

            if (error) {
              console.error('DEV TEST MODE: Auto-login failed:', error);
              autoLoginLock.inProgress = false;
              autoLoginLock.failed = true;
              return null;
            }

            console.log('DEV TEST MODE: Successfully logged in as', data.user?.email);
            autoLoginLock.inProgress = false;
            return data.session;
          })();

          const resultSession = await autoLoginLock.promise;
          authCheckComplete = true;

          if (!mounted) return;

          if (resultSession) {
            setSession(resultSession);
            setUser(resultSession.user);
          }
          setIsCheckingAuth(false);
        } catch (error) {
          console.error('DEV TEST MODE: Auto-login error:', error);
          autoLoginLock.inProgress = false;
          authCheckComplete = true;
          if (mounted) setIsCheckingAuth(false);
        }
      };

      autoLogin();

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) setIsCheckingAuth(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${APP_SCHEME}://callback`,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        console.error('Google OAuth error:', error);
        return;
      }

      // Open in system browser (ASWebAuthenticationSession on iOS)
      const InAppBrowser = require('react-native-inappbrowser-reborn').default;
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(data.url, `${APP_SCHEME}://callback`, {
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
          ephemeralWebSession: true,
        });

        if (result.type === 'success' && result.url) {
          // Extract tokens from the callback URL
          const url = result.url;

          // Try hash-based tokens first
          const hashPart = url.split('#')[1];
          if (hashPart) {
            const params = new URLSearchParams(hashPart);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              return;
            }
          }

          // Try PKCE code exchange
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }
      } else {
        // Fallback to Linking
        await Linking.openURL(data.url);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const handleForgotPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_SCHEME}://reset-password`,
    });
    if (error) throw error;
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return {
    user,
    session,
    isCheckingAuth,
    handleGoogleSignIn,
    handleSignIn,
    handleSignUp,
    handleForgotPassword,
    handleLogout,
  };
};
