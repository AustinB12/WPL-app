import { useQuery } from '@tanstack/react-query';
import { data_service } from '../services/data_service';

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => data_service.get_stats(),
  });
};
