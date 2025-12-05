import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/dataService';

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
