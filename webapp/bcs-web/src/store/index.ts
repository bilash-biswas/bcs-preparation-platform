import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import categorySlice from "./slices/categorySlice";
import subjectSlice from "./slices/subjectSlice";
import quizSlice from "./slices/quizSlice";
import recommendationSlice from "./slices/recommendationSlice";
import studyPlanSlice from "./slices/studyPlanSlice";
import gamificationSlice from "./slices/gamificationSlice";
import studyGroupSlice from "./slices/studyGroupSlice";
import analyticsSlice from "./slices/analyticsSlice";
import questionSlice from "./slices/questionSlice";
import examSimulationSlice from "./slices/examSimulationSlice";
import adaptiveLearningSlice from "./slices/adaptiveLearningSlice";
import battleReducer from "./slices/battleSlice";
import websocketReducer from "./slices/websocketSlice";


export const store = configureStore({
  reducer: {
    auth: authSlice,
    categories: categorySlice,
    subjects: subjectSlice,
    questions: questionSlice,
    quizzes: quizSlice,
    analytics: analyticsSlice,
    recommendations: recommendationSlice,
    studyPlans: studyPlanSlice,
    gamification: gamificationSlice,
    studyGroups: studyGroupSlice,
    examSimulations: examSimulationSlice,
    adaptiveLearning: adaptiveLearningSlice,
    battle: battleReducer,
    websocket: websocketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
