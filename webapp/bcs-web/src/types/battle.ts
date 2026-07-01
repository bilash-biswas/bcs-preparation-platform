// types/battle.ts
export interface Battle {
  id: number;
  battle_type: 'quick' | 'ranked' | 'friendly';
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  battle_code: string;
  creator: number;
  creator_name: string;
  opponent?: number;
  opponent_name?: string;
  subject?: number;
  subject_name?: string;
  question_count: number;
  time_per_question: number;
  difficulty: 'easy' | 'medium' | 'hard';
  current_question_index: number;
  participants: BattleParticipant[];
  current_question?: BattleQuestion;
  battle_stats?: BattleStats;
  time_remaining?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface BattleParticipant {
  id: number;
  user: number;
  user_name: string;
  user_avatar?: string;
  score: number;
  correct_answers: number;
  total_time: number;
  is_ready: boolean;
  joined_at: string;
}

export interface BattleQuestion {
  id: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  explanation: string;
  marks: number;
  options: BattleOption[];
}

export interface BattleOption {
  id: number;
  option_text: string;
  is_correct?: boolean;
}

export interface BattleStats {
  winner: string;
  scores: Record<string, number>;
  correct_answers: Record<string, number>;
}

export interface BattleAnswer {
  question_id: number;
  selected_options: number[];
  time_taken: number;
}

export interface CreateBattleData {
  battle_type: 'quick' | 'ranked' | 'friendly';
  subject?: number;
  question_count: number;
  time_per_question: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface WebSocketMessage {
  type: 'battle_state' | 'battle_state_update' | 'question_start' | 'battle_completed' | 'chat_message' | 'player_joined' | 'player_left';
  battle?: Battle;
  question_index?: number;
  question?: BattleQuestion;
  time_limit?: number;
  results?: any;
  user?: string;
  message?: string;
  timestamp?: string;
}