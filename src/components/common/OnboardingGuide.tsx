import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Search, Sparkles, GraduationCap, Mic } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'breaklingo-onboarding-complete';
const { width } = Dimensions.get('window');

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: <Search size={64} color="#E8550C" />,
    title: 'Search & Discover',
    description: 'Find YouTube videos in any language you want to learn. Search for topics you love or browse curated recommendations.',
  },
  {
    icon: <Sparkles size={64} color="#E8550C" />,
    title: 'Lesson Built Automatically',
    description: 'AI extracts vocabulary, grammar, and practice sentences from the video. Your personalized lesson is ready in seconds.',
  },
  {
    icon: <GraduationCap size={64} color="#E8550C" />,
    title: 'Learn & Practice',
    description: 'Study vocabulary and grammar, then test yourself with interactive quizzes. Track your progress with stars and scores.',
  },
  {
    icon: <Mic size={64} color="#E8550C" />,
    title: 'Speak with AI',
    description: 'Have real voice conversations in your target language. Get instant feedback on pronunciation and grammar.',
  },
];

export const OnboardingGuide: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEY);
      if (!completed) {
        setVisible(true);
      }
    } catch {
      // Ignore
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const step = STEPS[currentStep];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Progress bar */}
          <View style={styles.progressRow}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  i <= currentStep && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.iconContainer}>{step.icon}</View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          <View style={styles.buttonsRow}>
            {currentStep < STEPS.length - 1 ? (
              <>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextText}>Next</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.getStartedButton} onPress={handleComplete}>
                <Text style={styles.getStartedText}>Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: width - 48,
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 32,
    width: '100%',
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4D4D4',
  },
  progressSegmentActive: {
    backgroundColor: '#E8550C',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#A1A1A1',
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E8550C',
    alignItems: 'center',
  },
  nextText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  getStartedButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E8550C',
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
