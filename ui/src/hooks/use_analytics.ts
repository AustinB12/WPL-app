import { useQuery } from '@tanstack/react-query';
import { data_service } from '../services/data_service';

/**
 * Hook to fetch circulation trends
 */
export const useCirculationTrends = (
  start_date?: string,
  end_date?: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily',
  branch_id?: number
) => {
  return useQuery({
    queryKey: [
      'analytics',
      'circulation',
      start_date,
      end_date,
      interval,
      branch_id,
    ],
    queryFn: () =>
      data_service.get_circulation_trends(
        start_date,
        end_date,
        interval,
        branch_id
      ),
  });
};

/**
 * Hook to fetch popular items and genres
 */
export const usePopularItems = (
  period: '7d' | '30d' | '90d' | '1y' = '30d',
  branch_id?: number,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ['analytics', 'popular-items', period, branch_id, limit],
    queryFn: () => data_service.get_popular_items(period, branch_id, limit),
  });
};

/**
 * Hook to fetch patron activity metrics
 */
export const usePatronMetrics = (
  period: '7d' | '30d' | '90d' | '1y' = '30d',
  branch_id?: number
) => {
  return useQuery({
    queryKey: ['analytics', 'patrons', period, branch_id],
    queryFn: () => data_service.get_patron_metrics(period, branch_id),
  });
};

/**
 * Hook to fetch overdue tracking data
 */
export const useOverdueTracking = (branch_id?: number) => {
  return useQuery({
    queryKey: ['analytics', 'overdue', branch_id],
    queryFn: () => data_service.get_overdue_tracking(branch_id),
  });
};

/**
 * Hook to fetch collection utilization data
 */
export const useCollectionUtilization = (
  branch_id?: number,
  min_days: number = 30
) => {
  return useQuery({
    queryKey: ['analytics', 'collection-utilization', branch_id, min_days],
    queryFn: () => data_service.get_collection_utilization(branch_id, min_days),
  });
};

/**
 * Hook to fetch analytics summary
 */
export const useAnalyticsSummary = (branch_id?: number) => {
  return useQuery({
    queryKey: ['analytics', 'summary', branch_id],
    queryFn: () => data_service.get_analytics_summary(branch_id),
  });
};
