import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/data_service';
import type { Branch } from '../types/others';

export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => data_service.get_all_branches(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

export const useBranchById = (branch_id: number) => {
  return useQuery({
    queryKey: ['branch', branch_id],
    queryFn: () => data_service.get_branch_by_id(branch_id),
    enabled: branch_id !== null,
  });
};

export const useUpdateBranch = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();
  return useMutation({
    mutationFn: ({
      branch_id,
      branch_data,
    }: {
      branch_id: number;
      branch_data: Partial<Branch>;
    }) => data_service.update_branch(branch_id, branch_data),
    onSuccess: (_data, variables) => {
      query_client.invalidateQueries({
        queryKey: ['branch', variables.branch_id],
      });
      query_client.invalidateQueries({ queryKey: ['branch'] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
