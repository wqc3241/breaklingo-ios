import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Search, GraduationCap, Mic, Ellipsis, BookOpen, MessageCircle, FolderOpen } from 'lucide-react-native';
import InputScreen from '../screens/InputScreen';
import StudyScreen from '../screens/StudyScreen';
import PracticeScreen from '../screens/PracticeScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import LearnScreen from '../screens/LearnScreen';
import QuizScreen from '../screens/QuizScreen';
import TalkScreen from '../screens/TalkScreen';
import { colors } from '../lib/theme';

export type MainTabParamList = {
  SearchTab: undefined;
  LearnTab: undefined;
  TalkTab: undefined;
  MoreTab: undefined;
};

export type InputStackParamList = {
  Input: undefined;
};

export type LearnStackParamList = {
  LearnPath: undefined;
  Quiz: { unitId?: string };
};

export type MoreStackParamList = {
  Study: undefined;
  Practice: undefined;
  Projects: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const InputStack = createNativeStackNavigator<InputStackParamList>();
const LearnStack = createNativeStackNavigator<LearnStackParamList>();
const MoreStackNav = createNativeStackNavigator<MoreStackParamList>();

const InputStackScreen = () => (
  <InputStack.Navigator>
    <InputStack.Screen
      name="Input"
      component={InputScreen}
      options={{ title: 'Search Videos' }}
    />
  </InputStack.Navigator>
);

const LearnStackScreen = () => (
  <LearnStack.Navigator>
    <LearnStack.Screen
      name="LearnPath"
      component={LearnScreen}
      options={{ title: 'Learn' }}
    />
    <LearnStack.Screen
      name="Quiz"
      component={QuizScreen}
      options={{ title: 'Quiz', presentation: 'modal' }}
    />
  </LearnStack.Navigator>
);

const MoreStackScreen = () => (
  <MoreStackNav.Navigator>
    <MoreStackNav.Screen name="Study" component={StudyScreen} options={{ title: 'Study' }} />
    <MoreStackNav.Screen name="Practice" component={PracticeScreen} options={{ title: 'Practice' }} />
    <MoreStackNav.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Projects' }} />
  </MoreStackNav.Navigator>
);

export const MainTabs: React.FC = () => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const navRef = useRef<any>(null);

  const closeMenu = () => setShowMoreMenu(false);

  const navigateToMore = (screen: keyof MoreStackParamList) => {
    navRef.current?.navigate('MoreTab', { screen });
    setShowMoreMenu(false);
  };

  return (
    <View style={styles.root}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
        }}
      >
        <Tab.Screen
          name="SearchTab"
          component={InputStackScreen}
          options={{
            headerShown: false,
            tabBarLabel: 'Search',
            tabBarIcon: ({ color, size }) => <Search color={color} size={size - 4} />,
          }}
          listeners={{ tabPress: closeMenu }}
        />
        <Tab.Screen
          name="LearnTab"
          component={LearnStackScreen}
          options={{
            headerShown: false,
            tabBarLabel: 'Learn',
            tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size - 4} />,
          }}
          listeners={{ tabPress: closeMenu }}
        />
        <Tab.Screen
          name="TalkTab"
          component={TalkScreen}
          options={{
            title: 'Talk',
            tabBarIcon: ({ color, size }) => <Mic color={color} size={size - 4} />,
          }}
          listeners={{ tabPress: closeMenu }}
        />
        <Tab.Screen
          name="MoreTab"
          component={MoreStackScreen}
          options={{
            headerShown: false,
            tabBarLabel: 'More',
            tabBarIcon: ({ color, size }) => <Ellipsis color={color} size={size - 4} />,
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navRef.current = navigation;
              setShowMoreMenu(prev => !prev);
            },
          })}
        />
      </Tab.Navigator>

      {showMoreMenu && (
        <>
          <Pressable style={styles.overlay} onPress={closeMenu} />
          <View style={styles.moreMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateToMore('Study')}>
              <BookOpen size={20} color={colors.foreground} />
              <Text style={styles.menuText}>Study</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateToMore('Practice')}>
              <MessageCircle size={20} color={colors.foreground} />
              <Text style={styles.menuText}>Practice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateToMore('Projects')}>
              <FolderOpen size={20} color={colors.foreground} />
              <Text style={styles.menuText}>Projects</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  moreMenu: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: colors.foreground,
  },
});
