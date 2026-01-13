import { type GridRowId, type GridRowSelectionModel } from '@mui/x-data-grid';
import { useCallback, useMemo, useState } from 'react';
import { useSnackbar } from './use_snackbar';
import {
  useCopiesUnshelved,
  useReshelveCopies,
  useReshelveCopy,
} from './use_copies';

export const useReshelveItems = (branch_id: number) => {
  const { show_snackbar } = useSnackbar();

  const [selected_row, set_selected_row] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>([]),
  });

  const handle_reshelve_copies_success = useCallback(() => {
    show_snackbar({
      message: 'Items successfully reshelved!',
      severity: 'success',
    });
  }, [show_snackbar]);

  const handle_reshelve_copy_success = useCallback(() => {
    show_snackbar({
      message: 'Item successfully reshelved!',
      severity: 'success',
    });
    // Clear selection after success
    set_selected_row({
      type: 'include',
      ids: new Set<GridRowId>([]),
    });
  }, [show_snackbar]);

  const handle_reshelve_copy_error = useCallback(
    (error: Error) => {
      show_snackbar({
        message: `Failed to reshelve item: ${error.message}`,
        severity: 'error',
      });
    },
    [show_snackbar]
  );

  const { mutate: reshelve_copy, isPending: is_reshelving_copy } =
    useReshelveCopy({
      onSuccess: handle_reshelve_copy_success,
      onError: handle_reshelve_copy_error,
    });

  const { mutate: reshelve_copies, isPending: is_reshelving_copies } =
    useReshelveCopies({
      onSuccess: handle_reshelve_copies_success,
    });

  const {
    data = [],
    isLoading: copies_loading,
    refetch,
    isRefetching: refetching,
  } = useCopiesUnshelved(branch_id);

  const something_loading = useMemo(
    () =>
      copies_loading ||
      is_reshelving_copy ||
      is_reshelving_copies ||
      refetching,
    [copies_loading, is_reshelving_copy, is_reshelving_copies, refetching]
  );

  const handle_row_selection_change = useCallback(
    (new_row_selection_model: GridRowSelectionModel) => {
      set_selected_row(new_row_selection_model);
    },
    []
  );

  const handle_reshelve_all = useCallback(() => {
    const all_ids = data.map((item) => item.id);
    reshelve_copies(all_ids);
  }, [data, reshelve_copies]);

  const handle_reshelve_single = useCallback(() => {
    reshelve_copy({
      copy_id: selected_row.ids.values().next().value as number,
    });
  }, [reshelve_copy, selected_row.ids]);

  return {
    data,
    selected_row,
    something_loading,
    refetch,
    handle_row_selection_change,
    handle_reshelve_single,
    handle_reshelve_all,
  };
};
