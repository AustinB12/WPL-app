import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/data_service';
import type { Reservation } from '../types/transaction_types';

export const useReservations = (
  patron_id?: number,
  status?: string,
  library_item_id?: number
) => {
  return useQuery({
    queryKey: ['reservations', patron_id, status, library_item_id],
    queryFn: () =>
      data_service.getAllReservations(patron_id, status, library_item_id),
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: data_service.cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};

export const useCreateReservation = (options?: {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      patron_id,
      item_copy_id,
    }: {
      patron_id: number;
      item_copy_id: number;
    }) => data_service.create_reservation(patron_id, item_copy_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
};

export const useReservationsByItemCopy = (item_copy_id: number) => {
  return useQuery({
    queryKey: ['reservations', 'item_copy', item_copy_id],
    queryFn: () =>
      data_service.get_reservations_by_item_copy(item_copy_id) as Promise<
        Reservation[]
      >,
    enabled: item_copy_id > 0,
  });
};
