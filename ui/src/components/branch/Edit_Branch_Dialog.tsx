import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
  InputLabel,
  Stack,
  TextField,
} from '@mui/material';
import { type FC, useState } from 'react';
import type { Branch } from '../../types/others';

export interface Edit_Branch_DialogProps {
  open: boolean;
  branch: Branch | null;
  on_close: () => void;
  on_save: (updates: Partial<Branch>) => void;
  is_loading?: boolean;
}

export const Edit_Branch_Dialog: FC<Edit_Branch_DialogProps> = ({
  open,
  branch,
  on_close,
  on_save,
  is_loading = false,
}) => {
  const [form_data, set_form_data] = useState({
    branch_name: branch?.branch_name || '',
    address: branch?.address || '',
    phone: branch?.phone || '',
    description: branch?.description || '',
    primary_color: branch?.primary_color || '',
    secondary_color: branch?.secondary_color || '',
  });

  const handle_change =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      set_form_data((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handle_save = () => {
    on_save(form_data);
  };

  return (
    <Dialog open={open} onClose={on_close} maxWidth='sm' fullWidth>
      <DialogTitle>Edit Branch Information</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label='Branch Name'
            fullWidth
            value={form_data.branch_name}
            onChange={handle_change('branch_name')}
            disabled={is_loading}
          />
          <TextField
            label='Address'
            fullWidth
            multiline
            rows={2}
            value={form_data.address}
            onChange={handle_change('address')}
            disabled={is_loading}
          />
          <TextField
            label='Phone'
            fullWidth
            value={form_data.phone}
            onChange={handle_change('phone')}
            disabled={is_loading}
          />
          <TextField
            label='Description'
            fullWidth
            multiline
            rows={3}
            value={form_data.description || ''}
            onChange={handle_change('description')}
            disabled={is_loading}
          />
          <Stack direction='row' spacing={2} alignItems='center'>
            <InputLabel htmlFor='primary-color-input'>Primary Color</InputLabel>
            <Input
              id='primary-color-input'
              type='color'
              sx={{ width: 50, height: 50, p: 0, border: 'none' }}
              value={form_data.primary_color || ''}
              onChange={handle_change('primary_color')}
              disabled={is_loading}
            />
            <InputLabel htmlFor='secondary-color-input'>
              Secondary Color
            </InputLabel>
            <Input
              id='secondary-color-input'
              type='color'
              sx={{ width: 50, height: 50, p: 0, border: 'none' }}
              value={form_data.secondary_color || ''}
              onChange={handle_change('secondary_color')}
              disabled={is_loading}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={on_close} disabled={is_loading}>
          Cancel
        </Button>
        <Button
          onClick={handle_save}
          variant='contained'
          disabled={is_loading || !form_data.branch_name || !form_data.address}
        >
          {is_loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
