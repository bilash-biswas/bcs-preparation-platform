// App.tsx - FIXED VERSION
import React, { useEffect } from 'react';
import './global.css';
import { Provider, useDispatch } from 'react-redux';
import { AppDispatch, persistor, store } from './src/store';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { initializeAuth } from './src/store/slices/authSlice';
import { NavigationContainer } from '@react-navigation/native';

const AuthInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);
  return null;
};

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar
              barStyle="dark-content"
              backgroundColor="#ff7878"
              translucent
            />
            <AuthInitializer />
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
