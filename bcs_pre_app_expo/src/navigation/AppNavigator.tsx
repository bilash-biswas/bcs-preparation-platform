// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

// Screen imports
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import SubjectsScreen from '../screens/subjects/SubjectsScreen';
import PracticeScreen from '../screens/practice/PracticeScreen';
import QuizzesScreen from '../screens/quizzes/QuizzesScreen';
import QuestionsScreen from '../screens/questions/QuestionsScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import DiscussionsScreen from '../screens/discussions/DiscussionsScreen';
import DashboardScreen from '../screens/user/DashboardScreen';
import PracticeHistoryScreen from '../screens/user/PracticeHistoryScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import ChangePasswordScreen from '../screens/user/ChangePasswordScreen';
import ProgressScreen from '../screens/user/ProgressScreen';
import PracticeSessionScreen from '../screens/practice/PracticeSessionScreen';
import PracticeResultsScreen from '../screens/practice/PracticeResultsScreen';
import PracticeAnalysisScreen from '../screens/practice/PracticeAnalysisScreen';
import AllAnswersAnalysisScreen from '../screens/practice/AllAnswersAnalysisScreen';
import EditProfileScreen from '../screens/user/EditProfileScreen';
import SubscriptionScreen from '../screens/user/SubscriptionScreen';

import { QuizSessionScreen } from '../screens/quizzes/QuizSessionScreen';
import { QuizResultsScreen } from '../screens/quizzes/QuizResultsScreen';

// --- TYPE DEFINITIONS ---

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: {
    screen?: keyof MainStackParamList;
    params?: any;
  };
};

export type MainStackParamList = {
  TabNavigator: {
    screen?: keyof TabParamList;
    params?: any;
  };
  PracticeSession: { sessionId: number };
  PracticeResults: { sessionId: number };
  Dashboard: undefined;
  PracticeHistory: undefined;
  PracticeAnalysis: undefined;
  AllAnswerAnalysis: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  Progress: undefined;
  Practice: { subjectId?: number } | undefined;
  Categories: undefined;
  Subjects: { categoryId?: number; categoryName?: string } | undefined;
  Quizzes: undefined;
  Questions: { subjectId?: number } | undefined;
  EditProfile: undefined;
  Subscription: undefined;
  QuizSession: { attemptId: number; quizId: number };
  QuizResults: { attemptId: number; quizId: number };
};

export type TabParamList = {
  Home: undefined;
  PracticeTab: { subjectId?: number } | undefined;
  Leaderboard: undefined;
  Discussions: undefined;
  ProfileTab: undefined;
};

// --- NAVIGATOR INSTANCES ---

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Auth = createNativeStackNavigator<AuthStackParamList>();

// --- NAVIGATOR COMPONENTS ---

const TabNavigator = () => {
  const { isDark } = useAppTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = '';
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'PracticeTab') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Leaderboard') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Discussions') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Icon name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#94a3b8',
        tabBarStyle: {
          height: 78,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
          paddingBottom: 18,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.35 : 0.04,
          shadowRadius: 10,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: 'NotoSansBengali',
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'হোম' }} />
      <Tab.Screen name="PracticeTab" component={PracticeScreen} options={{ tabBarLabel: 'প্র্যাকটিস' }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ tabBarLabel: 'লিডারবোর্ড' }} />
      <Tab.Screen name="Discussions" component={DiscussionsScreen} options={{ tabBarLabel: 'আলোচনা' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'প্রোফাইল' }} />
    </Tab.Navigator>
  );
};

const MainStackNavigator = () => {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="TabNavigator" component={TabNavigator} />
      <MainStack.Screen name="Dashboard" component={DashboardScreen} />
      <MainStack.Screen name="PracticeHistory" component={PracticeHistoryScreen} />
      <MainStack.Screen name="AllAnswerAnalysis" component={AllAnswersAnalysisScreen} />
      <MainStack.Screen name="PracticeAnalysis" component={PracticeAnalysisScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <MainStack.Screen name="Progress" component={ProgressScreen} />
      <MainStack.Screen name="Practice" component={PracticeScreen} />
      <MainStack.Screen name="PracticeSession" component={PracticeSessionScreen} />
      <MainStack.Screen name="PracticeResults" component={PracticeResultsScreen} />
      <MainStack.Screen name="Categories" component={CategoriesScreen} />
      <MainStack.Screen name="Subjects" component={SubjectsScreen} />
      <MainStack.Screen name="Quizzes" component={QuizzesScreen} />
      <MainStack.Screen name="Questions" component={QuestionsScreen} />
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MainStack.Screen name="Subscription" component={SubscriptionScreen} />
      <MainStack.Screen name="QuizSession" component={QuizSessionScreen} />
      <MainStack.Screen name="QuizResults" component={QuizResultsScreen} />
    </MainStack.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login" component={LoginScreen} />
      <Auth.Screen name="Register" component={RegisterScreen} />
    </Auth.Navigator>
  );
};

// --- ROOT NAVIGATOR ---

const AppNavigator = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const hasSeenOnboarding = useSelector((state: RootState) => state.auth.hasSeenOnboarding);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!hasSeenOnboarding ? (
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthStack} />
      ) : (
        <RootStack.Screen name="Main" component={MainStackNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;