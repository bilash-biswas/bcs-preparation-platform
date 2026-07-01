import api from './api';
import { Question } from '../types';

class QuestionService {
  async getQuestions(
    filters: {
      page?: number;
      page_size?: number;
      subject?: string;
      difficulty?: string;
      search?: string;
    } = {},
  ): Promise<Question[] | any> {
    try {
      const params: any = {};

      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;
      if (filters.subject && filters.subject !== 'all')
        params.subject = filters.subject;
      if (filters.difficulty && filters.difficulty !== 'all')
        params.difficulty = filters.difficulty;
      if (filters.search) params.search = filters.search;

      const response = await api.get('/questions/', { params });

      if (Array.isArray(response.data)) {
        return {
          questions: response.data,
          count: response.data.length,
        };
      } else if (response.data.results) {
        return {
          questions: response.data.results,
          pagination: {
            count: response.data.count,
            current_page: filters.page || 1,
            total_pages: Math.ceil(
              response.data.count / (filters.page_size || 20),
            ),
            next: response.data.next,
            previous: response.data.previous,
          },
        };
      } else {
        return {
          questions: [],
          count: 0,
        };
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  async getQuestionById(questionId: number): Promise<Question> {
    try {
      const response = await api.get(`/questions/${questionId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  }

  async getQuestionsBySubject(subjectId: number): Promise<Question[]> {
    try {
      const response = await api.get('/questions/', {
        params: { subject: subjectId },
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
    } catch (error) {
      console.error('Error fetching questions by subject:', error);
      throw error;
    }
  }

  async getQuestionsByDifficulty(difficulty: string): Promise<Question[]> {
    try {
      const response = await api.get('/questions/', {
        params: { difficulty },
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
    } catch (error) {
      console.error('Error fetching questions by difficulty:', error);
      throw error;
    }
  }
}

export default new QuestionService();
