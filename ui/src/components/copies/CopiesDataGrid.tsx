import {
  GridActionsCellItem,
  type GridColDef,
  type GridRowId,
  type GridRowParams,
} from '@mui/x-data-grid';
import {
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
} from '@mui/material';
import { useAllCopies } from '../../hooks/useCopies';
import { useBranchContext } from '../../contexts/Branch_Context';
import { useState } from 'react';
import ItemTypeChip from '../library_items/ItemTypeChip';
import { ItemCopyStatusChip } from './ItemCopyStatusChip';
import { ItemCopyConditionChip } from './ItemCopyConditionChip';
import type {
  Item_Copy,
  Item_Condition,
  Availability_Status,
} from '../../types';
import { Delete, Edit } from '@mui/icons-material';
import { get_condition_color } from '../../utils/colors';
import { useBranchesContext } from '../../hooks/useBranchHooks';
import { BaseDataGrid } from '../common/BaseDataGrid';

export const CopiesDataGrid = ({
  on_copy_selected,
  just_available = false,
}: {
  on_copy_selected?: (copy_id: Item_Copy) => void;
  just_available?: boolean;
  hidden_columns?: string[];
}) => {
  const { selected_branch } = useBranchContext();
  const { branches } = useBranchesContext();
  const { data: copies, isLoading: loading } = useAllCopies(
    selected_branch?.id
  );
  const [snack, set_snack] = useState<boolean>(false);

  // Delete dialog state
  const [delete_dialog_open, set_delete_dialog_open] = useState(false);
  const [copy_to_delete, set_copy_to_delete] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Edit dialog state
  const [edit_dialog_open, set_edit_dialog_open] = useState(false);
  const [copy_to_edit, set_copy_to_edit] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [edit_form_data, set_edit_form_data] = useState<{
    condition: Item_Condition;
    status: Availability_Status;
    branch_id: number;
    cost: number;
    notes: string;
  }>({
    condition: 'Excellent',
    status: 'Available',
    branch_id: 1,
    cost: 0,
    notes: '',
  });

  const conditions: Item_Condition[] = [
    'New',
    'Excellent',
    'Good',
    'Fair',
    'Poor',
  ];
  const statuses: Availability_Status[] = [
    'Available',
    'Checked Out',
    'Reserved',
    'Processing',
    'Unshelved',
    'Damaged',
    'Lost',
  ];

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
      flex: 1,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      editable: false,
    },
    {
      field: 'item_type',
      headerName: 'Type',
      width: 150,
      editable: false,
      align: 'center',
      renderCell: (params) => <ItemTypeChip item_type={params.value} />,
    },
    {
      field: 'publication_year',
      headerName: 'Pub. Year',
      width: 100,
      editable: false,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 125,
      editable: false,
      renderCell: (params) => <ItemCopyStatusChip status={params.value} />,
      filterable: true,
    },
    {
      field: 'condition',
      headerName: 'Condition',
      width: 125,
      editable: false,
      renderCell: (params) => (
        <ItemCopyConditionChip condition={params.value} />
      ),
    },
    {
      field: 'branch_name',
      headerName: 'Belongs To',
      width: 250,
      editable: false,
    },
    {
      field: 'owning_branch_id',
      headerName: 'Owning Branch ID',
      width: 90,
      editable: false,
      type: 'number',
    },
    {
      field: 'current_branch_id',
      headerName: 'Current Branch ID',
      width: 90,
      editable: false,
      type: 'number',
    },
    {
      field: 'actions',
      type: 'actions',
      width: 60,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => delete_copy(params.id)}
          showInMenu
        />,
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => edit_copy(params.id)}
          showInMenu
        />,
      ],
    },
  ];

  const delete_copy = (id: GridRowId) => {
    const copy = copies?.find((c) => c.id === id);
    if (copy) {
      set_copy_to_delete(copy as unknown as Record<string, unknown>);
      set_delete_dialog_open(true);
    }
  };

  const confirm_delete = () => {
    if (copy_to_delete) {
      console.log('Deleting copy:', copy_to_delete);
      // TODO: Implement actual delete mutation here
      // Example: deleteCopyMutation.mutate(copy_to_delete.id);
    }
    set_delete_dialog_open(false);
    set_copy_to_delete(null);
  };

  const edit_copy = (id: GridRowId) => {
    const copy = copies?.find((c) => c.id === id);
    if (copy) {
      set_copy_to_edit(copy as unknown as Record<string, unknown>);
      set_edit_form_data({
        condition: copy.condition || 'Excellent',
        status: copy.status,
        branch_id: copy.branch_id,
        cost: copy.cost || 0,
        notes: copy.notes || '',
      });
      set_edit_dialog_open(true);
    }
  };

  const confirm_edit = () => {
    if (copy_to_edit) {
      console.log(
        'Updating copy:',
        copy_to_edit.id,
        'with data:',
        edit_form_data
      );
      // TODO: Implement actual update mutation here
      // Example: updateCopyMutation.mutate({ id: copy_to_edit.id, ...edit_form_data });
    }
    set_edit_dialog_open(false);
    set_copy_to_edit(null);
  };
  return (
    <>
      <BaseDataGrid
        onRowDoubleClick={(params) =>
          params.row.status !== 'Available' && set_snack(true)
        }
        rows={copies}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          columns: {
            columnVisibilityModel: {
              branch_id: false,
              description: false,
              publication_year: false,
              owning_branch_id: false,
              current_branch_id: false,
            },
          },
          pagination: { paginationModel: { pageSize: 25 } },
          filter: {
            filterModel: {
              items: just_available
                ? [
                    {
                      field: 'status',
                      operator: 'contains',
                      value: 'Available',
                      id: 1,
                    },
                  ]
                : [],
            },
          },
        }}
        label="Copies"
        isRowSelectable={(params: GridRowParams) =>
          params.row.status === 'Available'
        }
        onRowSelectionModelChange={(newSelection) => {
          const selected_copy = Array.from(newSelection.ids)[0] || 0;
          if (selected_copy && copies && on_copy_selected) {
            on_copy_selected(
              copies.find((c) => c.id === selected_copy) as Item_Copy
            );
          }
        }}
      />
      <Snackbar
        open={snack}
        autoHideDuration={6000}
        onClose={() => set_snack(false)}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <Alert severity="info">
          {'Only copies of status "Available" can be selected.'}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={delete_dialog_open}
        onClose={() => set_delete_dialog_open(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Copy</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this copy? This action cannot be
            undone.
          </DialogContentText>
          {copy_to_delete && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid size={{ xs: 6 }}>
                <DialogContentText variant="body2" color="text.secondary">
                  Copy ID:
                </DialogContentText>
                <DialogContentText variant="body1" fontWeight={500}>
                  #{String(copy_to_delete.id)}
                </DialogContentText>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <DialogContentText variant="body2" color="text.secondary">
                  Title:
                </DialogContentText>
                <DialogContentText variant="body1" fontWeight={500}>
                  {String(
                    copy_to_delete.title ||
                      copy_to_delete.library_item_title ||
                      'N/A'
                  )}
                </DialogContentText>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <DialogContentText variant="body2" color="text.secondary">
                  Status:
                </DialogContentText>
                <ItemCopyStatusChip
                  status={copy_to_delete.status as Availability_Status}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <DialogContentText variant="body2" color="text.secondary">
                  Condition:
                </DialogContentText>
                <ItemCopyConditionChip
                  condition={
                    (copy_to_delete.condition as Item_Condition) || 'Good'
                  }
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => set_delete_dialog_open(false)}>Cancel</Button>
          <Button onClick={confirm_delete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Copy Dialog */}
      <Dialog
        open={edit_dialog_open}
        onClose={() => set_edit_dialog_open(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Copy #{String(copy_to_edit?.id || '')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <DialogContentText variant="body2" color="text.secondary">
                Title:{' '}
                <strong>
                  {String(
                    copy_to_edit?.title ||
                      copy_to_edit?.library_item_title ||
                      'N/A'
                  )}
                </strong>
              </DialogContentText>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="edit-status-label">Status</InputLabel>
                <Select
                  labelId="edit-status-label"
                  value={edit_form_data.status}
                  label="Status"
                  onChange={(e) =>
                    set_edit_form_data({
                      ...edit_form_data,
                      status: e.target.value as Availability_Status,
                    })
                  }
                >
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      <ItemCopyStatusChip status={status} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="edit-condition-label">Condition</InputLabel>
                <Select
                  labelId="edit-condition-label"
                  value={edit_form_data.condition}
                  label="Condition"
                  onChange={(e) =>
                    set_edit_form_data({
                      ...edit_form_data,
                      condition: e.target.value as Item_Condition,
                    })
                  }
                >
                  {conditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      <Chip
                        label={condition}
                        color={get_condition_color(condition)}
                        variant="outlined"
                        size="small"
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="edit-branch-label">Current Branch</InputLabel>
                <Select
                  labelId="edit-branch-label"
                  value={edit_form_data.branch_id}
                  label="Current Branch"
                  onChange={(e) =>
                    set_edit_form_data({
                      ...edit_form_data,
                      branch_id: Number(e.target.value),
                    })
                  }
                >
                  {branches?.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.branch_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Cost"
                type="number"
                value={edit_form_data.cost}
                onChange={(e) =>
                  set_edit_form_data({
                    ...edit_form_data,
                    cost: Number(e.target.value),
                  })
                }
                slotProps={{
                  input: {
                    startAdornment: '$',
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={edit_form_data.notes}
                onChange={(e) =>
                  set_edit_form_data({
                    ...edit_form_data,
                    notes: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => set_edit_dialog_open(false)}>Cancel</Button>
          <Button onClick={confirm_edit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
