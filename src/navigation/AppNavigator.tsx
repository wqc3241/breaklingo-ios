import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ProjectProvider } from '../context/ProjectContext';
import { OnboardingGuide } from '../components/common/OnboardingGuide';

export const AppNavigator: React.FC = () => {
  const { session, user, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8550C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <ProjectProvider user={user}>
          <MainTabs />
          <OnboardingGuide />
        </ProjectProvider>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
