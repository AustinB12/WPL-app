import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/data_service';
import type { Item_Condition } from '../types/item_types';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => data_service.getAllTransactions(),
  });
};

export const useOverdueTransactions = () => {
  return useQuery({
    queryKey: ['transactions', 'overdue'],
    queryFn: () => data_service.getOverdueTransactions(),
  });
};

export const useActiveTransactions = () => {
  return useQuery({
    queryKey: ['transactions', 'active'],
    queryFn: () => data_service.getActiveTransactions(),
  });
};

export const useCheckoutItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      patron_id,
      copy_id,
      clear_fines = false,
    }: {
      patron_id: number;
      copy_id: number;
      clear_fines?: boolean;
    }) => data_service.check_out_item(patron_id, copy_id, clear_fines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all_patrons'] });
      queryClient.invalidateQueries({ queryKey: ['patron'] });
    },
  });
};

export const useRenewItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ copy_id }: { copy_id: number }) =>
      data_service.renew_item(copy_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all_patrons'] });
      queryClient.invalidateQueries({ queryKey: ['patron'] });
      queryClient.invalidateQueries({ queryKey: ['checked_out_copies'] });
    },
  });
};

export const use_reserve_item = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ copy_id }: { copy_id: number }) =>
      data_service.reserve_item(copy_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all_patrons'] });
      queryClient.invalidateQueries({ queryKey: ['patron'] });
    },
  });
};

export const useReturnBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      copy_id,
      new_location_id,
      new_condition,
      notes,
    }: {
      copy_id: number;
      new_location_id: number;
      new_condition?: Item_Condition;
      notes?: string;
    }) =>
      data_service.check_in_item(
        copy_id,
        new_location_id,
        new_condition,
        notes,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useGetTransactionsByPatronId = (patron_id: number) => {
  return useQuery({
    queryKey: ['transactions', 'patron', patron_id],
    queryFn: () => data_service.getTransactionsByPatronId(patron_id),
  });
};

export const useCheckedOutItems = (branch_id?: number) => {
  return useQuery({
    queryKey: ['transactions', 'checked-out', branch_id],
    queryFn: () => data_service.getCheckedOutItems(branch_id),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useCheckOutDetails = (copy_id: number | null) => {
  return useQuery({
    queryKey: ['transactions', 'checkout-details', copy_id],
    queryFn: () => data_service.get_check_out_details(copy_id),
    enabled: false,
  });
};
