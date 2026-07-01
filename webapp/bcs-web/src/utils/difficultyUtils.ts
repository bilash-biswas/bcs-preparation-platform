// utils/difficultyUtils.ts
export const getDifficultyText = (difficulty: string): string => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'সহজ';
    case 'medium':
      return 'মধ্যম';
    case 'hard':
      return 'কঠিন';
    case 'all':
      return 'সব কঠিনতা';
    default:
      return difficulty || 'অজানা';
  }
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'text-green-600 bg-green-100 border-green-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'hard':
      return 'text-red-600 bg-red-100 border-red-200';
    case 'all':
      return 'text-purple-600 bg-purple-100 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

export const getDifficultyProgressColor = (difficulty: string): string => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'hard':
      return 'bg-red-500';
    case 'all':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

export const getDifficultyIcon = (difficulty: string): string => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'hard':
      return '🔴';
    case 'all':
      return '🟣';
    default:
      return '⚪';
  }
};