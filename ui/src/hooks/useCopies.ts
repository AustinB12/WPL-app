import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Edit_Copy_Form_Data } from '../components/copies/EditCopyModal';
import { data_service } from '../services/dataService';
import type { Item_Condition, Library_Copy_Status } from '../types';

export const useCopies = (
  branch_id: number,
  status?: Library_Copy_Status,
  condition?: Item_Condition,
  other_status?: Library_Copy_Status
) => {
  return useQuery({
    queryKey: ['item_copies', branch_id, status, condition, other_status],
    queryFn: () =>
      data_service.get_all_copies(branch_id, status, condition, other_status),
  });
};

export const useCopiesOfLibraryItem = (item_id: number, branch_id?: number) => {
  return useQuery({
    queryKey: ['item_copies', item_id, branch_id],
    queryFn: () => data_service.get_all_copies_by_item_id(item_id, branch_id),
    enabled: !!item_id,
  });
};

export const useAllCopyIds = () => {
  return useQuery({
    queryKey: ['all_item_copy_ids'],
    queryFn: () => data_service.get_all_copy_ids(),
  });
};

export const useCopyById = (
  copy_id: number | null,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) => {
  const query = useQuery({
    queryKey: ['item_copy', copy_id],
    enabled: !!copy_id,
    queryFn: () => data_service.get_copy_by_id(copy_id || null),
  });

  useEffect(() => {
    if (query.isSuccess && options?.onSuccess) {
      options.onSuccess();
    }
  }, [query.isSuccess, options?.onSuccess, options]);

  useEffect(() => {
    if (query.isError && options?.onError) {
      options.onError(query.error);
    }
  }, [query.isError, query.error, options?.onError, options]);

  return query;
};

export const useCopiesUnshelved = (branch_id: number) => {
  return useQuery({
    queryKey: ['unshelved_item_copies', branch_id],
    queryFn: () => data_service.get_unshelved_copies(branch_id),
  });
};

export const useCopiesRecentlyReshelved = (branch_id: number) => {
  return useQuery({
    queryKey: ['recently_reshelved_item_copies', branch_id],
    queryFn: () => data_service.get_copies_recently_reshelved(branch_id),
  });
};

export const useReshelveCopy = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  skipInvalidation?: boolean; // Allow skipping query invalidation for unshelved items
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: ({
      copy_id,
      branch_id,
    }: {
      copy_id: number;
      branch_id?: number;
    }) => data_service.reshelve_item(copy_id, branch_id),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ['all_item_copies'] });
      query_client.invalidateQueries({ queryKey: ['item_copies'] });
      // Only invalidate unshelved_item_copies if not skipped (for undo functionality)
      if (!options?.skipInvalidation) {
        query_client.invalidateQueries({
          queryKey: ['unshelved_item_copies'],
        });
      }
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

export const useReshelveCopies = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (copy_ids: number[]) => data_service.reshelve_items(copy_ids),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ['all_item_copies'] });
      query_client.invalidateQueries({ queryKey: ['item_copies'] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

export const useUndoReshelve = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (copy_id: number) => data_service.undo_reshelve(copy_id),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ['all_item_copies'] });
      query_client.invalidateQueries({ queryKey: ['item_copies'] });
      query_client.invalidateQueries({
        queryKey: ['unshelved_item_copies'],
      });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

export const useCreateCopy = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (copy_data: {
      library_item_id: number;
      owning_branch_id: number;
      condition?: string;
      status?: string;
      cost?: number;
      notes?: string;
    }) => data_service.create_copy(copy_data),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ['item_copies'] });
      query_client.invalidateQueries({ queryKey: ['all_item_copies'] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

export const useUpdateCopy = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: ({
      copy_id,
      copy_data,
    }: {
      copy_id: number;
      copy_data: Edit_Copy_Form_Data;
    }) => data_service.update_copy(copy_id, copy_data),
    onSuccess: () => {
      // Invalidate all item_copies queries (with any branch_id, status, condition filters)
      query_client.invalidateQueries({ queryKey: ['item_copies'] });
      query_client.invalidateQueries({ queryKey: ['all_item_copies'] });
      query_client.invalidateQueries({
        queryKey: ['unshelved_item_copies'],
      });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

export const useDeleteCopy = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (copy_id: number) => data_service.delete_copy(copy_id),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ['item_copies'] });
      query_client.invalidateQueries({ queryKey: ['all_item_copies'] });
      query_client.invalidateQueries({
        queryKey: ['unshelved_item_copies'],
      });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

export const useCheckedOutCopies = (branch_id?: number) => {
  return useQuery({
    queryKey: ['checked_out_copies', branch_id],
    queryFn: () => data_service.get_checked_out_copies(branch_id),
  });
};

export const useCheckedOutCopiesSimple = (branch_id?: number) => {
  return useQuery({
    queryKey: ['checked_out_copies_simple', branch_id],
    queryFn: () => data_service.get_checked_out_copies_simple(branch_id),
  });
};

export const useAllCopyTransactions = () => {
  return useQuery({
    queryKey: ['all_item_copy_transactions'],
    queryFn: () => data_service.get_all_copy_transactions(),
  });
};
