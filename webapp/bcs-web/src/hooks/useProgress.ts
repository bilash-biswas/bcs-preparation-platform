import { apiClient } from '@/lib/api';
import { useState, useEffect } from 'react';

interface UserProgress {
  id: number;
  subject_name: string;
  category_name: string;
  attempted_questions: number;
  correct_answers: number;
  accuracy: number;
  current_streak: number;
}

export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/progress/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }
    
      setProgress(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchProgress();
  };

  return { progress, loading, error, refetch };
};