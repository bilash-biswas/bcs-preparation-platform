import { apiClient } from "../api";
import {
  Category,
  Subject,
  Question,
  Quiz,
  QuizAttempt,
  LearningRecommendation,
  SmartStudyPlan,
  UserBadge,
  Challenge,
  StudyGroup,
  ExamSimulation,
  AnalyticsData,
  ComparativeAnalysis,
  GamificationDashboard,
  AdaptiveSession,
  AdaptiveResponse,
} from "../../types";

// lib/api/services.ts - Update categoryApi
// lib/api/services.ts - Fixed categoryApi
export const categoryApi = {
  async getCategories(filters: {
    page?: number;
    page_size?: number;
  } = {}): Promise<any> {
    try {
      const params: any = {};

      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;

      const response = await apiClient.get('/categories/', { params });
      console.log("CATEGORY SERVICE - Raw response:", response);
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response)) {
        return {
          categories: response,
          count: response.length,
        };
      } else if (response.results) {
        return {
          categories: response.results,
          pagination: {
            count: response.count,
            current_page: filters.page || 1,
            total_pages: Math.ceil(response.count / (filters.page_size || 20)),
            next: response.next,
            previous: response.previous,
          },
        };
      } else if (response.categories && Array.isArray(response.categories)) {
        return {
          categories: response.categories,
          count: response.count || response.categories.length,
        };
      } else {
        return {
          categories: response,
          count: 0,
        };
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  async getCategoriesWithCounts(filters: {
    page?: number;
    page_size?: number;
  } = {}): Promise<any> {
    try {
      const params: any = {};

      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;

      const response = await apiClient.get('/categories/with_counts/', { params }); // FIXED: Added await
      console.log("CATEGORY SERVICE WITH COUNTS - Raw response:", response);
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response)) {
        return {
          categories: response,
          count: response.length,
        };
      } else if (response.results) {
        return {
          categories: response.results,
          pagination: {
            count: response.count,
            current_page: filters.page || 1,
            total_pages: Math.ceil(response.count / (filters.page_size || 20)),
            next: response.next,
            previous: response.previous,
          },
        };
      } else if (response.categories && Array.isArray(response.categories)) {
        return {
          categories: response.categories,
          count: response.count || response.categories.length,
        };
      } else {
        return {
          categories: response,
          count: 0,
        };
      }
    } catch (error) {
      console.error('Error fetching categories with counts:', error);
      throw error;
    }
  },

  async getCategoryStatistics(): Promise<any> {
    try {
      const response = await apiClient.get('/categories/statistics/');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching category statistics:', error);
      throw error;
    }
  },

  async getCategoryById(categoryId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/categories/${categoryId}/`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  }
};

export const subjectApi = {
  getAll: (params?: any) => apiClient.get<Subject[]>("/subjects/", { params }),
  getById: (id: number) => apiClient.get<Subject>(`/subjects/${id}/`),
};

export const questionApi = {
  getAll: (params?: any) =>
    apiClient.get<Question[]>("/questions/", { params }),
  getById: (id: number) => apiClient.get<Question>(`/questions/${id}/`),
};

export const quizApi = {
  getAll: () => apiClient.get<Quiz[]>("/quizzes/"),
  getAvailable: () => apiClient.get("/quizzes/available/"),
  startQuiz: (quizId: number) =>
    apiClient.post("/quizzes/start/", { quiz: quizId }),
  getQuestions: (quizId: number) =>
    apiClient.get(`/quizzes/${quizId}/questions/`),
  getById: (id: number) => apiClient.get<Quiz>(`/quizzes/${id}/`),
};

export const quizAttemptApi = {
  getAll: () => apiClient.get<QuizAttempt[]>("/attempts/"),
  getById: (id: number) => apiClient.get<QuizAttempt>(`/attempts/${id}/`),
  submitAnswer: (attemptId: number, data: any) =>
    apiClient.post(`/attempts/${attemptId}/submit_answer/`, data),
  completeAttempt: (attemptId: number) =>
    apiClient.post(`/attempts/${attemptId}/complete_attempt/`),
  getRecent: () => apiClient.get("/attempts/recent/"),
};

// Extended Features API Services
export const analyticsApi = {
  getLearningInsights: () =>
    apiClient.get<AnalyticsData>("/advanced-analytics/learning_insights/"),
  getComparativeAnalysis: () =>
    apiClient.get<ComparativeAnalysis>(
      "/advanced-analytics/comparative_analysis/"
    ),
};

export const recommendationApi = {
  getAll: () => apiClient.get<LearningRecommendation[]>("/recommendations/"),
  generate: () =>
    apiClient.post<LearningRecommendation[]>(
      "/recommendations/generate_recommendations/"
    ),
  markCompleted: (id: number) =>
    apiClient.post(`/recommendations/${id}/mark_completed/`),
};

export const studyPlanApi = {
  getAll: () => apiClient.get<SmartStudyPlan[]>("/study-plans/"),
  create: (data: any) => apiClient.post<SmartStudyPlan>("/study-plans/", data),
  generateSchedule: (id: number) =>
    apiClient.post(`/study-plans/${id}/generate_schedule/`),
  getProgress: (id: number) => apiClient.get(`/study-plans/${id}/progress/`),
};

export const gamificationApi = {
  getDashboard: () =>
    apiClient.get<GamificationDashboard>("/gamification/dashboard/"),
  getChallenges: () => apiClient.get<Challenge[]>("/gamification/challenges/"),
  joinChallenge: (challengeId: number) =>
    apiClient.post(`/gamification/challenges/${challengeId}/join/`),
  claimReward: (challengeId: number) =>
    apiClient.post(`/gamification/challenges/${challengeId}/claim_reward/`),
};

export const studyGroupApi = {
  getAll: () => apiClient.get<StudyGroup[]>("/study-groups/"),
  create: (data: any) => apiClient.post<StudyGroup>("/study-groups/", data),
  join: (id: number) => apiClient.post(`/study-groups/${id}/join/`),
  getActivities: (id: number) =>
    apiClient.get(`/study-groups/${id}/activities/`),
  leave: (id: number) => apiClient.post(`/study-groups/${id}/leave/`),
};

export const adaptiveLearningApi = {
  startSession: (data: { subjectId: number; questionCount: number }) =>
    apiClient.post<AdaptiveSession>("/adaptive/start-session/", data),

  getNextQuestion: (data: any) =>
    apiClient.post<AdaptiveResponse>("/adaptive/next-question/", data),

  submitAnswer: (data: any) =>
    apiClient.post<AdaptiveResponse>("/adaptive/submit-answer/", data),
};

// lib/api/services.ts - Update examSimulationApi
export const examSimulationApi = {
  getAll: () => apiClient.get<any>("/exam-simulations/"),
  create: (data: any) => {
    console.log("API Service - Creating exam with:", data);

    const backendData = {
      name: data.name,
      subjects: data.subjects,
      duration: data.duration,
      total_questions: data.total_questions,
      strict_timing: data.strict_timing,
      show_results_after: data.show_results_after,
      question_breakdown: data.question_breakdown || {
        easy: 30,
        medium: 50,
        hard: 20,
      },
    };

    console.log("Final data for Django:", backendData);
    return apiClient.post<ExamSimulation>("/exam-simulations/", backendData);
  },
  startSimulation: (id: number) =>
    apiClient.post(`/exam-simulations/${id}/start_simulation/`),
  getQuestions: (id: number) =>  // ADD THIS
    apiClient.get(`/exam-simulations/${id}/questions/`),
  getAnalysis: (id: number) =>
    apiClient.get(`/exam-simulations/${id}/analysis/`),
  submitAnswer: (examId: number, data: any) =>
    apiClient.post(`/exam-simulations/${examId}/submit_answer/`, data),
  completeExam: (examId: number) =>
    apiClient.post(`/exam-simulations/${examId}/complete/`),
};

export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post("/auth/login/", credentials),
  register: (userData: any) => apiClient.post("/auth/register/", userData),
  logout: () => apiClient.post("/auth/logout/"),
  refreshToken: (refresh: string) =>
    apiClient.post("/auth/token/refresh/", { refresh }),
  getProfile: () => apiClient.get("/auth/profile/"),
};


export const battleAPI = {
  createBattle: (data: any) => apiClient.post('/battles/', data),
  createQuickBattle: () => apiClient.post('/battles/create_quick/'),
  joinBattle: (battleCode: string) => apiClient.post('/battles/join/', { battle_code: battleCode }),
  getAvailableBattles: () => apiClient.get('/battles/available/'),
  getActiveBattles: () => apiClient.get('/battles/active/'),
  markReady: (battleId: number) => apiClient.post(`/battles/${battleId}/ready/`),
  submitAnswer: (battleId: number, answer: any) => 
    apiClient.post(`/battles/${battleId}/submit_answer/`, answer),
  getBattle: (battleId: number) => apiClient.get(`/battles/${battleId}/`),
};
