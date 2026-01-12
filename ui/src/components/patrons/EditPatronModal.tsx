import { Edit } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import { type FC, useEffect, useState } from 'react';
import { useBranchesContext } from '../../hooks/use_branch_hooks';
import type { Patron, Update_Patron_Data } from '../../types/patron_types';

interface Edit_Patron_Modal_Props {
  open: boolean;
  patron: Patron | null;
  on_close: () => void;
  on_save: (patron_data: Update_Patron_Data) => void;
  is_loading?: boolean;
}

export const EditPatronModal: FC<Edit_Patron_Modal_Props> = ({
  open,
  patron,
  on_close,
  on_save,
  is_loading = false,
}) => {
  const { branches, loading: branches_loading } = useBranchesContext();
  const [form_data, set_form_data] = useState<Update_Patron_Data>({});

  // Initialize form data when patron changes
  useEffect(() => {
    if (patron) {
      set_form_data({
        first_name: patron.first_name,
        last_name: patron.last_name,
        email: patron.email || '',
        phone: patron.phone || '',
        birthday: patron.birthday ? patron.birthday : undefined,
        card_expiration_date: patron.card_expiration_date,
        image_url: patron.image_url || '',
        balance: Number.isNaN(patron.balance) ? 0 : patron.balance,
        is_active: patron.is_active,
        local_branch_id: patron.local_branch_id,
      });
    }
  }, [patron]);

  const handle_input_change = (
    field: keyof Update_Patron_Data,
    value: string | boolean
  ) => {
    set_form_data((prev) => ({ ...prev, [field]: value }));
  };

  const handle_date_change = (
    field: keyof Update_Patron_Data,
    value: Dayjs | null | Date
  ) => {
    const dayjs_value = value instanceof Date ? dayjs(value) : value;
    set_form_data((prev) => ({ ...prev, [field]: dayjs_value }));
  };

  const handle_save = () => {
    const updated_data: Partial<Update_Patron_Data> = {
      first_name: form_data.first_name,
      last_name: form_data.last_name,
      email: form_data.email || undefined,
      phone: form_data.phone || undefined,
      birthday: form_data.birthday
        ? new Date(form_data.birthday).toLocaleDateString()
        : undefined,
      card_expiration_date: form_data.card_expiration_date
        ? new Date(form_data.card_expiration_date).toLocaleDateString()
        : new Date().toLocaleDateString(),
      image_url: form_data.image_url || undefined,
      balance: form_data.balance !== undefined ? form_data.balance : undefined,
      is_active: form_data.is_active !== undefined ? form_data.is_active : true,
      local_branch_id: form_data.local_branch_id,
    };

    on_save(updated_data);
  };

  return (
    <Dialog open={open} onClose={on_close} maxWidth='lg' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Edit /> Edit Patron Information
      </DialogTitle>
      <DialogContent sx={{ p: 5 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={{ xs: 2, sm: 4 }} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label='First Name'
                value={form_data.first_name}
                onChange={(e) =>
                  handle_input_change('first_name', e.target.value)
                }
                fullWidth
                required
                disabled={is_loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label='Last Name'
                value={form_data.last_name}
                onChange={(e) =>
                  handle_input_change('last_name', e.target.value)
                }
                fullWidth
                required
                disabled={is_loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label='Email'
                type='email'
                value={form_data.email}
                onChange={(e) => handle_input_change('email', e.target.value)}
                fullWidth
                disabled={is_loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label='Phone Number'
                type='tel'
                value={form_data.phone}
                onChange={(e) => handle_input_change('phone', e.target.value)}
                fullWidth
                disabled={is_loading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth disabled={is_loading || branches_loading}>
                <InputLabel id='branch-select-label'>Local Branch</InputLabel>
                <Select
                  labelId='branch-select-label'
                  id='branch-select'
                  value={form_data.local_branch_id || ''}
                  label='Local Branch'
                  onChange={(e) =>
                    handle_input_change(
                      'local_branch_id',
                      e.target.value.toString()
                    )
                  }
                >
                  {branches?.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.branch_name}
                      {branch.is_main ? ' (Main Branch)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label='Birthday'
                value={dayjs(form_data.birthday)}
                onChange={(value) => handle_date_change('birthday', value)}
                disabled={is_loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label='Card Expiration Date'
                value={dayjs(form_data.card_expiration_date)}
                onChange={(value) =>
                  handle_date_change('card_expiration_date', value)
                }
                disabled={is_loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label='Profile Image URL'
                type='url'
                value={form_data.image_url}
                onChange={(e) =>
                  handle_input_change('image_url', e.target.value)
                }
                fullWidth
                disabled={is_loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                label='Balance'
                type='number'
                value={form_data.balance}
                onChange={(e) => handle_input_change('balance', e.target.value)}
                fullWidth
                disabled={is_loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form_data.is_active}
                    onChange={(e) =>
                      handle_input_change('is_active', e.target.checked)
                    }
                    disabled={is_loading}
                  />
                }
                label='Active?'
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={on_close} disabled={is_loading}>
          Cancel
        </Button>
        <Button onClick={handle_save} variant='contained' disabled={is_loading}>
          {is_loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
