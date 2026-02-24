import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InputScreen from '../screens/InputScreen';
import StudyScreen from '../screens/StudyScreen';
import PracticeScreen from '../screens/PracticeScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import QuizScreen from '../screens/QuizScreen';

// Tab icons as simple text (we'll use SF Symbols via system)
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Input: '🔗',
    Study: '📖',
    Practice: '💬',
    Projects: '📁',
  };
  return null; // We use tabBarIcon with system icons below
};

export type MainTabParamList = {
  InputTab: undefined;
  StudyTab: undefined;
  PracticeTab: undefined;
  ProjectsTab: undefined;
};

export type InputStackParamList = {
  Input: undefined;
  Quiz: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const InputStack = createNativeStackNavigator<InputStackParamList>();

const InputStackScreen = () => (
  <InputStack.Navigator>
    <InputStack.Screen
      name="Input"
      component={InputScreen}
      options={{ title: 'Add Video' }}
    />
    <InputStack.Screen
      name="Quiz"
      component={QuizScreen}
      options={{ title: 'Quiz', presentation: 'modal' }}
    />
  </InputStack.Navigator>
);

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#F2F2F7',
          borderTopColor: '#C6C6C8',
        },
        headerStyle: {
          backgroundColor: '#F2F2F7',
        },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="InputTab"
        component={InputStackScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Input',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="link" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="StudyTab"
        component={StudyScreen}
        options={{
          title: 'Study',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="book" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PracticeTab"
        component={PracticeScreen}
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="chat" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsScreen}
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="folder" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Simple text-based tab bar icon component
import { Text } from 'react-native';

const TabBarIcon = ({ name, color, size }: { name: string; color: string; size: number }) => {
  const iconMap: Record<string, string> = {
    link: '🔗',
    book: '📖',
    chat: '💬',
    folder: '📁',
  };
  return (
    <Text style={{ fontSize: size - 4, color }}>
      {iconMap[name] || '•'}
    </Text>
  );
};
