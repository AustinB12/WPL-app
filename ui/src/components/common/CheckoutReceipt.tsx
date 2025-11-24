import { type FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Paper,
  IconButton,
  Alert,
  AlertTitle,
  Chip,
} from '@mui/material';
import { CheckCircle, Close, EventNote, PersonRemove } from '@mui/icons-material';
import type { Item_Copy, Library_Item, Patron, Transaction } from '../../types';
import { format_date } from '../../utils/dateUtils';
import { useSelectedBranch } from '../../hooks/useBranchHooks';

interface CheckoutReceiptProps {
  open: boolean;
  on_close: () => void;
  receipt?: Item_Copy & Library_Item & Patron & Transaction;
}

export const CheckoutReceipt: FC<CheckoutReceiptProps> = ({
  open,
  on_close,
  receipt,
}) => {
  const handle_close = () => {
    on_close();
  };

  const { selected_branch } = useSelectedBranch();

  return (
    <Dialog
      open={open}
      onClose={handle_close}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 2 },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
            <Box>
            <Typography variant="h5" fontWeight="bold">
              Checkout Receipt
            </Typography>
              {receipt && (receipt as any).reservation && (receipt as any).reservation.was_reserved && (
                <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <EventNote fontSize="small" />
                  Reservation Fulfilled
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={handle_close} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {receipt && (receipt as any).reservation && (receipt as any).reservation.was_reserved && (
          <Alert 
            severity="success" 
            icon={<EventNote />}
            sx={{ 
              mb: 3,
              border: '2px solid',
              borderColor: 'success.main',
              bgcolor: 'success.50',
            }}
          >
            <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              ✓ Reservation Fulfilled - Patron Left Queue
            </AlertTitle>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              This checkout fulfilled an active reservation.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Chip
                icon={<EventNote />}
                label={`Queue Position: #${(receipt as any).reservation.queue_position}`}
                color="info"
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<PersonRemove />}
                label="Removed from Queue"
                color="success"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Alert>
        )}
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            border: '2px solid',
            borderColor: 'success.main',
            p: 3,
            mb: 2,
            borderRadius: 3,
          }}
        >
          {receipt && (
            <>
              {/* Patron Information */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  PATRON INFORMATION
                </Typography>
                {receipt.patron_id && (
                  <Typography variant="body2">
                    Patron ID: {receipt.patron_id}
                  </Typography>
                )}
                {(receipt.first_name || receipt.last_name) && (
                  <Typography variant="body2">
                    Name: {receipt.first_name} {receipt.last_name}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Book/Item Information */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  BOOK INFORMATION
                </Typography>
                {receipt?.title && (
                  <Typography variant="body2">
                    Title: {receipt.title}
                  </Typography>
                )}
                {receipt?.item_type && (
                  <Typography variant="body2">
                    Type: {receipt.item_type}
                  </Typography>
                )}
                {receipt?.copy_id && (
                  <Typography variant="body2">
                    Copy ID: {receipt.copy_id}
                  </Typography>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />

              {selected_branch && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      BRANCH INFORMATION
                    </Typography>
                    {receipt?.title && (
                      <Typography variant="body2">
                        Branch: {selected_branch.branch_name}
                      </Typography>
                    )}
                    {receipt?.item_type && (
                      <Typography variant="body2">
                        Address: {selected_branch.address}
                      </Typography>
                    )}
                    {receipt?.copy_id && (
                      <Typography variant="body2">
                        Phone #: {selected_branch.phone}
                      </Typography>
                    )}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              {/* Due Date Information */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  DUE DATE
                </Typography>
                <Typography
                  variant="body2"
                  color="primary.main"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  {receipt?.due_date ? format_date(receipt.due_date) : 'N/A'}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Loan Duration Rules:
                </Typography>
                <Typography variant="body2" component="div" sx={{ pl: 2 }}>
                  • Books: 4 weeks
                  <br />
                  • Movies: 1 week
                  <br />• New (movies): 3 days
                </Typography>
              </Box>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Item Availability Notice */}
          {(receipt as any)?.reservation?.was_reserved && (
            <Alert severity="warning" sx={{ mb: 2, border: '1px solid', borderColor: 'warning.main' }}>
              <AlertTitle sx={{ fontWeight: 'bold' }}>⚠️ Item No Longer Available</AlertTitle>
              <Typography variant="body2" sx={{ mt: 1 }}>
                This item was reserved and is now checked out. It is <strong>no longer available</strong> for other patrons until it is returned.
              </Typography>
            </Alert>
          )}

          {/* Footer Message */}
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontStyle="italic"
            >
              Please return by the specified due date to avoid fines. Thank you!
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handle_close} variant="contained" size="large">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
