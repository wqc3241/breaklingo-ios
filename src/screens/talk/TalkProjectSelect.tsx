import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mic,
  MessageCircle,
  Clock,
  BookOpen,
  Languages,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../../lib/theme';
import type { AppProject, ConversationSession } from '../../lib/types';
import { formatRelativeDate } from '../../lib/dateUtils';

interface TalkProjectSelectProps {
  projects: AppProject[];
  pastSessions: ConversationSession[];
  isLoading: boolean;
  isRefreshing: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onProjectSelect: (project: AppProject) => void;
  onShowHistory: () => void;
}

const TalkProjectSelect: React.FC<TalkProjectSelectProps> = ({
  projects,
  pastSessions,
  isLoading,
  isRefreshing,
  searchQuery,
  onSearchChange,
  onRefresh,
  onProjectSelect,
  onShowHistory,
}) => {
  const filteredProjects = projects.filter(
    (p) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.detectedLanguage || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Talk with AI</Text>
        <TouchableOpacity onPress={onShowHistory} style={styles.historyButton}>
          <Clock size={16} color={colors.primary} />
          <Text style={styles.historyLink}>History</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerSubtitle}>Choose a project to practice speaking</Text>

      {pastSessions.length > 0 && !searchQuery && (
        <View style={styles.recentSection}>
          <Text style={styles.recentSectionTitle}>Recent Conversations</Text>
          {pastSessions.slice(0, 3).map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.recentSessionCard}
              onPress={() => {
                const project = projects.find((p) => String(p.id) === String(session.projectId));
                if (project) {
                  onProjectSelect(project);
                } else {
                  onShowHistory();
                }
              }}
            >
              <View style={styles.recentSessionIcon}>
                <MessageCircle size={16} color={colors.primary} />
              </View>
              <View style={styles.recentSessionContent}>
                <Text style={styles.recentSessionTitle} numberOfLines={1}>{session.projectTitle}</Text>
                <View style={styles.recentSessionMeta}>
                  <Text style={styles.metaText}>
                    {formatRelativeDate(new Date(session.createdAt).toISOString())}
                  </Text>
                  {session.summary && (
                    <>
                      <Text style={styles.metaDot}>{'\u00B7'}</Text>
                      <Text style={styles.scoreText}>{session.summary.score}%</Text>
                    </>
                  )}
                </View>
              </View>
              <ChevronRight size={16} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholderTextColor={colors.muted}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredProjects.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <MessageCircle size={48} color={colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching projects' : 'No projects ready'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try a different search term'
              : 'Complete a video analysis first to start voice practice'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.projectCard}
              onPress={() => onProjectSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.projectCardHeader}>
                <Text style={styles.projectTitle} numberOfLines={2}>
                  {item.title || 'Untitled Project'}
                </Text>
                <Mic size={18} color={colors.primary} />
              </View>
              <View style={styles.projectMeta}>
                <View style={styles.languageBadge}>
                  <Languages size={12} color={colors.primary} />
                  <Text style={styles.languageBadgeText}>
                    {item.detectedLanguage}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <BookOpen size={12} color={colors.muted} />
                  <Text style={styles.metaText}>{item.vocabulary?.length || 0} vocab</Text>
                </View>
                <Text style={styles.metaDot}>{'\u00B7'}</Text>
                <Text style={styles.metaText}>{item.grammar?.length || 0} grammar</Text>
                {item.lastAccessed && (
                  <>
                    <Text style={styles.metaDot}>{'\u00B7'}</Text>
                    <Text style={styles.metaText}>{formatRelativeDate(item.lastAccessed)}</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
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
  headerSubtitle: {
    fontSize: 14,
    color: colors.muted,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyLink: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  recentSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  recentSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 10,
  },
  recentSessionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryTinted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentSessionContent: {
    flex: 1,
  },
  recentSessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  },
  recentSessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.foreground,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  projectCard: {
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
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
  },
  metaDot: {
    fontSize: 13,
    color: colors.muted,
  },
  scoreText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
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

export default TalkProjectSelect;
