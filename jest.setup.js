/* global jest */

// Silence console warnings/errors in tests unless debugging
// jest.spyOn(console, 'warn').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock react-native Alert, Linking, and NativeModules at the top-level react-native module
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert.alert = jest.fn();
  RN.Linking.openURL = jest.fn();
  RN.Linking.addEventListener = jest.fn();
  RN.Linking.removeEventListener = jest.fn();
  RN.NativeModules.AudioPlayerModule = {
    playBase64: jest.fn(() => Promise.resolve(true)),
    stop: jest.fn(() => Promise.resolve(true)),
    isPlaying: jest.fn(() => Promise.resolve(false)),
  };
  RN.NativeModules.AudioRecorderModule = {
    requestPermission: jest.fn(() => Promise.resolve(true)),
    startRecording: jest.fn(() => Promise.resolve(true)),
    stopRecording: jest.fn(() => Promise.resolve('file://test-recording.m4a')),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };
  RN.NativeModules.StoreReviewModule = {
    requestReview: jest.fn(),
  };
  return RN;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
      setItem: jest.fn((key, value) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    },
  };
});

// Mock Supabase
const mockSupabaseAuth = {
  getSession: jest.fn(() =>
    Promise.resolve({
      data: {
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          user: { id: 'test-user-id', email: 'test@test.com' },
        },
      },
    })
  ),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
  signInWithPassword: jest.fn(() =>
    Promise.resolve({
      data: {
        session: { access_token: 'test-token', user: { id: 'test-user-id' } },
        user: { id: 'test-user-id', email: 'test@test.com' },
      },
      error: null,
    })
  ),
  signUp: jest.fn(() => Promise.resolve({ data: {}, error: null })),
  signOut: jest.fn(() => Promise.resolve()),
  signInWithOAuth: jest.fn(() => Promise.resolve({ data: { url: 'https://test.com' }, error: null })),
  signInWithIdToken: jest.fn(() => Promise.resolve({ data: { session: { access_token: 'apple-token' } }, error: null })),
  resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
  setSession: jest.fn(() => Promise.resolve({ data: {}, error: null })),
  exchangeCodeForSession: jest.fn(() => Promise.resolve({ data: {}, error: null })),
};

const mockSupabaseFrom = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
  single: jest.fn(() => Promise.resolve({ data: { is_favorite: false, best_score: 0, attempts: 0 }, error: null })),
  then: jest.fn((cb) => cb({ data: [], error: null })),
}));

const mockSupabaseFunctions = {
  invoke: jest.fn(() => Promise.resolve({ data: { success: true }, error: null })),
};

jest.mock('./src/lib/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
    functions: mockSupabaseFunctions,
  },
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
}));

// Mock expo-av (removed from project but still referenced in some mocks)
jest.mock('expo-av', () => {
  const mockSound = {
    unloadAsync: jest.fn(() => Promise.resolve()),
    stopAsync: jest.fn(() => Promise.resolve()),
    setOnPlaybackStatusUpdate: jest.fn(),
  };

  return {
    Audio: {
      Sound: {
        createAsync: jest.fn(() =>
          Promise.resolve({ sound: mockSound, status: { isLoaded: true } })
        ),
      },
      Recording: jest.fn().mockImplementation(() => ({
        prepareToRecordAsync: jest.fn(() => Promise.resolve()),
        startAsync: jest.fn(() => Promise.resolve()),
        stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
        getURI: jest.fn(() => 'file://test-recording.m4a'),
      })),
      RecordingOptionsPresets: {
        HIGH_QUALITY: {},
      },
      requestPermissionsAsync: jest.fn(() =>
        Promise.resolve({ status: 'granted' })
      ),
      setAudioModeAsync: jest.fn(() => Promise.resolve()),
    },
  };
}, { virtual: true });

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children, ...props }) =>
      React.createElement('View', props, children),
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock @react-navigation
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      params: {},
    }),
    NavigationContainer: ({ children }) => children,
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }) => React.createElement('View', null, children),
      Screen: ({ children }) => React.createElement('View', null, typeof children === 'function' ? null : children),
    }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => React.createElement('View', null, children),
      Screen: ({ children }) => React.createElement('View', null, typeof children === 'function' ? null : children),
    }),
  };
});

// Mock react-native-inappbrowser-reborn
jest.mock('react-native-inappbrowser-reborn', () => ({
  __esModule: true,
  default: {
    isAvailable: jest.fn(() => Promise.resolve(true)),
    openAuth: jest.fn(() => Promise.resolve({ type: 'cancel' })),
  },
}));

// Mock @invertase/react-native-apple-authentication
jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: {
    isSupported: true,
    Operation: { LOGIN: 1 },
    Scope: { EMAIL: 0, FULL_NAME: 1 },
    performRequest: jest.fn(() =>
      Promise.resolve({
        identityToken: 'mock-apple-identity-token',
        nonce: 'mock-nonce',
        user: 'mock-apple-user-id',
      })
    ),
  },
}));

// Mock react-native-youtube-iframe
jest.mock('react-native-youtube-iframe', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      const { View } = require('react-native');
      return React.createElement(View, { testID: 'youtube-player', ...props });
    }),
  };
});

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      const { View } = require('react-native');
      return React.createElement(View, { testID: 'webview', ...props });
    }),
  };
});

// Mock react-native-url-polyfill
jest.mock('react-native-url-polyfill/auto', () => {});

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return new Proxy({}, {
    get: (_, name) => (props) =>
      React.createElement(Text, { testID: `icon-${name}` }, String(name)),
  });
});

// Mock react-native-svg
jest.mock('react-native-svg', () => ({}));

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ text: 'transcribed text' }),
    text: () => Promise.resolve('ok'),
    blob: () =>
      Promise.resolve({
        type: 'audio/mp3',
      }),
    arrayBuffer: () =>
      Promise.resolve(new ArrayBuffer(8)),
  })
);

// Export mocks for test access
global.__mockSupabaseAuth = mockSupabaseAuth;
global.__mockSupabaseFrom = mockSupabaseFrom;
global.__mockSupabaseFunctions = mockSupabaseFunctions;

// Mock AIConsentContext — default to consented for all tests
jest.mock('./src/context/AIConsentContext', () => ({
  useAIConsentContext: () => ({
    hasConsented: true,
    isLoading: false,
    requireConsent: jest.fn(() => true),
  }),
  AIConsentProvider: ({ children }) => children,
}));
