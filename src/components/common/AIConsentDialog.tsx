import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Linking,
} from 'react-native';
import { ShieldCheck, ExternalLink } from 'lucide-react-native';
import { colors } from '../../lib/theme';

const PRIVACY_POLICY_URL = 'https://breaklingo.com/privacy';

interface Props {
  visible: boolean;
  onAgree: () => void;
}

export const AIConsentDialog: React.FC<Props> = ({ visible, onAgree }) => {
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

  const handleLearnMore = () => {
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  return (
    <Modal visible={visible} transparent animationType="none" testID="ai-consent-modal">
      <View style={styles.overlay}>
        <Animated.View style={[styles.cardWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <ShieldCheck size={40} color={colors.primary} />
            </View>

            <Text style={styles.title}>AI-Powered Learning</Text>

            <Text style={styles.body}>
              BreakLingo uses AI services to analyze video content, generate vocabulary lessons, transcribe your speech, and power conversation practice.
            </Text>

            <Text style={styles.body}>
              Your data is processed by Google Gemini AI and OpenAI Whisper. No personal information (name, email, account details) is shared — only lesson content and voice recordings.
            </Text>

            <View style={styles.safetyNote}>
              <Text style={styles.safetyNoteText}>
                Your email, password, and account information are never shared with AI services.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.agreeButton}
              onPress={onAgree}
              testID="ai-consent-agree"
              accessibilityLabel="I agree to AI data processing"
            >
              <Text style={styles.agreeButtonText}>I Agree</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.learnMoreButton}
              onPress={handleLearnMore}
              testID="ai-consent-learn-more"
              accessibilityLabel="Learn more about our privacy policy"
            >
              <ExternalLink size={14} color={colors.primary} />
              <Text style={styles.learnMoreText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '90%',
    maxWidth: 340,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
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
    marginBottom: 16,
  },
  body: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  safetyNote: {
    backgroundColor: colors.correctBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  safetyNoteText: {
    fontSize: 13,
    color: colors.correctText,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  agreeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  agreeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  learnMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
