import { Container, Fab, Snackbar, Alert } from '@mui/material';
import {
  type GridColDef,
  type GridRowId,
  type GridRowSelectionModel,
} from '@mui/x-data-grid';
import { useState } from 'react';
import {
  useCopiesUnshelved,
  useReshelveCopies,
  useReshelveCopy,
} from '../hooks/useCopies';
import { useBranchContext } from '../contexts/Branch_Context';
import ItemTypeChip from '../components/library_items/ItemTypeChip';
import { ItemCopyStatusChip } from '../components/copies/ItemCopyStatusChip';
import { ItemCopyConditionChip } from '../components/copies/ItemCopyConditionChip';
import { BaseDataGrid } from '../components/common/BaseDataGrid';

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'title',
    headerName: 'Title',
    width: 250,
    editable: false,
  },
  {
    field: 'owning_branch_id',
    headerName: 'Branch ID',
    width: 100,
    editable: false,
  },
  {
    field: 'item_type',
    headerName: 'Type',
    width: 150,
    editable: false,
    renderCell: (params) => <ItemTypeChip item_type={params.value} />,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 125,
    editable: false,
    renderCell: (params) => <ItemCopyStatusChip status={params.value} />,
  },
  {
    field: 'condition',
    headerName: 'Condition',
    width: 125,
    editable: false,
    renderCell: (params) => <ItemCopyConditionChip condition={params.value} />,
  },
  { field: 'notes', headerName: 'Notes', width: 250, editable: false },
];

export const ReshelveItemsPageNew = () => {
  const { selected_branch } = useBranchContext();
  const { data = [], isLoading: copies_loading } = useCopiesUnshelved(
    selected_branch?.id || 1
  );

  const [selected_row, set_selected_row] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>([]),
  });

  const [snackbar, set_snackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { mutate: reshelve_copies, isPending: is_reshelving_copies } =
    useReshelveCopies({
      onSuccess: () => {
        set_snackbar({
          open: true,
          message: 'Items successfully reshelved!',
          severity: 'success',
        });
      },
    });

  const { mutate: reshelve_copy, isPending: is_reshelving_copy } =
    useReshelveCopy({
      onSuccess: () => {
        set_snackbar({
          open: true,
          message: 'Item successfully reshelved!',
          severity: 'success',
        });
        // Clear selection after success
        set_selected_row({
          type: 'include',
          ids: new Set<GridRowId>([]),
        });
      },
      onError: (error: Error) => {
        set_snackbar({
          open: true,
          message: `Failed to reshelve item: ${error.message}`,
          severity: 'error',
        });
      },
    });

  const handle_reshelve_all = () => {
    const all_ids = data.map((item) => item.id);
    console.log(
      '%cReshelving all IDs:',
      'color: blue; font-size: 4rem;',
      all_ids
    );
    reshelve_copies(all_ids);
  };

  const something_loading =
    copies_loading || is_reshelving_copy || is_reshelving_copies;

  return (
    <Container
      maxWidth="lg"
      sx={{
        p: 3,
        overflow: 'hidden',
        height: 1,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <BaseDataGrid
        rows={data || []}
        getRowId={(row) => row.id}
        columns={columns}
        hidden_columns={['owning_branch_id']}
        loading={something_loading}
        onRowSelectionModelChange={(newRowSelectionModel) => {
          set_selected_row(newRowSelectionModel);
        }}
        rowSelectionModel={selected_row}
        label={`Unshelved Items at ${selected_branch?.branch_name}`}
      />
      <Fab
        color="primary"
        aria-label="Add"
        disabled={selected_row.ids.size === 0 || something_loading}
        onClick={() =>
          reshelve_copy(selected_row.ids.values().next().value as number)
        }
        variant="extended"
        sx={{ position: 'absolute', bottom: 72, right: 16 }}
      >
        RESHELVE
      </Fab>
      <Fab
        color="secondary"
        aria-label="Reshelve All Unshelved Items"
        disabled={data.length === 0 || something_loading}
        onClick={() => handle_reshelve_all()}
        variant="extended"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
      >
        RESHELVE ALL
      </Fab>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => set_snackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => set_snackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
