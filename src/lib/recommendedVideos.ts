import type { CuratedVideo } from './types';

export const CURATED_VIDEOS: CuratedVideo[] = [
  // Japanese
  {
    videoId: 'pdBQ1uEijMg',
    title: 'Japanese for Beginners - Common Phrases',
    channelTitle: 'JapanesePod101',
    language: 'Japanese',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/pdBQ1uEijMg/hqdefault.jpg',
  },
  {
    videoId: '6p9Il_j0zjc',
    title: 'Absolute Beginner Japanese Lesson',
    channelTitle: 'Japanese Ammo with Misa',
    language: 'Japanese',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/6p9Il_j0zjc/hqdefault.jpg',
  },
  // Chinese
  {
    videoId: 'RCKBXhbr-ZY',
    title: 'Learn Chinese in 30 Minutes',
    channelTitle: 'ChinesePod101',
    language: 'Chinese',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/RCKBXhbr-ZY/hqdefault.jpg',
  },
  {
    videoId: 'j7Bfep3E5hk',
    title: 'Chinese Conversation for Beginners',
    channelTitle: 'Mandarin Corner',
    language: 'Chinese',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/j7Bfep3E5hk/hqdefault.jpg',
  },
  // Korean
  {
    videoId: 'gRHvIB42myo',
    title: 'Learn Korean While You Sleep',
    channelTitle: 'KoreanClass101',
    language: 'Korean',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/gRHvIB42myo/hqdefault.jpg',
  },
  {
    videoId: '3FMD0yCZdtQ',
    title: 'Korean Listening Practice',
    channelTitle: 'Talk To Me In Korean',
    language: 'Korean',
    level: 'intermediate',
    thumbnailUrl: 'https://img.youtube.com/vi/3FMD0yCZdtQ/hqdefault.jpg',
  },
  // Spanish
  {
    videoId: 'DAp_v7EH9AA',
    title: 'Spanish for Beginners',
    channelTitle: 'SpanishPod101',
    language: 'Spanish',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/DAp_v7EH9AA/hqdefault.jpg',
  },
  {
    videoId: 'VlB9jui_CtA',
    title: 'Conversational Spanish Dialogues',
    channelTitle: 'Butterfly Spanish',
    language: 'Spanish',
    level: 'intermediate',
    thumbnailUrl: 'https://img.youtube.com/vi/VlB9jui_CtA/hqdefault.jpg',
  },
  // French
  {
    videoId: 'LBSfALnyrWY',
    title: 'French for Beginners - Basic Phrases',
    channelTitle: 'FrenchPod101',
    language: 'French',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/LBSfALnyrWY/hqdefault.jpg',
  },
  {
    videoId: 'lfTaz1JBYx0',
    title: 'Slow French Listening Practice',
    channelTitle: 'Français Authentique',
    language: 'French',
    level: 'intermediate',
    thumbnailUrl: 'https://img.youtube.com/vi/lfTaz1JBYx0/hqdefault.jpg',
  },
  // German
  {
    videoId: 'fsvGsYtwMXs',
    title: 'German for Beginners A1',
    channelTitle: 'Learn German with Anja',
    language: 'German',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/fsvGsYtwMXs/hqdefault.jpg',
  },
  // Italian
  {
    videoId: 'FJSGIBOEwCA',
    title: 'Italian for Beginners',
    channelTitle: 'ItalianPod101',
    language: 'Italian',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/FJSGIBOEwCA/hqdefault.jpg',
  },
  // Portuguese
  {
    videoId: 'PfJkAoLPyfc',
    title: 'Brazilian Portuguese for Beginners',
    channelTitle: 'PortuguesePod101',
    language: 'Portuguese',
    level: 'beginner',
    thumbnailUrl: 'https://img.youtube.com/vi/PfJkAoLPyfc/hqdefault.jpg',
  },
];

export const getRecommendationsByLanguage = (): Record<string, CuratedVideo[]> => {
  const grouped: Record<string, CuratedVideo[]> = {};
  for (const video of CURATED_VIDEOS) {
    if (!grouped[video.language]) {
      grouped[video.language] = [];
    }
    grouped[video.language].push(video);
  }
  return grouped;
};
