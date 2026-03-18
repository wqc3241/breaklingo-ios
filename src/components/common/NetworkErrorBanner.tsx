import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { colors } from '../../lib/theme';

interface Props {
  message?: string;
  onRetry?: () => void;
}

const NetworkErrorBanner: React.FC<Props> = ({
  message = 'Could not load data. Check your connection.',
  onRetry,
}) => (
  <View style={styles.container}>
    <View style={styles.banner}>
      <WifiOff size={20} color={colors.wrongText} />
      <Text style={styles.message}>{message}</Text>
    </View>
    {onRetry && (
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityLabel="Retry loading"
      >
        <RefreshCw size={14} color={colors.white} />
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: colors.wrongBg,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.wrongBorder,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  message: {
    fontSize: 14,
    color: colors.wrongText,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NetworkErrorBanner;
