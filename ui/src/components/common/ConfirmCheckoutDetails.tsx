import { useState, type FC, type ReactNode } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Alert,
  AlertTitle,
  Skeleton,
  Grid,
  Container,
  Stack,
  LinearProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import {
  Person,
  CalendarToday,
  LibraryBooks,
  QrCode,
} from '@mui/icons-material';
import { format_date, is_overdue } from '../../utils/dateUtils';
import { usePatronById, useUpdatePatron } from '../../hooks/usePatrons';
import { useCopyById } from '../../hooks/useCopies';
import { useLibraryItemById } from '../../hooks/useLibraryItems';
import type { Item_Copy } from '../../types';
import { ItemCopyConditionChip } from '../copies/ItemCopyConditionChip';

interface ConfirmCheckoutDetailsProps {
  patron_id: number;
  copy: Item_Copy;
  was_successful: boolean | null;
  loading: boolean;
}

// Helper component for info rows
interface InfoRowProps {
  label: string;
  value: string | ReactNode;
  highlight?: boolean;
}

const InfoRow: FC<InfoRowProps> = ({ label, value, highlight }) => (
  <Stack
    sx={(theme) => ({
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      p: 1.5,
      bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
      borderRadius: 1.5,
      ...(highlight && {
        border: '1.5px solid',
        borderColor: theme.palette.secondary.main,
      }),
    })}
  >
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ fontWeight: highlight ? 600 : 400 }}
    >
      {label}
    </Typography>
    {typeof value === 'string' ? (
      <Typography variant="body2" sx={{ fontWeight: highlight ? 700 : 600 }}>
        {value}
      </Typography>
    ) : (
      value
    )}
  </Stack>
);

// Helper component for card headers
interface CardHeaderSectionProps {
  icon: ReactNode;
  overline: string;
  title: string;
  avatar_src?: string;
  bgcolor: string;
}

const CardHeaderSection: FC<CardHeaderSectionProps> = ({
  icon,
  overline,
  title,
  avatar_src,
  bgcolor,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
    <Avatar
      sx={{
        bgcolor: bgcolor,
        width: 56,
        height: 56,
        mr: 2,
      }}
      src={avatar_src}
    >
      {icon}
    </Avatar>
    <Box>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
      >
        {overline}
      </Typography>
      <Typography
        variant="h6"
        component="h3"
        sx={{ fontWeight: 600, lineHeight: 1.2 }}
      >
        {title}
      </Typography>
    </Box>
  </Box>
);

// Reusable Info Card with consistent styling
interface InfoCardProps {
  children: ReactNode;
  gridSize?: { xs?: number; sm?: number; md?: number };
}

const InfoCard: FC<InfoCardProps> = ({
  children,
  gridSize = { xs: 12, sm: 6 },
}) => (
  <Grid size={gridSize}>
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <CardContent
        sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </CardContent>
    </Card>
  </Grid>
);

// Reusable Update Dialog
interface UpdateDialogProps {
  open: boolean;
  title: string;
  on_close: () => void;
  on_confirm: () => void;
  confirm_disabled?: boolean;
  confirm_label?: string;
  children: ReactNode;
}

const UpdateDialog: FC<UpdateDialogProps> = ({
  open,
  title,
  on_close,
  on_confirm,
  confirm_disabled = false,
  confirm_label = 'Update',
  children,
}) => (
  <Dialog open={open} onClose={on_close}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    <DialogActions>
      <Button onClick={on_close}>Cancel</Button>
      <Button
        onClick={on_confirm}
        variant="contained"
        disabled={confirm_disabled}
      >
        {confirm_label}
      </Button>
    </DialogActions>
  </Dialog>
);

// Loading Card Skeleton
const LoadingCardSkeleton: FC<{ has_chips?: boolean }> = ({
  has_chips = false,
}) => (
  <Card variant="outlined">
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Skeleton variant="text" width={200} height={32} />
      </Box>
      <Box sx={{ ml: 7 }}>
        <Skeleton variant="text" width={150} height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
        {has_chips && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Skeleton variant="rectangular" width={60} height={24} />
            <Skeleton variant="rectangular" width={50} height={24} />
          </Box>
        )}
        <Skeleton variant="rectangular" width={80} height={24} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width={120} height={24} />
      </Box>
    </CardContent>
  </Card>
);

export const ConfirmCheckoutDetails: FC<ConfirmCheckoutDetailsProps> = ({
  patron_id,
  copy,
  loading,
}) => {
  const { data: patron, isLoading: loading_patron } = usePatronById(patron_id);
  const { data: item_copy, isLoading: loading_copy } = useCopyById(
    copy?.id || 0
  );
  const { data: library_item, isLoading: loading_library_item } =
    useLibraryItemById(
      item_copy?.library_item_id || copy?.library_item_id || 0
    );
  const { mutate: updatePatron } = useUpdatePatron();

  // Get number of books currently checked out
  const active_checkout_count = patron?.active_checkout_count || 0;
  const hasTooManyBooks = active_checkout_count >= 20;

  // Validation override states
  const [card_override, set_card_override] = useState(false);
  const [fine_resolved, set_fine_resolved] = useState(false);
  const [show_fine_dialog, set_show_fine_dialog] = useState(false);
  const [fine_amount_input, set_fine_amount_input] = useState('');
  const [show_override_dialog, set_show_override_dialog] = useState(false);
  const [new_expiration_date, set_new_expiration_date] = useState('');

  const hasOutstandingBalance = patron ? patron.balance > 0 : false;
  const isCardExpired = patron
    ? patron.card_expiration_date &&
      is_overdue(new Date(patron.card_expiration_date))
    : false;

  // Blocking conditions
  // const has_blocking_issues =
  //   hasTooManyBooks || // HARD BLOCK
  //   (isCardExpired && !card_override) || // Can be overridden
  //   (hasOutstandingBalance && !fine_resolved); // Can be resolved

  // Notify parent of validation status
  // useEffect(() => {
  //   if (on_validation_change) {
  //     on_validation_change(!has_blocking_issues);
  //   }
  // }, [has_blocking_issues, on_validation_change]);

  const is_any_loading = loading_patron || loading_copy || loading_library_item;

  // Calculate due date based on item type (same logic as backend)
  const calculate_due_date = () => {
    if (!library_item) return null;

    const this_year = new Date().getFullYear();
    const checkout_date = new Date();

    // Check if it's a video (case-insensitive string comparison)
    const item_type_upper = String(library_item.item_type).toUpperCase();
    if (item_type_upper === 'VIDEO') {
      // New movies (published in last year): 3 days
      // Old movies: 1 week (7 days)
      const pub_year = library_item.publication_year || 0;
      const is_new = pub_year >= this_year - 1;
      return new Date(
        checkout_date.getTime() + (is_new ? 3 : 7) * 24 * 60 * 60 * 1000
      );
    } else {
      // Books: 4 weeks (28 days)
      return new Date(checkout_date.getTime() + 28 * 24 * 60 * 60 * 1000);
    }
  };

  const due_date = calculate_due_date();

  const handle_update_balance = () => {
    if (patron && fine_amount_input !== '') {
      const new_balance = parseFloat(fine_amount_input);
      if (new_balance >= 0) {
        updatePatron(
          {
            patron_id: patron.id,
            patron_data: { balance: new_balance },
          },
          {
            onSuccess: () => {
              // Mark as resolved if balance is zero
              if (new_balance === 0) {
                set_fine_resolved(true);
              }
              set_show_fine_dialog(false);
              set_fine_amount_input('');
            },
          }
        );
      }
    }
  };

  const handle_override_card = () => {
    if (patron && new_expiration_date) {
      updatePatron(
        {
          patron_id: patron.id,
          patron_data: { card_expiration_date: new Date(new_expiration_date) },
        },
        {
          onSuccess: () => {
            set_card_override(true);
            set_show_override_dialog(false);
            set_new_expiration_date('');
          },
        }
      );
    }
  };

  // Set default new expiration date to 2 years from today
  const getDefaultNewExpiration = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    return date.toLocaleString().split('T')[0];
  };

  // If still loading essential data, show loading skeleton
  if (is_any_loading) {
    return (
      <Container sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Confirm Checkout Details
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <LoadingCardSkeleton />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <LoadingCardSkeleton has_chips />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // If data couldn't be loaded
  if (is_any_loading) {
    return (
      <Container sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Confirm Checkout Details
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary">
            Loading checkout details...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!patron || !item_copy || !library_item) {
    return (
      <Container sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Confirm Checkout Details
        </Typography>
        <Alert severity="error">
          <AlertTitle>Error Loading Data</AlertTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Unable to load the required information for this checkout.
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{ mt: 1, fontSize: '0.75rem' }}
          >
            <strong>Debug Info:</strong>
            <br />
            Patron: {patron ? 'Loaded' : 'Missing'} (ID: {patron_id})
            <br />
            Copy: {item_copy ? 'Loaded' : 'Missing'} (ID: {copy?.id || 'N/A'})
            <br />
            Library Item: {library_item ? 'Loaded' : 'Missing'} (ID:{' '}
            {item_copy?.library_item_id || copy?.library_item_id || 'N/A'})
          </Typography>
        </Alert>
      </Container>
    );
  }
  return (
    <Container maxWidth="xl" sx={{ p: 2 }}>
      {/* Warnings */}
      {(hasOutstandingBalance || isCardExpired || hasTooManyBooks) && (
        <Box sx={{ mb: 3 }}>
          {hasOutstandingBalance && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              <AlertTitle>Outstanding Balance</AlertTitle>
              This patron has an outstanding balance of $
              {patron.balance.toFixed(2)}.
            </Alert>
          )}

          {/* Fine Resolved */}
          {fine_resolved && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>✓ Fine Resolved</AlertTitle>
              Fine has been resolved. You may proceed with checkout.
            </Alert>
          )}

          {/* Expired Card - Can be extended */}
          {isCardExpired && !card_override && !hasTooManyBooks && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => set_show_override_dialog(true)}
                >
                  Extend Card
                </Button>
              }
            >
              <AlertTitle>📅 Expired Library Card</AlertTitle>
              This patron's library card expired on{' '}
              {format_date(patron?.card_expiration_date)}. Card must be extended
              to proceed.
            </Alert>
          )}

          {/* Card Extended */}
          {card_override && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>✓ Card Extended</AlertTitle>
              Card expiration has been updated. You may proceed with checkout.
            </Alert>
          )}

          {/* Too Many Books - HARD BLOCK (cannot override) */}
          {hasTooManyBooks && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>🚫 Too Many Books Checked Out</AlertTitle>
              This patron has {active_checkout_count} books checked out. Maximum
              is 20. Transaction cannot proceed until books are returned.
            </Alert>
          )}
        </Box>
      )}

      {/* Update Balance Dialog */}
      <UpdateDialog
        open={show_fine_dialog}
        title="Update Patron Balance"
        on_close={() => {
          set_show_fine_dialog(false);
          set_fine_amount_input('');
        }}
        on_confirm={handle_update_balance}
        confirm_disabled={
          fine_amount_input === '' || parseFloat(fine_amount_input) < 0
        }
        confirm_label="Update Balance"
      >
        <Typography variant="body2" sx={{ mb: 2 }}>
          Current balance: ${patron?.balance.toFixed(2)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the new balance amount for this patron
        </Typography>
        <TextField
          autoFocus
          label="New Balance"
          type="number"
          fullWidth
          value={fine_amount_input}
          onChange={(e) => set_fine_amount_input(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
        />
      </UpdateDialog>

      {/* Override Card Dialog */}
      <UpdateDialog
        open={show_override_dialog}
        title="Extend Library Card"
        on_close={() => {
          set_show_override_dialog(false);
          set_new_expiration_date('');
        }}
        on_confirm={handle_override_card}
        confirm_disabled={!new_expiration_date}
        confirm_label="Update Card"
      >
        <Typography variant="body2" sx={{ mb: 2 }}>
          Patron: {patron?.first_name} {patron?.last_name}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Current expiration: {format_date(patron?.card_expiration_date)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set new expiration date for this patron's library card
        </Typography>
        <TextField
          autoFocus
          label="New Expiration Date"
          type="date"
          fullWidth
          value={new_expiration_date || getDefaultNewExpiration()}
          onChange={(e) => set_new_expiration_date(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: new Date().toLocaleString().split('T')[0],
          }}
        />
      </UpdateDialog>

      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        {/* Patron Information */}
        <InfoCard>
          <CardHeaderSection
            icon={<Person sx={{ fontSize: 32 }} />}
            overline="Patron"
            title={`${patron.first_name} ${patron.last_name}`}
            avatar_src={patron.image_url}
            bgcolor="primary.main"
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Stack direction={'row'} spacing={2} sx={{ width: 1 }}>
              <InfoRow label="Patron ID" value={`#${patron.id}`} />
              <InfoRow
                label="Balance"
                value={
                  <Chip
                    label={`$${patron.balance.toFixed(2)}`}
                    size="small"
                    color={patron.balance > 0 ? 'warning' : 'success'}
                    sx={{ fontWeight: 600 }}
                  />
                }
              />
            </Stack>
            <InfoRow label="Email" value={patron.email} />
            <Stack direction={'row'} spacing={2} sx={{ width: 1 }}>
              <InfoRow
                label="Books Checked Out"
                value={
                  <Chip
                    label={`${active_checkout_count} / 20`}
                    size="small"
                    color={
                      hasTooManyBooks
                        ? 'error'
                        : active_checkout_count >= 15
                        ? 'warning'
                        : 'default'
                    }
                    sx={{ fontWeight: 600 }}
                  />
                }
              />
              {patron.card_expiration_date && (
                <InfoRow
                  label="Card Expires"
                  value={
                    <Chip
                      label={format_date(patron.card_expiration_date)}
                      size="small"
                      color={isCardExpired ? 'error' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  }
                />
              )}
            </Stack>
            <Stack direction={'row'} spacing={2} sx={{ width: 1 }}>
              <InfoRow label="Phone" value={patron.phone} />
            </Stack>
          </Box>
        </InfoCard>

        {/* Item Information */}
        <InfoCard>
          <CardHeaderSection
            icon={<LibraryBooks sx={{ fontSize: 32 }} />}
            overline="Library Item"
            title={library_item.title}
            bgcolor="secondary.main"
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {library_item.description && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mb: 2,
                  fontStyle: 'italic',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {library_item.description}
              </Typography>
            )}
            <Stack direction={'row'} spacing={2} sx={{ width: 1 }}>
              <InfoRow
                label="Item Type"
                value={
                  <Chip
                    label={library_item.item_type}
                    size="small"
                    color="secondary"
                    sx={{ fontWeight: 600 }}
                  />
                }
              />
              {library_item.publication_year && (
                <InfoRow
                  label="Published"
                  value={library_item.publication_year.toString()}
                />
              )}
            </Stack>
            {item_copy.branch_name && (
              <InfoRow label="Branch" value={item_copy.branch_name} />
            )}
            {item_copy.status && (
              <InfoRow
                label="Status"
                value={
                  <Chip
                    label={item_copy.status}
                    size="small"
                    color={
                      item_copy.status === 'Available' ? 'success' : 'default'
                    }
                    sx={{ fontWeight: 600 }}
                  />
                }
              />
            )}
          </Box>
        </InfoCard>

        {/* Due Date Information */}
        <InfoCard>
          <CardHeaderSection
            icon={<CalendarToday sx={{ fontSize: 32 }} />}
            overline="Due Date Information"
            title={due_date ? due_date.toLocaleDateString() : 'N/A'}
            bgcolor="info.main"
          />
          <Stack
            sx={{
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Item must be returned by this date
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <InfoRow
                label="Loan Duration:"
                value={
                  library_item &&
                  String(library_item.item_type).toUpperCase() === 'VIDEO'
                    ? library_item.publication_year &&
                      library_item.publication_year >=
                        new Date().getFullYear() - 1
                      ? '3 days'
                      : '1 week'
                    : '4 weeks'
                }
              />
            </Box>
          </Stack>
        </InfoCard>

        {/* Copy Information */}
        <InfoCard>
          <CardHeaderSection
            icon={
              <QrCode
                onClick={() => console.log('QR Code clicked')}
                sx={{ fontSize: 32 }}
              />
            }
            overline="Copy Information"
            title={`Copy #${item_copy.id}`}
            bgcolor="success.main"
          />
          <Stack
            sx={{
              gap: 2,
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <Grid container spacing={2} sx={{ width: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoRow
                  label="Condition"
                  value={
                    <ItemCopyConditionChip
                      size="small"
                      condition={item_copy?.condition || 'Good'}
                    />
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoRow
                  label="Location"
                  value={item_copy.current_branch_name}
                />
              </Grid>
            </Grid>
          </Stack>
        </InfoCard>
        {loading && (
          <Grid size={12}>
            <LinearProgress sx={{ width: 1, height: '0.5rem' }} />
          </Grid>
        )}
      </Grid>
    </Container>
  );
};
