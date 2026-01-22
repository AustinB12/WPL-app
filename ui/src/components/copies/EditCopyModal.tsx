import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import type {
  Item_Condition,
  Item_Copy_Result,
  Library_Copy_Status,
} from '../../types/item_types';
import { format_sql_datetime } from '../../utils/date_utils';
import { Item_Copy_Condition_Chip } from './ItemCopyConditionChip';
import { ItemCopyStatusChip } from './ItemCopyStatusChip';
import type { Branch } from '../../types/others';

interface Edit_Copy_Modal_Props {
  open: boolean;
  copy: Item_Copy_Result | null;
  branches: Branch[] | undefined;
  on_close: () => void;
  on_save: (copy_data: {
    condition: Item_Condition;
    status: Library_Copy_Status;
    current_branch_id: number;
    owning_branch_id: number;
    cost: number;
    notes: string;
    due_date?: string;
  }) => void;
  is_loading?: boolean;
}

const conditions: Item_Condition[] = [
  'New',
  'Excellent',
  'Good',
  'Fair',
  'Poor',
];

const statuses: Library_Copy_Status[] = [
  'Available',
  'Checked Out',
  'Reserved',
  'Processing',
  'Unshelved',
  'Damaged',
  'Lost',
];

export type Edit_Copy_Form_Data = {
  condition: Item_Condition;
  status: Library_Copy_Status;
  current_branch_id: number;
  owning_branch_id: number;
  cost: number;
  notes: string;
  due_date?: string;
};

export const EditCopyModal = ({
  open,
  copy,
  branches,
  on_close,
  on_save,
  is_loading = false,
}: Edit_Copy_Modal_Props) => {
  const [form_data, set_form_data] = useState<Edit_Copy_Form_Data>({
    condition: 'Excellent',
    status: 'Available',
    current_branch_id: 1,
    owning_branch_id: 1,
    cost: 0,
    notes: '',
    due_date: '',
  });

  useEffect(() => {
    if (copy) {
      set_form_data({
        condition: (copy.condition as Item_Condition) || 'Excellent',
        status: copy.status as Library_Copy_Status,
        current_branch_id: copy?.current_branch_id || 1,
        owning_branch_id: copy?.owning_branch_id || 1,
        cost: copy.cost || 0,
        notes: copy.notes || '',
        due_date: copy?.due_date || '',
      });
    }
  }, [copy]);

  const handle_save = () => {
    if (form_data.current_branch_id !== 0) {
      on_save({
        condition: form_data.condition,
        status: form_data.status,
        current_branch_id: Number(form_data.current_branch_id),
        owning_branch_id: Number(form_data.owning_branch_id),
        cost: form_data.cost,
        notes: form_data.notes,
        due_date: form_data.due_date,
      });
    }
  };

  return (
    <Dialog open={open} onClose={on_close} maxWidth='md' fullWidth>
      <DialogTitle>Edit Copy #{String(copy?.id || '')}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <DialogContentText variant='body2' color='text.secondary'>
                Title: <strong>{String(copy?.title || 'N/A')}</strong>
              </DialogContentText>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id='edit-status-label'>Status</InputLabel>
                <Select
                  labelId='edit-status-label'
                  value={form_data.status}
                  label='Status'
                  onChange={(e) =>
                    set_form_data({
                      ...form_data,
                      status: e.target.value as Library_Copy_Status,
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
                <InputLabel id='edit-condition-label'>Condition</InputLabel>
                <Select
                  labelId='edit-condition-label'
                  value={form_data.condition}
                  label='Condition'
                  onChange={(e) =>
                    set_form_data({
                      ...form_data,
                      condition: e.target.value as Item_Condition,
                    })
                  }
                >
                  {conditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      <Item_Copy_Condition_Chip condition={condition} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id='edit-branch-label'>Current Branch</InputLabel>
                <Select
                  labelId='edit-branch-label'
                  value={
                    form_data.current_branch_id === 0
                      ? ''
                      : String(form_data.current_branch_id)
                  }
                  label='Current Branch'
                  onChange={(e) =>
                    set_form_data({
                      ...form_data,
                      current_branch_id:
                        e.target.value === '' ? 0 : Number(e.target.value),
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
              <FormControl fullWidth>
                <InputLabel id='edit-owning-branch-label'>
                  Owning Branch
                </InputLabel>
                <Select
                  labelId='edit-owning-branch-label'
                  value={
                    form_data.owning_branch_id === 0
                      ? ''
                      : String(form_data.owning_branch_id)
                  }
                  label='Owning Branch'
                  onChange={(e) =>
                    set_form_data({
                      ...form_data,
                      owning_branch_id:
                        e.target.value === '' ? 0 : Number(e.target.value),
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
                label='Cost'
                type='number'
                value={form_data.cost}
                onChange={(e) =>
                  set_form_data({
                    ...form_data,
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <Tooltip
                enterDelay={800}
                title={
                  form_data.status !== 'Checked Out'
                    ? 'Set the due date only if the copy is checked out'
                    : 'Edit Due Date'
                }
              >
                <span>
                  <DatePicker
                    label='Due Date'
                    value={
                      form_data?.due_date ? dayjs(form_data?.due_date) : null
                    }
                    onChange={(new_date) =>
                      set_form_data({
                        ...form_data,
                        due_date: format_sql_datetime(
                          (new_date as Dayjs).toDate(),
                        ),
                      })
                    }
                    disabled={is_loading || form_data.status !== 'Checked Out'}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </span>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Notes'
                multiline
                rows={3}
                value={form_data.notes}
                onChange={(e) =>
                  set_form_data({
                    ...form_data,
                    notes: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={on_close} disabled={is_loading}>
          Cancel
        </Button>
        <Button
          onClick={handle_save}
          variant='contained'
          color='primary'
          disabled={is_loading}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
