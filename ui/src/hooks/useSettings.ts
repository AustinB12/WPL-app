import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/dataService';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => data_service.get_loan_durations(),
  });
};

export const useUpdateSettings = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, duration }: { id: number; duration: number }) =>
      data_service.update_loan_duration(id, duration),
    onSuccess: (_data, variables) => {
      query_client.invalidateQueries({
        queryKey: ['loan_duration', variables.id],
      });
      query_client.invalidateQueries({ queryKey: ['settings'] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
