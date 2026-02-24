export const AVATAR_URL =
  'https://evmamwdmwogmlezndueg.supabase.co/storage/v1/object/public/App_Image/orange_fox.png';

// Development testing mode - set to true to auto-login with test account
export const DEV_TEST_MODE = true;

// Test account credentials for auto-login (only used when DEV_TEST_MODE is true)
export const TEST_ACCOUNT = {
  email: 'qichaotomwang+1@gmail.com',
  password: 'SpeakSmartClips2025!',
};

export const APP_SCHEME = 'com.breaklingo.app';

export const LANGUAGES = [
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
] as const;

export const LANGUAGE_CODE_MAP: Record<string, string> = {
  Japanese: 'ja',
  Chinese: 'zh',
  Korean: 'ko',
  Spanish: 'es',
  French: 'fr',
  German: 'de',
  Italian: 'it',
  Portuguese: 'pt',
  Russian: 'ru',
  Arabic: 'ar',
  Hindi: 'hi',
};
