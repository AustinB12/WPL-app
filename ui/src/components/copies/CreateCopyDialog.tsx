import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  Box,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import type {
  Library_Item,
  Item_Condition,
  Availability_Status,
} from '../../types';
import { useLibraryItems } from '../../hooks/useLibraryItems';
import { useBranches } from '../../hooks/useBranches';
import { useCreateCopy } from '../../hooks/useCopies';

interface Create_Copy_Dialog_Props {
  open: boolean;
  on_close: () => void;
}

interface Copy_Form_Data {
  library_item_id: number;
  branch_id: number | null;
  condition: Item_Condition;
  status: Availability_Status;
  cost: string;
  notes: string;
}

const INITIAL_FORM_STATE: Copy_Form_Data = {
  library_item_id: 0,
  branch_id: null,
  condition: 'Good',
  status: 'Available',
  cost: '',
  notes: '',
};

const CONDITION_OPTIONS: Item_Condition[] = [
  'New',
  'Excellent',
  'Good',
  'Fair',
  'Poor',
];

const STATUS_OPTIONS: Availability_Status[] = [
  'Available',
  'Checked Out',
  'Reserved',
  'Processing',
  'Unshelved',
  'Damaged',
  'Lost',
];

export const CreateCopyDialog = ({
  open,
  on_close,
}: Create_Copy_Dialog_Props) => {
  const [form_data, set_form_data] =
    useState<Copy_Form_Data>(INITIAL_FORM_STATE);
  const [selected_item, set_selected_item] = useState<Library_Item | null>(
    null
  );
  const [snackbar, set_snackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: library_items = [], isLoading: items_loading } =
    useLibraryItems();
  const { data: branches = [], isLoading: branches_loading } = useBranches();

  const create_copy = useCreateCopy({
    onSuccess: () => {
      set_snackbar({
        open: true,
        message: 'Item copy created successfully!',
        severity: 'success',
      });
      handle_close();
    },
    onError: (error: Error) => {
      set_snackbar({
        open: true,
        message: `Failed to create copy: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const handle_close = () => {
    set_form_data(INITIAL_FORM_STATE);
    set_selected_item(null);
    on_close();
  };

  const handle_submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form_data.library_item_id || !form_data.branch_id) {
      set_snackbar({
        open: true,
        message: 'Please select both a library item and a branch',
        severity: 'error',
      });
      return;
    }

    const copy_data = {
      library_item_id: form_data.library_item_id,
      owning_branch_id: form_data.branch_id,
      condition: form_data.condition,
      status: form_data.status,
      cost: form_data.cost ? parseFloat(form_data.cost) : undefined,
      notes: form_data.notes || undefined,
    };

    create_copy.mutate(copy_data);
  };

  return (
    <>
      <Dialog open={open} onClose={handle_close} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Item Copy</DialogTitle>
        <form onSubmit={handle_submit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Library Item Selector */}
              <Autocomplete
                value={selected_item}
                onChange={(_event, new_value) => {
                  set_selected_item(new_value);
                  set_form_data((prev) => ({
                    ...prev,
                    library_item_id: new_value?.id || 0,
                  }));
                }}
                options={library_items}
                getOptionLabel={(option) =>
                  `${option.title} (${option.item_type}) - ${
                    option.publication_year || 'N/A'
                  }`
                }
                loading={items_loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Library Item *"
                    placeholder="Search for a library item..."
                    required
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body1">{option.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.item_type} • {option.publication_year || 'N/A'}
                      </Typography>
                    </Box>
                  </li>
                )}
              />

              {/* Branch Selector */}
              <TextField
                select
                label="Owning Branch *"
                value={form_data.branch_id || ''}
                onChange={(e) =>
                  set_form_data((prev) => ({
                    ...prev,
                    branch_id: parseInt(e.target.value),
                  }))
                }
                disabled={branches_loading}
                required
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </MenuItem>
                ))}
              </TextField>

              {/* Condition Selector */}
              <TextField
                select
                label="Condition"
                value={form_data.condition}
                onChange={(e) =>
                  set_form_data((prev) => ({
                    ...prev,
                    condition: e.target.value as Item_Condition,
                  }))
                }
              >
                {CONDITION_OPTIONS.map((condition) => (
                  <MenuItem key={condition} value={condition}>
                    {condition}
                  </MenuItem>
                ))}
              </TextField>

              {/* Status Selector */}
              <TextField
                select
                label="Status"
                value={form_data.status}
                onChange={(e) =>
                  set_form_data((prev) => ({
                    ...prev,
                    status: e.target.value as Availability_Status,
                  }))
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>

              {/* Cost Input */}
              <TextField
                label="Cost"
                type="number"
                value={form_data.cost}
                onChange={(e) =>
                  set_form_data((prev) => ({
                    ...prev,
                    cost: e.target.value,
                  }))
                }
                inputProps={{
                  min: 0,
                  step: '0.01',
                }}
                placeholder="0.00"
              />

              {/* Notes Input */}
              <TextField
                label="Notes"
                multiline
                rows={3}
                value={form_data.notes}
                onChange={(e) =>
                  set_form_data((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Add any additional notes about this copy..."
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handle_close} disabled={create_copy.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                create_copy.isPending ||
                !form_data.library_item_id ||
                !form_data.branch_id
              }
            >
              {create_copy.isPending ? 'Creating...' : 'Create Copy'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => set_snackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
    </>
  );
};
