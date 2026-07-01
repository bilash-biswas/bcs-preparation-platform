import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DiscussionState, Discussion } from '../../types';
import DiscussionService from '../../services/discussionService';

const initialState: DiscussionState = {
  discussions: [],
  popularDiscussions: [],
  bookmarkedDiscussions: [],
  currentDiscussion: null,
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchDiscussions = createAsyncThunk(
  'discussion/fetchDiscussions',
  async (_, { rejectWithValue }) => {
    try {
      const discussions = await DiscussionService.getDiscussions();
      return discussions;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch discussions');
    }
  }
);

export const fetchPopularDiscussions = createAsyncThunk(
  'discussion/fetchPopularDiscussions',
  async (_, { rejectWithValue }) => {
    try {
      const discussions = await DiscussionService.getPopularDiscussions();
      return discussions;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch popular discussions');
    }
  }
);

export const fetchBookmarkedDiscussions = createAsyncThunk(
  'discussion/fetchBookmarkedDiscussions',
  async (_, { rejectWithValue }) => {
    try {
      const discussions = await DiscussionService.getBookmarkedDiscussions();
      return discussions;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch bookmarked discussions');
    }
  }
);

export const fetchDiscussionById = createAsyncThunk(
  'discussion/fetchDiscussionById',
  async (discussionId: number, { rejectWithValue }) => {
    try {
      const discussion = await DiscussionService.getDiscussionById(discussionId);
      return discussion;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch discussion');
    }
  }
);

export const createDiscussion = createAsyncThunk(
  'discussion/createDiscussion',
  async (
    { title, comment, parent }: 
    { title: string; comment: string; parent?: number },
    { rejectWithValue }
  ) => {
    try {
      const discussion = await DiscussionService.createDiscussion(title, comment, parent);
      return discussion;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to create discussion');
    }
  }
);

export const likeDiscussion = createAsyncThunk(
  'discussion/likeDiscussion',
  async (discussionId: number, { rejectWithValue }) => {
    try {
      const response = await DiscussionService.likeDiscussion(discussionId);
      return { discussionId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to like discussion');
    }
  }
);

export const dislikeDiscussion = createAsyncThunk(
  'discussion/dislikeDiscussion',
  async (discussionId: number, { rejectWithValue }) => {
    try {
      const response = await DiscussionService.dislikeDiscussion(discussionId);
      return { discussionId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to dislike discussion');
    }
  }
);

export const bookmarkDiscussion = createAsyncThunk(
  'discussion/bookmarkDiscussion',
  async (discussionId: number, { rejectWithValue }) => {
    try {
      const response = await DiscussionService.bookmarkDiscussion(discussionId);
      return { discussionId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to bookmark discussion');
    }
  }
);

export const addReply = createAsyncThunk(
  'discussion/addReply',
  async (
    { parentId, comment }: 
    { parentId: number; comment: string },
    { rejectWithValue }
  ) => {
    try {
      const reply = await DiscussionService.addReply(parentId, comment);
      return { parentId, reply };
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to add reply');
    }
  }
);

const discussionSlice = createSlice({
  name: 'discussion',
  initialState,
  reducers: {
    // Clear current discussion
    clearCurrentDiscussion: (state) => {
      state.currentDiscussion = null;
    },
    
    // Add discussion locally (for optimistic updates)
    addDiscussion: (state, action: PayloadAction<Discussion>) => {
      state.discussions.unshift(action.payload);
    },
    
    // Update discussion locally
    updateDiscussion: (state, action: PayloadAction<Partial<Discussion> & { id: number }>) => {
      const { id, ...updates } = action.payload;
      
      // Update in discussions list
      const discussionIndex = state.discussions.findIndex(d => d.id === id);
      if (discussionIndex !== -1) {
        state.discussions[discussionIndex] = { ...state.discussions[discussionIndex], ...updates };
      }
      
      // Update in popular discussions
      const popularIndex = state.popularDiscussions.findIndex(d => d.id === id);
      if (popularIndex !== -1) {
        state.popularDiscussions[popularIndex] = { ...state.popularDiscussions[popularIndex], ...updates };
      }
      
      // Update in bookmarked discussions
      const bookmarkedIndex = state.bookmarkedDiscussions.findIndex(d => d.id === id);
      if (bookmarkedIndex !== -1) {
        state.bookmarkedDiscussions[bookmarkedIndex] = { ...state.bookmarkedDiscussions[bookmarkedIndex], ...updates };
      }
      
      // Update current discussion
      if (state.currentDiscussion && state.currentDiscussion.id === id) {
        state.currentDiscussion = { ...state.currentDiscussion, ...updates };
      }
    },
    
    // Remove discussion
    removeDiscussion: (state, action: PayloadAction<number>) => {
      const discussionId = action.payload;
      state.discussions = state.discussions.filter(d => d.id !== discussionId);
      state.popularDiscussions = state.popularDiscussions.filter(d => d.id !== discussionId);
      state.bookmarkedDiscussions = state.bookmarkedDiscussions.filter(d => d.id !== discussionId);
      
      if (state.currentDiscussion?.id === discussionId) {
        state.currentDiscussion = null;
      }
    },
    
    // Add reply locally (optimistic update)
    addReplyLocally: (state, action: PayloadAction<{ parentId: number; reply: Discussion }>) => {
      const { parentId, reply } = action.payload;
      
      // Add to current discussion if it matches
      if (state.currentDiscussion && state.currentDiscussion.id === parentId) {
        if (!state.currentDiscussion.replies) {
          state.currentDiscussion.replies = [];
        }
        state.currentDiscussion.replies.push(reply);
        state.currentDiscussion.reply_count += 1;
      }
      
      // Update in discussions list
      const discussionIndex = state.discussions.findIndex(d => d.id === parentId);
      if (discussionIndex !== -1) {
        if (!state.discussions[discussionIndex].replies) {
          state.discussions[discussionIndex].replies = [];
        }
        state.discussions[discussionIndex].replies.push(reply);
        state.discussions[discussionIndex].reply_count += 1;
      }
      
      // Update in popular discussions
      const popularIndex = state.popularDiscussions.findIndex(d => d.id === parentId);
      if (popularIndex !== -1) {
        if (!state.popularDiscussions[popularIndex].replies) {
          state.popularDiscussions[popularIndex].replies = [];
        }
        state.popularDiscussions[popularIndex].replies.push(reply);
        state.popularDiscussions[popularIndex].reply_count += 1;
      }
    },
    
    // Clear discussion state
    clearDiscussionState: (state) => {
      state.discussions = [];
      state.popularDiscussions = [];
      state.bookmarkedDiscussions = [];
      state.currentDiscussion = null;
      state.isLoading = false;
      state.error = null;
    },
    
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Discussions
      .addCase(fetchDiscussions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDiscussions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.discussions = action.payload;
      })
      .addCase(fetchDiscussions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Popular Discussions
      .addCase(fetchPopularDiscussions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPopularDiscussions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.popularDiscussions = action.payload;
      })
      .addCase(fetchPopularDiscussions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Bookmarked Discussions
      .addCase(fetchBookmarkedDiscussions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBookmarkedDiscussions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookmarkedDiscussions = action.payload;
      })
      .addCase(fetchBookmarkedDiscussions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Discussion By ID
      .addCase(fetchDiscussionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDiscussionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDiscussion = action.payload;
      })
      .addCase(fetchDiscussionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create Discussion
      .addCase(createDiscussion.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createDiscussion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.discussions.unshift(action.payload);
        if (!action.payload.parent) {
          // Only add to discussions list if it's not a reply
          state.discussions.unshift(action.payload);
        }
      })
      .addCase(createDiscussion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Like Discussion
      .addCase(likeDiscussion.fulfilled, (state, action) => {
        const { discussionId, liked, likes_count, dislikes_count } = action.payload;
        
        // Update discussion in all lists
        const updateDiscussion = (discussion: Discussion) => {
          if (discussion.id === discussionId) {
            return {
              ...discussion,
              is_liked: liked,
              is_disliked: false,
              likes_count,
              dislikes_count,
            };
          }
          return discussion;
        };
        
        state.discussions = state.discussions.map(updateDiscussion);
        state.popularDiscussions = state.popularDiscussions.map(updateDiscussion);
        state.bookmarkedDiscussions = state.bookmarkedDiscussions.map(updateDiscussion);
        
        if (state.currentDiscussion && state.currentDiscussion.id === discussionId) {
          state.currentDiscussion = updateDiscussion(state.currentDiscussion);
        }
      })
      
      // Dislike Discussion
      .addCase(dislikeDiscussion.fulfilled, (state, action) => {
        const { discussionId, disliked, likes_count, dislikes_count } = action.payload;
        
        // Update discussion in all lists
        const updateDiscussion = (discussion: Discussion) => {
          if (discussion.id === discussionId) {
            return {
              ...discussion,
              is_liked: false,
              is_disliked: disliked,
              likes_count,
              dislikes_count,
            };
          }
          return discussion;
        };
        
        state.discussions = state.discussions.map(updateDiscussion);
        state.popularDiscussions = state.popularDiscussions.map(updateDiscussion);
        state.bookmarkedDiscussions = state.bookmarkedDiscussions.map(updateDiscussion);
        
        if (state.currentDiscussion && state.currentDiscussion.id === discussionId) {
          state.currentDiscussion = updateDiscussion(state.currentDiscussion);
        }
      })
      
      // Bookmark Discussion
      .addCase(bookmarkDiscussion.fulfilled, (state, action) => {
        const { discussionId, bookmarked, bookmarks_count } = action.payload;
        
        // Update discussion in all lists
        const updateDiscussion = (discussion: Discussion) => {
          if (discussion.id === discussionId) {
            return {
              ...discussion,
              is_bookmarked: bookmarked,
              bookmarks_count,
            };
          }
          return discussion;
        };
        
        state.discussions = state.discussions.map(updateDiscussion);
        state.popularDiscussions = state.popularDiscussions.map(updateDiscussion);
        
        // Add or remove from bookmarked discussions
        if (bookmarked) {
          const discussion = state.discussions.find(d => d.id === discussionId);
          if (discussion && !state.bookmarkedDiscussions.find(d => d.id === discussionId)) {
            state.bookmarkedDiscussions.unshift(updateDiscussion(discussion));
          }
        } else {
          state.bookmarkedDiscussions = state.bookmarkedDiscussions.filter(d => d.id !== discussionId);
        }
        
        if (state.currentDiscussion && state.currentDiscussion.id === discussionId) {
          state.currentDiscussion = updateDiscussion(state.currentDiscussion);
        }
      })
      
      // Add Reply
      .addCase(addReply.fulfilled, (state, action) => {
        const { parentId, reply } = action.payload;
        
        // Add to current discussion if it matches
        if (state.currentDiscussion && state.currentDiscussion.id === parentId) {
          if (!state.currentDiscussion.replies) {
            state.currentDiscussion.replies = [];
          }
          state.currentDiscussion.replies.push(reply);
          state.currentDiscussion.reply_count += 1;
        }
        
        // Update in discussions list
        const discussionIndex = state.discussions.findIndex(d => d.id === parentId);
        if (discussionIndex !== -1) {
          if (!state.discussions[discussionIndex].replies) {
            state.discussions[discussionIndex].replies = [];
          }
          state.discussions[discussionIndex].replies.push(reply);
          state.discussions[discussionIndex].reply_count += 1;
        }
        
        // Update in popular discussions
        const popularIndex = state.popularDiscussions.findIndex(d => d.id === parentId);
        if (popularIndex !== -1) {
          if (!state.popularDiscussions[popularIndex].replies) {
            state.popularDiscussions[popularIndex].replies = [];
          }
          state.popularDiscussions[popularIndex].replies.push(reply);
          state.popularDiscussions[popularIndex].reply_count += 1;
        }
      });
  },
});

export const {
  clearCurrentDiscussion,
  addDiscussion,
  updateDiscussion,
  removeDiscussion,
  addReplyLocally,
  clearDiscussionState,
  setLoading,
  clearError,
} = discussionSlice.actions;

export default discussionSlice.reducer;