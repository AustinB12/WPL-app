import { Delete } from '@mui/icons-material';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { FC } from 'react';
import type { Patron } from '../../types';

interface Delete_Patron_Modal_Props {
  open: boolean;
  patron: Patron | null;
  on_close: () => void;
  on_confirm: () => void;
  is_loading?: boolean;
}

export const DeletePatronModal: FC<Delete_Patron_Modal_Props> = ({
  open,
  patron,
  on_close,
  on_confirm,
  is_loading = false,
}) => {
  return (
    <Dialog open={open} onClose={on_close} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Delete /> Delete Patron
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action cannot be undone.
        </Alert>
        <Typography>
          Are you sure you want to delete{' '}
          <strong>
            {patron?.first_name} {patron?.last_name}
          </strong>
          ?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          All associated transactions and reservations will be affected.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button
          onClick={on_close}
          color="inherit"
          variant="outlined"
          disabled={is_loading}
        >
          Cancel
        </Button>
        <Button
          onClick={on_confirm}
          variant="contained"
          color="error"
          startIcon={<Delete />}
          disabled={is_loading}
        >
          {is_loading ? 'Deleting...' : 'Delete Patron'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
