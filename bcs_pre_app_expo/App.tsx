// App.tsx - FIXED VERSION
import React, { useEffect } from 'react';
import './global.css';
import { Provider, useDispatch } from 'react-redux';
import { AppDispatch, persistor, store } from './src/store';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar, View, StyleSheet } from 'react-native';
import { initializeAuth } from './src/store/slices/authSlice';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import SplashScreen from './src/components/common/SplashScreen';

const AuthInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);
  return null;
};

const AppStatusBar = () => {
  const { isDark } = useAppTheme();
  return (
    <StatusBar
      barStyle={isDark ? "light-content" : "dark-content"}
      backgroundColor={isDark ? "#0f172a" : "#f8fafc"}
      translucent
    />
  );
};

const AppContent = () => {
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Show splash screen for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AuthInitializer />
      <AppStatusBar />
      <View style={{ flex: 1 }}>
        <AppNavigator />
      </View>
      {showSplash && (
        <View style={{ ...StyleSheet.absoluteFill, zIndex: 9999 }}>
          <SplashScreen />
        </View>
      )}
    </>
  );
};

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <AppContent />
            </ThemeProvider>
          </PersistGate>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
