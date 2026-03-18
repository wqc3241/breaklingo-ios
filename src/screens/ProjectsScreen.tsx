import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FolderOpen, Star, Search, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import EmptyState from '../components/common/EmptyState';
import SearchBar from '../components/common/SearchBar';
import LoadingState from '../components/common/LoadingState';
import { useProjectContext } from '../context/ProjectContext';
import { useProjectList } from '../hooks/useProjectList';
import { useAuth } from '../hooks/useAuth';
import { formatRelativeDate } from '../lib/dateUtils';
import { colors } from '../lib/theme';
import type { AppProject } from '../lib/types';

const ProjectsScreen: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { setCurrentProject, deleteProject, toggleFavorite } = useProjectContext();
  const {
    projects,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchProjects,
    fetchMore,
    updateProjectLocally,
    removeProjectLocally,
  } = useProjectList(user?.id);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Re-fetch when search query changes (debounced via server-side ilike)
  useEffect(() => {
    fetchProjects(searchQuery || undefined);
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchProjects(searchQuery || undefined);
    setIsRefreshing(false);
  }, [fetchProjects, searchQuery]);

  const handleProjectPress = (project: AppProject) => {
    setCurrentProject(project);
    navigation.navigate('MoreTab', { screen: 'Study' });
  };

  const handleDeleteProject = (project: AppProject) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(project.id);
              removeProjectLocally(project.id);
            } catch {
              Alert.alert('Error', 'Could not delete project');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (project: AppProject) => {
    try {
      await toggleFavorite(project.id);
      updateProjectLocally(project.id, { isFavorite: !project.isFavorite });
    } catch {
      Alert.alert('Error', 'Could not update favorite');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return { bg: colors.correctBg, text: colors.correctText };
      case 'pending':
        return { bg: colors.intermediateBg, text: colors.intermediateText };
      case 'failed':
        return { bg: colors.wrongBg, text: colors.wrongText };
      default:
        return { bg: colors.correctBg, text: colors.correctText };
    }
  };

  const renderProject = ({ item }: { item: AppProject }) => {
    const statusColors = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleProjectPress(item)}
        onLongPress={() => handleDeleteProject(item)}
      >
        <View style={styles.projectHeader}>
          <Text style={styles.projectTitle} numberOfLines={2}>
            {item.title || 'Untitled Project'}
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => handleToggleFavorite(item)}
              accessibilityLabel={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {item.isFavorite ? (
                <Star size={16} color="#EAB308" fill="#EAB308" />
              ) : (
                <Star size={16} color="#D4D4D4" />
              )}
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.badgeText, { color: statusColors.text }]}>
                {item.status || 'completed'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.projectMeta}>
          <View style={[styles.badge, { backgroundColor: '#FFF5EA' }]}>
            <Text style={[styles.badgeText, { color: '#E8550C' }]}>
              {item.detectedLanguage}
            </Text>
          </View>
          <Text style={styles.vocabCount}>
            {item.vocabulary?.length || 0} vocab
          </Text>
          <Text style={styles.vocabCount}>
            {item.grammar?.length || 0} grammar
          </Text>
          {item.lastAccessed ? (
            <View style={styles.lastAccessedRow}>
              <Clock size={11} color="#A1A1A1" />
              <Text style={styles.lastAccessedText}>
                {formatRelativeDate(item.lastAccessed)}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search projects..."
      />

      {isLoading && projects.length === 0 ? (
        <LoadingState />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={searchQuery ? <Search size={36} color="#E8550C" /> : <FolderOpen size={36} color="#E8550C" />}
          title={searchQuery ? 'No matching projects' : 'No saved projects'}
          subtitle={searchQuery
            ? 'Try a different search term or clear the filter'
            : 'Search for a YouTube video on the Search tab to create your first project'}
        />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProject}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          onEndReached={fetchMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: '#D4D4D4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 2,
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#EAB308',
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vocabCount: {
    fontSize: 13,
    color: '#A1A1A1',
  },
  lastAccessedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  lastAccessedText: {
    fontSize: 12,
    color: '#A1A1A1',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 16,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#525252',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#A1A1A1',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ProjectsScreen;
