import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FolderOpen, Star, Search, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useProjectContext } from '../context/ProjectContext';
import type { AppProject } from '../lib/types';

const formatLastAccessed = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

const ProjectsScreen: React.FC = () => {
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();
  const { setCurrentProject, fetchProjects, deleteProject, toggleFavorite } = useProjectContext();

  const loadProjects = useCallback(async () => {
    const data = await fetchProjects();
    setProjects(data);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [fetchProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProjects();
  };

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
              setProjects((prev) => prev.filter((p) => p.id !== project.id));
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
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, isFavorite: !p.isFavorite } : p
        )
      );
    } catch {
      Alert.alert('Error', 'Could not update favorite');
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.detectedLanguage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: favorites first, then by order
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    // Secondary sort: most recently updated first
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'failed':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#D1FAE5', text: '#065F46' };
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
                {formatLastAccessed(item.lastAccessed)}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#E8550C" />
        </View>
      ) : sortedProjects.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            {searchQuery ? (
              <Search size={36} color="#E8550C" />
            ) : (
              <FolderOpen size={36} color="#E8550C" />
            )}
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching projects' : 'No saved projects'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try a different search term or clear the filter'
              : 'Search for a YouTube video on the Search tab to create your first project'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedProjects}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProject}
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
