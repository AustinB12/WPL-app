import {
  CheckCircle,
  Close,
  EventNote,
  PersonRemove,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { type FC } from 'react';
import { useSelectedBranch } from '../../hooks/use_branch_hooks';
import type { Check_Out_Details } from '../../types/transaction_types';

interface CheckoutReceiptProps {
  open: boolean;
  on_close: () => void;
  receipt?: Check_Out_Details;
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
      maxWidth='md'
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 3 },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction='row'
          alignItems='center'
          justifyContent='space-between'
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
            <Box>
              <Typography variant='h5' fontWeight='bold'>
                Checkout Receipt
              </Typography>
              {receipt &&
                receipt.reservation &&
                receipt.reservation.was_reserved && (
                  <Typography
                    variant='caption'
                    color='success.main'
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    <EventNote fontSize='small' />
                    Reservation Fulfilled
                  </Typography>
                )}
            </Box>
          </Box>
          <IconButton onClick={handle_close} size='small'>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {receipt && receipt.reservation && receipt.reservation.was_reserved && (
          <Alert
            severity='success'
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
            <Typography variant='body1' sx={{ mb: 1, fontWeight: 500 }}>
              This checkout fulfilled an active reservation.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mt: 1,
              }}
            >
              <Chip
                icon={<EventNote />}
                label={`Queue Position: #${receipt.reservation.queue_position}`}
                color='info'
                size='small'
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<PersonRemove />}
                label='Removed from Queue'
                color='success'
                size='small'
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Alert>
        )}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 1,
          }}
        >
          {receipt && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle2' gutterBottom fontWeight='bold'>
                  PATRON INFORMATION
                </Typography>
                {receipt.patron_id && (
                  <Typography variant='body2'>
                    Patron ID: {receipt.patron_id}
                  </Typography>
                )}
                {(receipt.first_name || receipt.last_name) && (
                  <Typography variant='body2'>
                    Name: {receipt.first_name} {receipt.last_name}
                  </Typography>
                )}
                {receipt?.email && (
                  <Typography variant='body2'>
                    Email: {receipt.email}
                  </Typography>
                )}
                {receipt?.phone && (
                  <Typography variant='body2'>
                    Phone: {receipt.phone}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle2' gutterBottom fontWeight='bold'>
                  BOOK INFORMATION
                </Typography>
                {receipt?.title && (
                  <Typography variant='body2'>
                    Title: {receipt.title}
                  </Typography>
                )}
                {receipt?.item_type && (
                  <Typography variant='body2'>
                    Type: {receipt.item_type}
                  </Typography>
                )}
                {receipt?.item_copy_id && (
                  <Typography variant='body2'>
                    Copy ID: {receipt.item_copy_id}
                  </Typography>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />

              {selected_branch && (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant='subtitle2'
                      gutterBottom
                      fontWeight='bold'
                    >
                      BRANCH INFORMATION
                    </Typography>
                    {selected_branch?.branch_name && (
                      <Typography variant='body2'>
                        Branch: {selected_branch.branch_name}
                      </Typography>
                    )}
                    {selected_branch?.address && (
                      <Typography variant='body2'>
                        Address: {selected_branch.address}
                      </Typography>
                    )}
                    {selected_branch?.phone && (
                      <Typography variant='body2'>
                        Phone #: {selected_branch.phone}
                      </Typography>
                    )}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                </>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle2' gutterBottom fontWeight='bold'>
                  DUE DATE
                </Typography>
                <Typography
                  variant='body2'
                  color='primary.main'
                  fontWeight='bold'
                  sx={{ mb: 1 }}
                >
                  {receipt?.due_date
                    ? new Date(receipt.due_date).toLocaleDateString()
                    : 'N/A'}
                </Typography>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mt: 1 }}
                >
                  Loan Duration Rules:
                </Typography>
                <Typography variant='body2' component='div' sx={{ pl: 2 }}>
                  • Books: 4 weeks
                  <br />• Movies: 1 week
                  <br />• New (movies): 3 days
                </Typography>
              </Box>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Item Availability Notice */}
          {receipt?.reservation?.was_reserved && (
            <Alert
              severity='warning'
              sx={{
                mb: 2,
                border: '1px solid',
                borderColor: 'warning.main',
              }}
            >
              <AlertTitle sx={{ fontWeight: 'bold' }}>
                ⚠️ Item No Longer Available
              </AlertTitle>
              <Typography variant='body2' sx={{ mt: 1 }}>
                This item was reserved and is now checked out. It is{' '}
                <strong>no longer available</strong> for other patrons until it
                is returned.
              </Typography>
            </Alert>
          )}

          {/* Footer Message */}
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography
              variant='body2'
              color='text.secondary'
              fontStyle='italic'
            >
              Please return by the specified due date to avoid fines. Thank you!
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handle_close} variant='contained' size='large'>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
