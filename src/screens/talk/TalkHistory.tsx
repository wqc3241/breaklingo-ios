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
  Clock,
  Languages,
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
                  <Text style={styles.scoreText}>Score: {item.summary.score}%</Text>
                )}
              </View>
              {expandedSession === item.id && item.summary && (
                <View style={styles.expandedSummary}>
                  <Text style={styles.summaryText}>{item.summary.overallFeedback}</Text>
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
  expandedSummary: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryText: {
    fontSize: 14,
    color: colors.secondary,
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
