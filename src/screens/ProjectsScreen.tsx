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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProject';
import type { AppProject } from '../lib/types';

const ProjectsScreen: React.FC = () => {
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();
  const { user, handleLogout } = useAuth();
  const { setCurrentProject, fetchProjects, deleteProject } = useProject(user);

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
    navigation.navigate('StudyTab');
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

  const filteredProjects = projects.filter(
    (p) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.detectedLanguage.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.badgeText, { color: statusColors.text }]}>
              {item.status || 'completed'}
            </Text>
          </View>
        </View>
        <View style={styles.projectMeta}>
          <View style={[styles.badge, { backgroundColor: '#E8F0FE' }]}>
            <Text style={[styles.badgeText, { color: '#1A73E8' }]}>
              {item.detectedLanguage}
            </Text>
          </View>
          <Text style={styles.vocabCount}>
            {item.vocabulary?.length || 0} vocab
          </Text>
          <Text style={styles.vocabCount}>
            {item.grammar?.length || 0} grammar
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
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
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredProjects.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching projects' : 'No saved projects'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try a different search term'
              : 'Process a YouTube video to create your first project'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProject}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Logout Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: '#E5E5EA',
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
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vocabCount: {
    fontSize: 13,
    color: '#8E8E93',
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProjectsScreen;
