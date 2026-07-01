// AppNavigator.tsx - CORRECTED VERSION
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Icon from 'react-native-vector-icons/Ionicons';

// Screen imports remain the same...
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

// --- TYPE DEFINITIONS ---

// 1. Define a separate param list for the authentication flow
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// 2. Clean up RootStackParamList
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined; // This screen will render the entire AuthStack
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
  Practice: undefined;
  ChangePassword: undefined;
  Progress: undefined;
};

export type TabParamList = {
  Home: undefined;
  Categories: undefined;
  Subjects: { categoryId?: number, categoryName?: string};
  Practice: undefined;
  Quizzes: undefined;
  Questions: undefined;
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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Categories') iconName = focused ? 'folder' : 'folder-outline';
          else if (route.name === 'Subjects') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Practice') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Quizzes') iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Questions') iconName = focused ? 'help-circle' : 'help-circle-outline';
          else if (route.name === 'Leaderboard') iconName = focused ? 'trophy' : 'trophy-outline';
          else if (route.name === 'Discussions') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        headerShown: false,
      })}
    >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'হোম' }} />
        <Tab.Screen name="Categories" component={CategoriesScreen} options={{ tabBarLabel: 'ক্যাটাগরি' }} />
        <Tab.Screen name="Subjects" component={SubjectsScreen} options={{ tabBarLabel: 'বিষয়সমূহ' }} />
        <Tab.Screen name="Practice" component={PracticeScreen} options={{ tabBarLabel: 'প্র্যাকটিস' }} />
        <Tab.Screen name="Quizzes" component={QuizzesScreen} options={{ tabBarLabel: 'কুইজ' }} />
        <Tab.Screen name="Questions" component={QuestionsScreen} options={{ tabBarLabel: 'প্রশ্নব্যাংক' }} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ tabBarLabel: 'লিডারবোর্ড' }} />
        <Tab.Screen name="Discussions" component={DiscussionsScreen} options={{ tabBarLabel: 'আলোচনা' }} />
        <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'প্রোফাইল' }} />
    </Tab.Navigator>
  );
};

const MainStackNavigator = () => {
  // This component remains unchanged
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
    </MainStack.Navigator>
  );
};

// 4. Update AuthStack to use the new `Auth` navigator
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