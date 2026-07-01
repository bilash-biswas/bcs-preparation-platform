import api from './api';
import { Category } from '../types';

class CategoryService {
  async getCategories(filters: {
    page?: number;
    page_size?: number;
  } = {}): Promise<any> {
    try {
      const params: any = {};

      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;

      const response = await api.get('/categories/', { params });
      console.log("CATEGORY SERVICE", response.data);
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response.data)) {
        return {
          categories: response.data,
          count: response.data.length,
        };
      } else if (response.data.results) {
        return {
          categories: response.data.results,
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
          categories: response.data,
          count: 0,
        };
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getCategoriesWithCounts(filters: {
    page?: number;
    page_size?: number;
  } = {}): Promise<any> {
    try {
      const params: any = {};

      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;

      const response = await api.get('/categories/with_counts/', { params });
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response.data)) {
        return {
          categories: response.data,
          count: response.data.length,
        };
      } else if (response.data.results) {
        return {
          categories: response.data.results,
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
          categories: response.data,
          count: 0,
        };
      }
    } catch (error) {
      console.error('Error fetching categories with counts:', error);
      throw error;
    }
  }

  async getCategoryStatistics(): Promise<any> {
    const response = await api.get('/categories/statistics/');
    return response.data;
  }

  async getCategoryById(categoryId: number): Promise<Category> {
    const response = await api.get(`/categories/${categoryId}/`);
    return response.data;
  }

  async createCategory(categoryData: {
    name: string;
    description: string;
    icon?: string;
    color?: string;
  }): Promise<Category> {
    const response = await api.post('/categories/', categoryData);
    return response.data;
  }

  async updateCategory(categoryId: number, categoryData: Partial<Category>): Promise<Category> {
    const response = await api.patch(`/categories/${categoryId}/`, categoryData);
    return response.data;
  }

  async deleteCategory(categoryId: number): Promise<void> {
    await api.delete(`/categories/${categoryId}/`);
  }
}

export default new CategoryService();