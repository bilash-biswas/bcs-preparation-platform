export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  date_joined?: string;
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

export interface Subject {
  id: number;
  name: string;
  description: string;
  category: Category;
  total_questions: number;
  priority: number;
  is_active: boolean;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'fill_blank';
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  marks: number;
  negative_marks: number;
  options: Option[];
  subject: Subject;
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
}

export interface QuizAttempt {
  id: number;
  user: User;
  quiz: Quiz;
  score: number;
  total_marks: number;
  time_taken: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
}

// Extended Features Types
export interface LearningRecommendation {
  id: number;
  recommendation_type: 'weak_area' | 'revision' | 'challenge' | 'concept';
  subject: Subject;
  priority: number;
  confidence_score: number;
  reason: string;
  is_completed: boolean;
  created_at: string;
  subject_name?: string;
  category_name?: string;
}

export interface StudyPlanProgress {
  completion_percentage: number;
  days_remaining: number;
  daily_progress: Array<{
    date: string;
    questions_attempted: number;
    accuracy: number;
  }>;
  upcoming_milestones: string[];
}

export interface SmartStudyPlan {
  id: number;
  user: User;
  name: string;
  subjects: Subject[];
  duration_days: number;
  daily_goal: number;
  difficulty_progression: Record<string, any>;
  is_active: boolean;
  created_at: string;
  completed_at?: string;
  progress?: StudyPlanProgress;
  schedule?: any;
  subject_names?: string[];
}

export interface UserBadge {
  id: number;
  badge_type: string;
  level: number;
  progress: number;
  unlocked_at: string;
  badge_name?: string;
  badge_description?: string;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  challenge_type: 'daily' | 'weekly' | 'monthly' | 'special';
  requirements: Record<string, any>;
  reward_points: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ChallengeWithProgress extends Challenge {
  time_remaining: string;
  user_progress?: {
    is_completed: boolean;
    progress_percentage: number;
    progress?: Record<string, any>;
  };
  participant_count?: number;
  is_joined?: boolean;
}

export interface StudyGroup {
  id: number;
  name: string;
  description: string;
  creator: User;
  subjects: Subject[];
  max_members: number;
  is_public: boolean;
  invite_code: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  subject_names?: string[];
  creator_name?: string;
}

export interface GroupActivity {
  id: number;
  group: number;
  user: User;
  activity_type: string;
  details: Record<string, any>;
  created_at: string;
}

export interface ExamSimulation {
  id: number;
  user: User;
  name: string;
  subjects: Subject[];
  duration: number;
  total_questions: number;
  question_breakdown: Record<string, any>;
  strict_timing: boolean;
  show_results_after: boolean;
  created_at: string;
  subject_names?: string[];
  progress?: any;
  time_remaining?: number;
}

export interface AnalyticsData {
  peak_study_hours: Record<string, number>;
  weak_areas: Array<{
    subject: string;
    category: string;
    accuracy: number;
    attempted_questions: number;
    suggested_actions: string[];
  }>;
  improvement_trend: number;
  recommended_actions: Array<{
    type: string;
    priority: string;
    subject: string;
    action: string;
    reason: string;
  }>;
}

export interface ComparativeAnalysis {
  accuracy_percentile: number;
  speed_percentile: number;
  consistency_rank: number;
  subject_rankings: Array<{
    subject: string;
    rank: number;
    total_users: number;
    percentile: number;
    accuracy: number;
  }>;
}

export interface GamificationDashboard {
  badges: UserBadge[];
  current_challenges: ChallengeWithProgress[];
  leaderboard_position: {
    position: number;
    total_users: number;
    percentile: number;
  };
  points_balance: number;
  next_milestones: string[];
}

export interface AdaptiveSession {
  id: number;
  user: number;
  subject: {
    id: number;
    name: string;
    description: string;
  };
  ability_estimate: number;
  questions_answered: number;
  correct_answers: number;
  total_questions: number;
  current_question?: Question;
  session_data: any;
  started_at: string;
}

export interface AdaptiveResponse {
  session_id?: number;
  ability_estimate: number;
  questions_answered: number;
  correct_answers: number;
  total_questions: number;
  next_question?: Question;
  is_correct?: boolean;
  session_completed?: boolean;
  final_score?: number;
  score_percentage?: number;
  message?: string;
}

export interface ExamAnalysis {
  performance_breakdown: {
    overall_score: number;
    subject_breakdown: Array<{
      subject: string;
      score: number;
    }>;
    difficulty_breakdown: Array<{
      difficulty: string;
      correct: number;
      total: number;
    }>;
  };
  time_management: {
    average_time_per_question: number;
    time_spent_on_easy: number;
    time_spent_on_medium: number;
    time_spent_on_hard: number;
    recommendation: string;
  };
  weak_areas: Array<{
    subject: string;
    topic: string;
    accuracy: number;
    suggestion: string;
  }>;
  improvement_suggestions: string[];
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