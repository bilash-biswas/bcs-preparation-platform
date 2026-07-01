export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'student' | 'teacher' | 'admin';
  phone?: string;
  avatar?: string;
  is_premium: boolean;
  premium_expiry?: string;
  coins: number;
  streak: number;
  last_active: string;
  date_joined: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  subject_count: number;
  question_count: number;
}

export interface Subject {
  id: number;
  name: string;
  description: string;
  category: number;
  category_name: string;
  total_questions: number;
  priority: number;
  is_active: boolean;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'fill_blank';
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  marks: number;
  negative_marks: number;
  subject: number;
  subject_name: string;
  options: Option[];
}

export interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
  order: number;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  subjects: Subject[];
  total_questions: number;
  time_limit: number;
  total_marks: number;
  negative_marking: boolean;
  is_published: boolean;
  attempted?: boolean;
}

export interface QuizAttempt {
  id: number;
  user: number;
  quiz: number;
  quiz_title: string;
  score: number;
  total_marks: number;
  time_taken: number;
  is_completed: boolean;
  started_at: string;
  completed_at: string;
}

export interface PracticeSession {
  id: number;
  total_questions: number;
  completed_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score: number;
  accuracy: number;
  is_completed: boolean;
  started_at: string;
  completed_at: string;
  time_taken: string;
  duration_minutes: number;
  subject_names: string[];
  difficulty?: string;
  session_type?: string;
  session_questions: PracticeSessionQuestion[];
  subjects?: number[];
  user?: number;
}

export interface PracticeSessionQuestion {
  id: number;
  question_text: string;
  explanation?: string;
  question_type?: string;
  difficulty: string;
  marks?: number;
  subject_name: string;
  options: Option[];
  user_answer: number | null;
  is_correct: boolean;
  time_taken: string | null;
  sequence_order: number;
  question: number;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  total_score: number;
  total_attempts: number;
  average_accuracy: number;
}

export interface Discussion {
  id: number;
  user: number;
  user_name: string;
  title: string;
  comment: string;
  parent?: number;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  bookmarks_count: number;
  reply_count: number;
  is_liked: boolean;
  is_disliked: boolean;
  is_bookmarked: boolean;
  replies: Discussion[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  error: string | null;
}

export interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  quizAttempts: QuizAttempt[];
  isLoading: boolean;
  error: string | null;
}

export interface PracticeState {
  sessions: PracticeSession[];
  currentSession: PracticeSession | null;
  isLoading: boolean;
  isConnected: boolean;
  offlineAnswersCount: number;
  hasPendingSync: boolean;
  error: string | null;
}

export interface LeaderboardState {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

export interface DiscussionState {
  discussions: Discussion[];
  popularDiscussions: Discussion[];
  bookmarkedDiscussions: Discussion[];
  currentDiscussion: Discussion | null;
  isLoading: boolean;
  error: string | null;
}

export interface CategoryState {
  categories: Category[];
  currentCategory: Category | null;
  isLoading: boolean;
  error: string | null;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// In your types file
export interface SubjectState {
  subjects: Subject[];
  currentSubject: Subject | null;
  filteredSubjects: Subject[];
  isLoading: boolean;
  error: string | null;
  filters: {
    category?: number | null;
    searchQuery?: string;
    difficulty?: 'all' | 'easy' | 'medium' | 'hard';
    isActive?: boolean;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface AppState {
  auth: AuthState;
  quiz: QuizState;
  practice: PracticeState;
  discussion: DiscussionState;
  category: CategoryState;
  subject: SubjectState;
}



// types/math.ts
export interface MathOption {
  latex: string;
}

export interface MathQuestion {
  id: number;
  questionText: string;
  options: Record<string, MathOption>;
  correctAnswer: string;
  topic: 'differentiation' | 'integration' | 'trigonometry' | 'vector' | 'straight_line';
  difficultyLevel: 'easy' | 'medium' | 'hard';
  databaseReference: string;
  explanationText?: string;
  createdAt?: string;
}

export interface UserAnswers {
  [questionId: number]: string;
}

export interface ShowExplanations {
  [questionId: number]: boolean;
}