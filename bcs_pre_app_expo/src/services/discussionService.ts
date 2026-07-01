import api from './api';
import { Discussion } from '../types';

class DiscussionService {
  async getDiscussions(): Promise<Discussion[]> {
    const response = await api.get('/discussions/');
    return response.data;
  }

  async getPopularDiscussions(): Promise<Discussion[]> {
    const response = await api.get('/discussions/popular/');
    return response.data;
  }

  async getBookmarkedDiscussions(): Promise<Discussion[]> {
    const response = await api.get('/discussions/bookmarks/');
    return response.data;
  }

  async getDiscussionById(discussionId: number): Promise<Discussion> {
    const response = await api.get(`/discussions/${discussionId}/`);
    return response.data;
  }

  async createDiscussion(title: string, comment: string, parent?: number): Promise<Discussion> {
    const response = await api.post('/discussions/', {
      title,
      comment,
      parent,
    });
    return response.data;
  }

  async likeDiscussion(discussionId: number): Promise<{
    liked: boolean;
    likes_count: number;
    dislikes_count: number;
  }> {
    const response = await api.post(`/discussions/${discussionId}/like/`);
    return response.data;
  }

  async dislikeDiscussion(discussionId: number): Promise<{
    disliked: boolean;
    likes_count: number;
    dislikes_count: number;
  }> {
    const response = await api.post(`/discussions/${discussionId}/dislike/`);
    return response.data;
  }

  async bookmarkDiscussion(discussionId: number): Promise<{
    bookmarked: boolean;
    bookmarks_count: number;
  }> {
    const response = await api.post(`/discussions/${discussionId}/bookmark/`);
    return response.data;
  }

  async addReply(parentId: number, comment: string): Promise<Discussion> {
    const response = await api.post(`/discussions/${parentId}/reply/`, {
      comment,
    });
    return response.data;
  }
}

export default new DiscussionService();