import { CURATED_VIDEOS, getRecommendationsByLanguage } from '../../src/lib/recommendedVideos';

describe('CURATED_VIDEOS', () => {
  it('has at least 10 curated videos', () => {
    expect(CURATED_VIDEOS.length).toBeGreaterThanOrEqual(10);
  });

  it('each video has required fields', () => {
    CURATED_VIDEOS.forEach((video) => {
      expect(video.videoId).toBeTruthy();
      expect(video.title).toBeTruthy();
      expect(video.channelTitle).toBeTruthy();
      expect(video.language).toBeTruthy();
      expect(['beginner', 'intermediate', 'advanced']).toContain(video.level);
      expect(video.thumbnailUrl).toMatch(/^https?:\/\//);
    });
  });

  it('covers at least 5 languages', () => {
    const languages = new Set(CURATED_VIDEOS.map((v) => v.language));
    expect(languages.size).toBeGreaterThanOrEqual(5);
  });

  it('includes Japanese videos', () => {
    const japanese = CURATED_VIDEOS.filter((v) => v.language === 'Japanese');
    expect(japanese.length).toBeGreaterThan(0);
  });

  it('includes Spanish videos', () => {
    const spanish = CURATED_VIDEOS.filter((v) => v.language === 'Spanish');
    expect(spanish.length).toBeGreaterThan(0);
  });
});

describe('getRecommendationsByLanguage', () => {
  it('groups videos by language', () => {
    const grouped = getRecommendationsByLanguage();
    expect(typeof grouped).toBe('object');
    expect(Object.keys(grouped).length).toBeGreaterThan(0);
  });

  it('each language group contains only videos of that language', () => {
    const grouped = getRecommendationsByLanguage();
    Object.entries(grouped).forEach(([language, videos]) => {
      videos.forEach((video) => {
        expect(video.language).toBe(language);
      });
    });
  });

  it('total count matches CURATED_VIDEOS length', () => {
    const grouped = getRecommendationsByLanguage();
    const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    expect(total).toBe(CURATED_VIDEOS.length);
  });

  it('includes expected language keys', () => {
    const grouped = getRecommendationsByLanguage();
    expect(grouped).toHaveProperty('Japanese');
    expect(grouped).toHaveProperty('Spanish');
    expect(grouped).toHaveProperty('French');
  });
});
