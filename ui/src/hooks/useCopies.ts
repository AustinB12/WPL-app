import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { data_service } from '../services/dataService';
import type { Item_Copy } from '../types';

export const useCopies = (item_id: number) => {
  return useQuery({
    queryKey: ['item_copies', item_id],
    queryFn: () => data_service.get_all_copies_by_item_id(item_id),
    enabled: !!item_id,
  });
};

export const useAllCopyIds = () => {
  return useQuery({
    queryKey: ['all_item_copy_ids'],
    queryFn: () => data_service.get_all_copy_ids(),
  });
};

export const useAllCopies = (branch_id?: number) => {
  return useQuery({
    queryKey: ['all_item_copies', branch_id],
    queryFn: (): Promise<Item_Copy[]> => data_service.get_all_copies(branch_id),
  });
};
export const useCopyById = (
  copy_id: number,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) => {
  const query = useQuery({
    queryKey: ['item_copy', copy_id],
    queryFn: () => data_service.get_copy_by_id(copy_id),
    enabled: !!copy_id,
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

export const useCopiesUnshelved = (branch_id?: number) => {
  return useQuery({
    queryKey: ['unshelved_item_copies', branch_id],
    queryFn: () => data_service.get_unshelved_copies(branch_id),
  });
};

export const useReshelveCopy = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (copy_id: number) => data_service.reshelve_item(copy_id),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ['all_item_copies'] });
      query_client.invalidateQueries({ queryKey: ['unshelved_item_copies'] });
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
      query_client.invalidateQueries({ queryKey: ['unshelved_item_copies'] });
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

export const useCheckedOutCopies = (branch_id: number) => {
  return useQuery({
    queryKey: ['checked_out_copies', branch_id],
    queryFn: () => data_service.get_checked_out_copies(branch_id),
  });
};
