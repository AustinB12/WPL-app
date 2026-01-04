import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/dataService';
import type { Create_Library_Item_Form_Data } from '../types';

export const useLibraryItems = () => {
  return useQuery({
    queryKey: ['library_items'],
    queryFn: () => data_service.get_all_library_items(),
  });
};

export const useCreateLibraryItem = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (item_data: Create_Library_Item_Form_Data) =>
      data_service.create_library_item(item_data),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

export const useUpdateLibraryItem = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: ({
      item_id,
      data,
    }: {
      item_id: number;
      data: Create_Library_Item_Form_Data;
    }) => data_service.update_library_item(item_id, data),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ['library_items'] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

export const useDeleteLibraryItem = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (item_id: number) => data_service.delete_library_item(item_id),
    onSuccess: () => {
      query_client.invalidateQueries({ queryKey: ['library_items'] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

export const useLibraryItemById = (item_id: number) => {
  return useQuery({
    queryKey: ['library_item', item_id],
    queryFn: () => data_service.get_library_item_by_id(item_id),
    enabled: !!item_id,
  });
};
