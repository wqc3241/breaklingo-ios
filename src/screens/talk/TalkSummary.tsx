import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MessageCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { colors } from '../../lib/theme';
import type { ConversationSummary } from '../../lib/types';

interface TalkSummaryProps {
  summary: ConversationSummary | null;
  onDone: () => void;
}

const TalkSummary: React.FC<TalkSummaryProps> = ({ summary, onDone }) => {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryIconContainer}>
          <View style={styles.summaryIconCircle}>
            <MessageCircle size={36} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.summaryTitle}>Conversation Complete!</Text>

        {summary ? (
          <>
            <Text style={styles.summaryScore}>
              Score: {summary.overallScore}/10
            </Text>
            <Text style={styles.summaryFeedback}>
              {summary.overallComment}
            </Text>

            {/* Feedback items */}
            {Array.isArray(summary.feedback) && summary.feedback.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Feedback</Text>
                {summary.feedback.map((item: any, i: number) => {
                  if (typeof item === 'string') {
                    return <Text key={i} style={styles.feedbackMessage}>{'\u2022'} {item}</Text>;
                  }
                  return (
                    <View key={i} style={styles.feedbackRow}>
                      {item.category ? (
                        <Text style={[
                          styles.feedbackBadge,
                          item.severity === 'positive' && styles.feedbackPositive,
                          item.severity === 'negative' && styles.feedbackNegative,
                          item.severity === 'neutral' && styles.feedbackNeutral,
                        ]}>
                          {String(item.category || '')}
                        </Text>
                      ) : null}
                      <Text style={styles.feedbackMessage}>
                        {String(item.message || item.comment || item.feedback || '')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sentences used */}
            {Array.isArray(summary.sentencesUsed) && summary.sentencesUsed.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Sentences</Text>
                {summary.sentencesUsed.map((s, i) => (
                  <View key={i} style={styles.sentenceCard}>
                    <View style={styles.sentenceHeader}>
                      {s.isCorrect ? (
                        <CheckCircle size={16} color={colors.correctText} />
                      ) : (
                        <XCircle size={16} color={colors.destructive} />
                      )}
                      <Text style={styles.sentenceOriginal}>{s.original}</Text>
                    </View>
                    {!s.isCorrect && s.corrected && (
                      <Text style={styles.sentenceCorrected}>
                        Corrected: {s.corrected}
                      </Text>
                    )}
                    {s.translation && (
                      <Text style={styles.sentenceTranslation}>
                        {s.translation}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Vocabulary used */}
            {Array.isArray(summary.vocabularyUsed) && summary.vocabularyUsed.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Vocabulary</Text>
                {summary.vocabularyUsed.map((v, i) => (
                  <View key={i} style={styles.vocabRow}>
                    {v.usedCorrectly ? (
                      <CheckCircle size={14} color={colors.correctText} />
                    ) : (
                      <XCircle size={14} color={colors.destructive} />
                    )}
                    <View style={styles.vocabInfo}>
                      <Text style={styles.vocabWord}>{v.word}</Text>
                      {v.context ? (
                        <Text style={styles.vocabContext}>{v.context}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Grammar patterns */}
            {Array.isArray(summary.grammarPatterns) && summary.grammarPatterns.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackLabel}>Grammar</Text>
                {summary.grammarPatterns.map((g, i) => (
                  <View key={i} style={styles.vocabRow}>
                    {g.usedCorrectly ? (
                      <CheckCircle size={14} color={colors.correctText} />
                    ) : (
                      <XCircle size={14} color={colors.destructive} />
                    )}
                    <View style={styles.vocabInfo}>
                      <Text style={styles.vocabWord}>{g.pattern}</Text>
                      {g.example ? (
                        <Text style={styles.vocabContext}>{g.example}</Text>
                      ) : null}
                    </View>
                  </View>
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 32,
    alignItems: 'center',
    paddingBottom: 48,
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
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedbackRow: {
    marginBottom: 8,
  },
  feedbackBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    marginBottom: 2,
  },
  feedbackPositive: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  feedbackNegative: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  feedbackNeutral: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
  },
  feedbackMessage: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
  },
  sentenceCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sentenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentenceOriginal: {
    fontSize: 15,
    color: colors.foreground,
    flex: 1,
    fontWeight: '500',
  },
  sentenceCorrected: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 4,
    marginLeft: 24,
  },
  sentenceTranslation: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    marginLeft: 24,
    fontStyle: 'italic',
  },
  vocabRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
    paddingTop: 2,
  },
  vocabInfo: {
    flex: 1,
  },
  vocabWord: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  vocabContext: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 1,
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
