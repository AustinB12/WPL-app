import type { FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
  Typography,
} from '@mui/material';

interface FineConfirmationDialogProps {
  open: boolean;
  patron_balance: number;
  on_close: () => void;
  on_confirm: () => void;
}

export const FineConfirmationDialog: FC<FineConfirmationDialogProps> = ({
  open,
  patron_balance,
  on_close,
  on_confirm,
}) => {
  return (
    <Dialog open={open} onClose={on_close} maxWidth="sm" fullWidth>
      <DialogTitle>Clear Outstanding Fines?</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Patron Has Outstanding Fines</AlertTitle>
          This patron has an outstanding balance of{' '}
          <strong>${patron_balance.toFixed(2)}</strong>.
        </Alert>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Would you like to clear the fine? This assumes the fine was paid
          externally.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Selecting "No" will cancel the checkout transaction.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={on_close} color="error">
          No, Cancel Transaction
        </Button>
        <Button onClick={on_confirm} variant="contained" color="primary">
          Yes, Clear Fine and Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
