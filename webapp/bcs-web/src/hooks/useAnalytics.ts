import { apiClient } from '@/lib/api';
import { useState, useEffect } from 'react';

interface AnalyticsData {
  overview: {
    total_sessions: number;
    completed_sessions: number;
    total_questions_attempted: number;
    current_streak: number;
  };
  weekly_accuracy: Array<{ date: string; accuracy: number }>;
  subject_performance: Array<any>;
  recent_achievements: Array<any>;
  daily_goal_met: boolean;
}

export const useAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/analytics/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchAnalytics();
  };

  return { data, loading, error, refetch };
};
