// src/services/practiceService.ts
import api from './api';
import { PracticeSession, Subject } from '../types';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CreateSessionData {
  subjects: number[];
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  question_count: number;
}

class PracticeService {
  private readonly PRACTICE_CACHE_PREFIX = 'practice_cache_';
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private readonly OFFLINE_ANSWERS_KEY = 'offline_practice_answers';
  private readonly CURRENT_SESSION_KEY = 'current_practice_session';

  private async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > this.CACHE_DURATION;

      return isExpired ? null : data;
    } catch (error) {
      console.log('Practice cache read error:', error);
      return null;
    }
  }

  private async setCachedData(key: string, data: any): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.log('Practice cache write error:', error);
    }
  }

  async createSession(
    sessionData: CreateSessionData,
  ): Promise<PracticeSession> {
    try {
      const response = await api.post(
        '/practice-sessions/create_session/',
        sessionData,
      );
      const session = response.data;

      // Store current session for offline capability
      await this.storeCurrentSession(session);

      return session;
    } catch (error: any) {
      // If offline, create a local session
      const isOnline = await this.isOnline();
      if (!isOnline) {
        return await this.createOfflineSession(sessionData);
      }
      throw error;
    }
  }

  private async createOfflineSession(
    sessionData: CreateSessionData,
  ): Promise<PracticeSession> {
    const offlineSession: PracticeSession = {
      id: Date.now(), // Temporary ID for offline sessions
      session_questions: [],
      total_questions: sessionData.question_count,
      completed_questions: 0,
      correct_answers: 0,
      accuracy: 0,
      wrong_answers: 0,
      score: 0,
      is_completed: false,
      started_at: new Date().toISOString(),
      completed_at: '',
      time_taken: '',
      difficulty: sessionData.difficulty,
      session_type: 'practice',
      duration_minutes: 0,
      subject_names: [],
      subjects: [],
      user: 0,
    };

    await this.storeCurrentSession(offlineSession);
    return offlineSession;
  }

  private async storeCurrentSession(session: PracticeSession): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.CURRENT_SESSION_KEY,
        JSON.stringify(session),
      );
    } catch (error) {
      console.log('Failed to store current session:', error);
    }
  }

  async getCurrentSession(): Promise<PracticeSession | null> {
    try {
      const session = await AsyncStorage.getItem(this.CURRENT_SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.log('Failed to get current session:', error);
      return null;
    }
  }

  // In practiceService.ts - Add better error handling
  async submitAnswer(
    sessionId: number,
    questionId: number,
    selectedOptionId: number,
    timeTaken?: number,
  ): Promise<{
    is_correct: boolean;
    session_stats: {
      completed_questions: number;
      correct_answers: number;
      wrong_answers: number;
    };
  }> {
    try {
      // Validate inputs
      if (!sessionId || !questionId || !selectedOptionId) {
        throw new Error('Invalid input parameters');
      }

      const response = await api.post(
        `/practice-sessions/${sessionId}/submit_answer/`,
        {
          question_id: questionId,
          selected_option: selectedOptionId,
          time_taken: timeTaken,
        },
      );

      // Validate response
      if (!response.data || typeof response.data.is_correct !== 'boolean') {
        throw new Error('Invalid response from server');
      }

      await this.updateLocalSession(
        sessionId,
        questionId,
        selectedOptionId,
        response.data.is_correct,
      );

      return response.data;
    } catch (error: any) {
      const isOnline = await this.isOnline();

      if (!isOnline) {
        console.log('Offline mode: Storing answer locally');
        await this.storeOfflineAnswer(
          sessionId,
          questionId,
          selectedOptionId,
          timeTaken,
        );

        // For offline mode, we can't determine correctness, so we'll assume incorrect
        // and let the sync process handle it later
        return {
          is_correct: false,
          session_stats: {
            completed_questions: 0,
            correct_answers: 0,
            wrong_answers: 0,
          },
        };
      }

      console.error('Submit answer error:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to submit answer',
      );
    }
  }

  private async updateLocalSession(
    sessionId: number,
    questionId: number,
    selectedOptionId: number,
    isCorrect: boolean,
  ): Promise<void> {
    try {
      const currentSession = await this.getCurrentSession();
      if (currentSession && currentSession.id === sessionId) {
        // Update session stats
        currentSession.completed_questions += 1;
        if (isCorrect) {
          currentSession.correct_answers += 1;
        } else {
          currentSession.wrong_answers += 1;
        }
        currentSession.score =
          currentSession.completed_questions > 0
            ? (currentSession.correct_answers /
                currentSession.completed_questions) *
              100
            : 0;

        // Also update the options chosen locally in session_questions
        if (Array.isArray(currentSession.session_questions)) {
          const sqIndex = currentSession.session_questions.findIndex((sq: any) => {
            const q = sq.question_details || sq;
            const qId = q.question || q.id;
            return qId === questionId || sq.question === questionId;
          });
          if (sqIndex !== -1) {
            currentSession.session_questions[sqIndex].user_answer = selectedOptionId;
            currentSession.session_questions[sqIndex].is_correct = isCorrect;
          }
        }

        await this.storeCurrentSession(currentSession);

        // Update session detail cache key as well
        const cacheKey = `${this.PRACTICE_CACHE_PREFIX}session_${sessionId}`;
        await this.setCachedData(cacheKey, currentSession);
      }
    } catch (error) {
      console.log('Failed to update local session:', error);
    }
  }

  private async storeOfflineAnswer(
    sessionId: number,
    questionId: number,
    selectedOptionId: number,
    timeTaken?: number,
  ): Promise<void> {
    try {
      const offlineAnswers = await this.getOfflineAnswers();
      offlineAnswers.push({
        sessionId,
        questionId,
        selectedOptionId,
        timeTaken,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem(
        this.OFFLINE_ANSWERS_KEY,
        JSON.stringify(offlineAnswers),
      );
    } catch (error) {
      console.log('Failed to store offline answer:', error);
    }
  }

  private async getOfflineAnswers(): Promise<any[]> {
    try {
      const answers = await AsyncStorage.getItem(this.OFFLINE_ANSWERS_KEY);
      return answers ? JSON.parse(answers) : [];
    } catch (error) {
      return [];
    }
  }

  async syncOfflineAnswers(): Promise<void> {
    try {
      const offlineAnswers = await this.getOfflineAnswers();
      if (offlineAnswers.length === 0) return;

      const successfulSyncs: any = [];

      for (const answer of offlineAnswers) {
        try {
          await this.submitAnswer(
            answer.sessionId,
            answer.questionId,
            answer.selectedOptionId,
            answer.timeTaken,
          );
          successfulSyncs.push(answer);
        } catch (error) {
          console.log('Failed to sync answer:', error);
          // Continue with other answers
        }
      }

      // Remove successfully synced answers
      const remainingAnswers = offlineAnswers.filter(
        answer => !successfulSyncs.includes(answer),
      );
      await AsyncStorage.setItem(
        this.OFFLINE_ANSWERS_KEY,
        JSON.stringify(remainingAnswers),
      );
    } catch (error) {
      console.log('Failed to sync offline answers:', error);
    }
  }

  async completeSession(
    sessionId: number,
    totalTimeTaken: number,
  ): Promise<PracticeSession> {
    try {
      const response = await api.post(
        `/practice-sessions/${sessionId}/complete_session/`,
        {
          total_time_taken: totalTimeTaken,
        },
      );

      // Clear current session
      await AsyncStorage.removeItem(this.CURRENT_SESSION_KEY);

      // Clear the session detail cache key so next fetch retrieves fresh completed stats
      const cacheKey = `${this.PRACTICE_CACHE_PREFIX}session_${sessionId}`;
      await AsyncStorage.removeItem(cacheKey);

      return response.data;
    } catch (error: any) {
      // If offline, complete session locally
      const isOnline = await this.isOnline();
      if (!isOnline) {
        const currentSession = await this.getCurrentSession();
        if (currentSession && currentSession.id === sessionId) {
          currentSession.is_completed = true;
          currentSession.completed_at = new Date().toISOString();
          currentSession.time_taken = totalTimeTaken.toString();

          await AsyncStorage.removeItem(this.CURRENT_SESSION_KEY);
          return currentSession;
        }
      }
      throw error;
    }
  }

  async getUserSessions(): Promise<PracticeSession[]> {
    const cacheKey = `${this.PRACTICE_CACHE_PREFIX}user_sessions`;

    try {
      const cached = await this.getCachedData<PracticeSession[]>(cacheKey);
      if (cached) return cached;

      const response = await api.get('/practice-sessions/user_sessions/');
      await this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      const isOnline = await this.isOnline();
      if (!isOnline) {
        const cached = await this.getCachedData<PracticeSession[]>(cacheKey);
        if (cached) return cached;
      }
      throw error;
    }
  }

  // In practiceService.ts - Fix getSessionDetail method
  async getSessionDetail(sessionId: number): Promise<PracticeSession> {
    const cacheKey = `${this.PRACTICE_CACHE_PREFIX}session_${sessionId}`;

    try {
      const cached = await this.getCachedData<PracticeSession>(cacheKey);
      if (cached) return cached;

      // FIX: Use proper endpoint with session ID
      const response = await api.get(`/practice-sessions/${sessionId}/`);

      await this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      const isOnline = await this.isOnline();
      if (!isOnline) {
        const cached = await this.getCachedData<PracticeSession>(cacheKey);
        if (cached) return cached;
      }
      throw error;
    }
  }

  async getSubjects(): Promise<Subject[]> {
    const cacheKey = `${this.PRACTICE_CACHE_PREFIX}subjects`;

    try {
      const cached = await this.getCachedData<Subject[]>(cacheKey);
      if (cached) return cached;

      const response = await api.get('/practice-sessions/subjects/');
      await this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      const isOnline = await this.isOnline();
      if (!isOnline) {
        const cached = await this.getCachedData<Subject[]>(cacheKey);
        if (cached) return cached;
      }
      throw error;
    }
  }

  // Clear all cached practice data
  async clearPracticeCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const practiceKeys = keys.filter(key =>
        key.startsWith(this.PRACTICE_CACHE_PREFIX),
      );
      practiceKeys.push(this.CURRENT_SESSION_KEY, this.OFFLINE_ANSWERS_KEY);
      await AsyncStorage.multiRemove(practiceKeys);
    } catch (error) {
      console.log('Failed to clear practice cache:', error);
    }
  }

  // Get offline answers count
  async getOfflineAnswersCount(): Promise<number> {
    const answers = await this.getOfflineAnswers();
    return answers.length;
  }
}

export default new PracticeService();
