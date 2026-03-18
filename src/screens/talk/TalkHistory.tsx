import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Languages,
  MessageSquare,
} from 'lucide-react-native';
import { colors } from '../../lib/theme';
import type { ConversationSession } from '../../lib/types';

interface TalkHistoryProps {
  pastSessions: ConversationSession[];
  expandedSession: string | null;
  onToggleExpand: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onBack: () => void;
}

const TalkHistory: React.FC<TalkHistoryProps> = ({
  pastSessions,
  expandedSession,
  onToggleExpand,
  onDeleteSession,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={18} color={colors.primary} />
          <Text style={styles.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 60 }} />
      </View>

      {pastSessions.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Clock size={48} color={colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>No past conversations</Text>
          <Text style={styles.emptySubtitle}>
            Start a conversation to see your history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={pastSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => onToggleExpand(item.id)}
              onLongPress={() => onDeleteSession(item.id)}
            >
              <Text style={styles.sessionTitle}>{item.projectTitle}</Text>
              <View style={styles.sessionMeta}>
                <View style={styles.languageBadge}>
                  <Languages size={11} color={colors.primary} />
                  <Text style={styles.languageBadgeText}>{item.language}</Text>
                </View>
                <Text style={styles.metaText}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.summary && (
                  <Text style={styles.scoreText}>Score: {item.summary.overallScore}/10</Text>
                )}
              </View>
              <View style={styles.expandIndicator}>
                {expandedSession === item.id ? (
                  <ChevronUp size={16} color={colors.muted} />
                ) : (
                  <ChevronDown size={16} color={colors.muted} />
                )}
              </View>
              {expandedSession === item.id && (
                <View style={styles.expandedSummary}>
                  {item.summary ? (
                    <>
                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreLarge}>{item.summary.overallScore}/10</Text>
                        <Text style={styles.scoreLabel}>Score</Text>
                      </View>

                      {item.summary.overallComment ? (
                        <Text style={styles.summaryText}>{item.summary.overallComment}</Text>
                      ) : null}

                      {Array.isArray(item.summary.feedback) && item.summary.feedback.length > 0 && (
                        <View style={styles.feedbackSection}>
                          <Text style={styles.feedbackLabel}>Feedback</Text>
                          {item.summary.feedback.map((fb: any, i: number) => (
                            <Text key={i} style={styles.feedbackItem}>
                              {'\u2022'} {typeof fb === 'string' ? fb : fb.comment || fb.feedback || String(fb)}
                            </Text>
                          ))}
                        </View>
                      )}

                      {Array.isArray(item.summary.vocabularyUsed) && item.summary.vocabularyUsed.length > 0 && (
                        <View style={styles.feedbackSection}>
                          <Text style={styles.feedbackLabel}>Vocabulary Used</Text>
                          {item.summary.vocabularyUsed.map((v: any, i: number) => (
                            <Text key={i} style={styles.feedbackItem}>
                              {'\u2022'} {typeof v === 'string' ? v : v.word || String(v)}
                            </Text>
                          ))}
                        </View>
                      )}

                      {Array.isArray(item.summary.grammarPatterns) && item.summary.grammarPatterns.length > 0 && (
                        <View style={styles.feedbackSection}>
                          <Text style={styles.feedbackLabel}>Grammar Patterns</Text>
                          {item.summary.grammarPatterns.map((g: any, i: number) => (
                            <Text key={i} style={styles.feedbackItem}>
                              {'\u2022'} {typeof g === 'string' ? g : g.pattern || String(g)}
                            </Text>
                          ))}
                        </View>
                      )}

                      <Text style={styles.messageCount}>
                        {item.messages.length} messages
                      </Text>
                    </>
                  ) : (
                    <View style={styles.noSummaryContainer}>
                      <MessageSquare size={20} color={colors.muted} />
                      <Text style={styles.noSummaryText}>
                        No summary available — complete the conversation to see feedback
                      </Text>
                      {item.messages.length > 0 && (
                        <Text style={styles.messageCount}>
                          {item.messages.length} messages exchanged
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  backLink: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryTinted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  languageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
  },
  scoreText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  expandedSummary: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
  },
  scoreLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  feedbackSection: {
    marginBottom: 12,
  },
  feedbackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedbackItem: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 22,
    paddingLeft: 4,
  },
  sentenceReview: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  sentenceOriginal: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '500',
  },
  sentenceCorrected: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  sentenceFeedback: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  messageCount: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  noSummaryContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  noSummaryText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default TalkHistory;
