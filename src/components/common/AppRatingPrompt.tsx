import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  NativeModules,
} from 'react-native';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { FeedbackDialog } from './FeedbackDialog';
import { colors } from '../../lib/theme';

const { StoreReviewModule } = NativeModules;

interface Props {
  visible: boolean;
  onRate: () => void;
  onDismiss: () => void;
}

/**
 * App rating flow:
 * 1. Show a simple "Enjoying BreakLingo?" prompt with Yes/No
 * 2. "Yes" → triggers Apple's native SKStoreReviewController (the official review dialog)
 * 3. "Not really" → opens in-app FeedbackDialog (keeps negative feedback internal)
 *
 * This follows Apple's recommended pattern: pre-screen with a simple question,
 * only show the native review prompt to happy users.
 */
export const AppRatingPrompt: React.FC<Props> = ({ visible, onRate, onDismiss }) => {
  const [showFeedback, setShowFeedback] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handlePositive = () => {
    onRate();
    // Trigger Apple's native review dialog
    if (StoreReviewModule) {
      StoreReviewModule.requestReview();
    }
  };

  const handleNegative = () => {
    onRate();
    setShowFeedback(true);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="none">
        <Pressable style={styles.overlay} onPress={onDismiss}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <Pressable style={styles.card} onPress={() => {}}>
              <View style={styles.iconContainer}>
                <Star size={40} color={colors.star} fill={colors.star} />
              </View>

              <Text style={styles.title}>Enjoying BreakLingo?</Text>
              <Text style={styles.subtitle}>
                Your feedback helps us build a better language learning experience
              </Text>

              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={[styles.choiceButton, styles.positiveButton]}
                  onPress={handlePositive}
                  accessibilityLabel="Yes, I enjoy the app"
                >
                  <ThumbsUp size={20} color={colors.correctText} />
                  <Text style={[styles.choiceText, styles.positiveText]}>Yes!</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.choiceButton, styles.negativeButton]}
                  onPress={handleNegative}
                  accessibilityLabel="Not really, I have feedback"
                >
                  <ThumbsDown size={20} color={colors.wrongText} />
                  <Text style={[styles.choiceText, styles.negativeText]}>Not really</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onDismiss} testID="rating-dismiss">
                <Text style={styles.notNowText}>Ask me later</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      <FeedbackDialog
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 28,
    maxWidth: 320,
    width: 320,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  choiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  positiveButton: {
    backgroundColor: colors.correctBg,
    borderColor: colors.correctBorder,
  },
  negativeButton: {
    backgroundColor: colors.wrongBg,
    borderColor: colors.wrongBorder,
  },
  choiceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveText: {
    color: colors.correctText,
  },
  negativeText: {
    color: colors.wrongText,
  },
  notNowText: {
    color: colors.muted,
    fontSize: 14,
  },
});
