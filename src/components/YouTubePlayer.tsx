import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ExternalLink } from 'lucide-react-native';
import { colors } from '../lib/theme';

interface YouTubePlayerProps {
  videoId: string;
  onOpenExternal?: () => void;
}

const YouTubePlayerComponent: React.FC<YouTubePlayerProps> = ({ videoId, onOpenExternal }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const onReady = useCallback(() => {
    setLoading(false);
  }, []);

  const onError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Video unavailable</Text>
        {onOpenExternal && (
          <TouchableOpacity style={styles.fallbackButton} onPress={onOpenExternal}>
            <ExternalLink size={14} color={colors.primaryForeground} />
            <Text style={styles.fallbackButtonText}>Watch on YouTube</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <YoutubePlayer
        height={200}
        videoId={videoId}
        play={false}
        onReady={onReady}
        onError={onError}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          startInLoadingState: false,
          showsHorizontalScrollIndicator: false,
          showsVerticalScrollIndicator: false,
        }}
        webViewStyle={{ opacity: loading ? 0 : 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.foreground,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.foreground,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  errorText: {
    color: colors.muted,
    fontSize: 14,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fallbackButtonText: {
    color: colors.primaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default YouTubePlayerComponent;
