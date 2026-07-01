// src/services/quizService.ts
import api from './api';
import { Quiz, QuizAttempt, Question, Category, Subject } from '../types';

class QuizService {
  async getQuizzes(): Promise<Quiz[]> {
    const response = await api.get('/quizzes/');
    return response.data;
  }

  async getAvailableQuizzes(): Promise<Quiz[]> {
    const response = await api.get('/quizzes/available/');
    return response.data;
  }

  async getQuizById(id: number): Promise<Quiz> {
    const response = await api.get(`/quizzes/${id}/`);
    return response.data;
  }

  async startQuiz(quizId: number): Promise<{ quiz_attempt_id: number; message: string }> {
    const response = await api.post('/quizzes/start/', { quiz: quizId });
    return response.data;
  }

  async getQuizQuestions(quizId: number): Promise<Question[]> {
    const response = await api.get(`/quizzes/${quizId}/questions/`);
    return response.data;
  }

  async submitAnswer(
    attemptId: number,
    questionId: number,
    selectedOptions: number[]
  ): Promise<{ is_correct: boolean; marks_obtained: number; correct_options: number[] }> {
    const response = await api.post(`/attempts/${attemptId}/submit_answer/`, {
      question_id: questionId,
      selected_options: selectedOptions,
    });
    return response.data;
  }

  async completeAttempt(attemptId: number): Promise<QuizAttempt> {
    const response = await api.post(`/attempts/${attemptId}/complete_attempt/`);
    return response.data;
  }

  async getQuizAttempts(): Promise<QuizAttempt[]> {
    const response = await api.get('/attempts/attempts/');
    return response.data;
  }

  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories/with_counts/');
    return response.data;
  }

  async getSubjects(categoryId?: number): Promise<Subject[]> {
    const params = categoryId ? { category_id: categoryId } : {};
    const response = await api.get('/subjects/', { params });
    return response.data;
  }
}

export default new QuizService();