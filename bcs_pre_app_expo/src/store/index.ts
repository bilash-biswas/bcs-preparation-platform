import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

import authReducer from './slices/authSlice';
import quizReducer from './slices/quizSlice';
import practiceReducer from './slices/practiceSlice';
import discussionReducer from './slices/discussionSlice';
import categoryReducer from './slices/categorySlice';
import subjectReducer from './slices/subjectSlice';
import questionReducer from './slices/questionSlice';
import leaderboardReducer from './slices/leaderboardSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth state
  blacklist: ['practice', 'discussion', 'quiz', 'category', 'subject', 'question', 'leaderboard'], // Don't persist these
};

const rootReducer = combineReducers({
  auth: authReducer,
  quiz: quizReducer,
  practice: practiceReducer,
  discussion: discussionReducer,
  category: categoryReducer,
  subject: subjectReducer,
  question: questionReducer,
  leaderboard: leaderboardReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;