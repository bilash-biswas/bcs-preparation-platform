import api from './api';
import { Subject } from '../types';

class SubjectService {
  async getSubjects(filters: {
    page?: number;
    page_size?: number;
    category_id?: number;
  } = {}): Promise<any> {
    try {
      const params: any = {};

      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;
      if (filters.category_id) params.category_id = filters.category_id;

      const response = await api.get('/subjects/', { params });
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response.data)) {
        return {
          subjects: response.data,
          count: response.data.length,
        };
      } else if (response.data.results) {
        return {
          subjects: response.data.results,
          pagination: {
            count: response.data.count,
            current_page: filters.page || 1,
            total_pages: Math.ceil(response.data.count / (filters.page_size || 20)),
            next: response.data.next,
            previous: response.data.previous,
          },
        };
      } else {
        return {
          subjects: response.data,
          count: 0,
        };
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  }

  async getSubjectsByCategory(categoryId: number, page?: number, pageSize?: number): Promise<any> {
    return this.getSubjects({
      category_id: categoryId,
      page,
      page_size: pageSize,
    });
  }

  async getSubjectById(subjectId: number): Promise<Subject> {
    const response = await api.get(`/subjects/${subjectId}/`);
    return response.data;
  }

  async getSubjectWithDetails(subjectId: number): Promise<Subject> {
    const response = await api.get(`/subjects/${subjectId}/`);
    return response.data;
  }
}

export default new SubjectService();