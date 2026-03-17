// Theme colors aligned with the web app (speak-smart-clips)
// Derived from CSS variables in src/index.css

export const colors = {
  // Core
  primary: '#E8550C',
  primaryForeground: '#FFF5EA',
  background: '#F5F5F5',
  card: '#FAFAFA',
  foreground: '#171717',
  border: '#D4D4D4',
  muted: '#A1A1A1',
  secondary: '#525252',
  secondaryForeground: '#FAFAFA',
  destructive: '#DB2323',
  accent: '#FFFAEA',
  accentForeground: '#F49A0A',
  primaryTinted: '#FFF5EA',

  // Status: correct / wrong
  correctBg: '#D1FAE5',
  correctBorder: '#34D399',
  correctText: '#065F46',
  wrongBg: '#FEE2E2',
  wrongBorder: '#F87171',
  wrongText: '#991B1B',

  // Difficulty levels
  beginnerBg: '#D1FAE5',
  beginnerText: '#065F46',
  intermediateBg: '#FEF3C7',
  intermediateText: '#92400E',
  advancedBg: '#FEE2E2',
  advancedText: '#991B1B',
  defaultBg: '#F3F4F6',
  defaultText: '#374151',

  // Misc
  star: '#EAB308',
  heart: '#EF4444',
  recording: '#DC2626',
  recordingLight: '#FF6B60',
  partOfSpeechBg: '#EDE9FE',
  partOfSpeechText: '#7C3AED',
  missedBg: '#FEF3C7',
  missedBorder: '#F59E0B',
  google: '#4285F4',
  transcriptBg: '#FEF3C7',
  transcriptText: '#92400E',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.4)',
  white: '#FFFFFF',
};

export const getDifficultyColor = (level?: string): { bg: string; text: string } => {
  switch (level) {
    case 'beginner':
    case 'easy':
      return { bg: colors.beginnerBg, text: colors.beginnerText };
    case 'intermediate':
    case 'medium':
      return { bg: colors.intermediateBg, text: colors.intermediateText };
    case 'advanced':
    case 'hard':
      return { bg: colors.advancedBg, text: colors.advancedText };
    default:
      return { bg: colors.defaultBg, text: colors.defaultText };
  }
};
