import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { colors } from '../../lib/theme';
import type { ConversationSummary } from '../../lib/types';

interface TalkSummaryProps {
  summary: ConversationSummary | null;
  onDone: () => void;
}

const TalkSummary: React.FC<TalkSummaryProps> = ({ summary, onDone }) => {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryIconContainer}>
          <View style={styles.summaryIconCircle}>
            <MessageCircle size={36} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.summaryTitle}>Conversation Complete!</Text>

        {summary ? (
          <>
            <Text style={styles.summaryScore}>Score: {summary.score}%</Text>
            <Text style={styles.summaryFeedback}>{summary.overallFeedback}</Text>

            {summary.vocabularyFeedback.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Vocabulary</Text>
                {summary.vocabularyFeedback.map((item, i) => (
                  <Text key={i} style={styles.feedbackItem}>{'\u2022'} {item}</Text>
                ))}
              </View>
            )}

            {summary.grammarFeedback.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Grammar</Text>
                {summary.grammarFeedback.map((item, i) => (
                  <Text key={i} style={styles.feedbackItem}>{'\u2022'} {item}</Text>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.metaText}>No summary available</Text>
        )}

        <TouchableOpacity style={styles.doneButton} onPress={onDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summaryContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconContainer: {
    marginBottom: 16,
  },
  summaryIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryTinted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 12,
  },
  summaryScore: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  summaryFeedback: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  feedbackSection: {
    width: '100%',
    marginBottom: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 6,
  },
  feedbackItem: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 22,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
  },
  doneButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TalkSummary;
