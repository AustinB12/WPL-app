import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Stack,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  CardContent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import {
  CreditCard,
  AccountBalance,
  ArrowBack,
  Cake,
  MoreVert,
  Edit,
  Delete,
} from '@mui/icons-material';
import { type GridColDef } from '@mui/x-data-grid';
import {
  useDeletePatronById,
  usePatronById,
  useUpdatePatron,
} from '../hooks/usePatrons';
import { useGetTransactionsByPatronId } from '../hooks/useTransactions';
import { format_date } from '../utils/dateUtils';
import type { Update_Patron_Data } from '../types';
import { TransactionStatusChip } from '../components/transactions/TransactionStatusChip';
import { BaseDataGrid } from '../components/common/BaseDataGrid';
import { TransactionTypeChip } from '../components/transactions/TransactionTypeChip';

interface Info_Item_Props {
  icon: ReactNode;
  value: string | ReactNode;
  label: string;
}

const InfoItem = ({ icon, value, label }: Info_Item_Props) => (
  <Stack gap={1} alignItems="center" direction="row">
    {icon}
    <Stack>
      <Box sx={{ typography: 'body2' }}>{value}</Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
    </Stack>
  </Stack>
);

interface StatCardProps {
  value: string | number;
  label: string;
}

const StatCard = ({ value, label }: StatCardProps) => (
  <Grid size={{ xs: 4 }}>
    <Box
      sx={{
        p: 1,
        textAlign: 'center',
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
      >
        {label}
      </Typography>
    </Box>
  </Grid>
);

// Columns for patron's transaction history
const cols: GridColDef[] = [
  {
    field: 'title',
    headerName: 'Item',
    width: 250,
  },
  {
    field: 'transaction_type',
    headerName: 'Type',
    width: 120,
    renderCell: (params) => (
      <TransactionTypeChip transaction_type={params.value} />
    ),
  },
  {
    field: 'checkout_date',
    headerName: 'Checkout Date',
    width: 180,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'due_date',
    headerName: 'Due Date',
    width: 180,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'return_date',
    headerName: 'Return Date',
    width: 180,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => <TransactionStatusChip status={params.value} />,
  },
  {
    field: 'fine_amount',
    headerName: 'Fine',
    width: 100,
    valueFormatter: (value) => {
      return value
        ? `${Number(value) < 0 && '+'}$${Number(value).toFixed(2)}`
        : '$0.00';
    },
  },
];

export const PatronPage = () => {
  const { patron_id } = useParams();
  const [anchor_el, set_anchor_el] = useState<null | HTMLElement>(null);
  const [edit_modal_open, set_edit_modal_open] = useState(false);
  const [delete_dialog_open, set_delete_dialog_open] = useState(false);
  const [snackbar, set_snackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [form_data, set_form_data] = useState<Update_Patron_Data>({});

  const open = Boolean(anchor_el);

  const update_patron_mutation = useUpdatePatron({
    onSuccess: () => {
      set_edit_modal_open(false);
      set_snackbar({
        open: true,
        message: 'Patron updated successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      console.error('Failed to update patron:', error);
      set_snackbar({
        open: true,
        message: `Failed to update patron: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const delete_patron_mutation = useDeletePatronById({
    onSuccess: () => {
      set_delete_dialog_open(false);
      set_snackbar({
        open: true,
        message: 'Patron deleted successfully',
        severity: 'success',
      });
      // Redirect to patrons list after showing success message
      setTimeout(() => {
        window.location.href = '/patrons';
      }, 500);
    },
    onError: (error) => {
      console.error('Failed to delete patron:', error);
      set_snackbar({
        open: true,
        message: `Failed to delete patron: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const handle_menu_click = (event: React.MouseEvent<HTMLElement>) => {
    set_anchor_el(event.currentTarget);
  };

  const handle_menu_close = () => {
    set_anchor_el(null);
  };

  const handle_edit_click = () => {
    if (patron) {
      set_form_data({
        first_name: patron.first_name,
        last_name: patron.last_name,
        email: patron.email || '',
        phone: patron.phone || '',
        birthday: patron.birthday ? patron.birthday : undefined,
        card_expiration_date: patron.card_expiration_date,
        image_url: patron.image_url || '',
        balance: patron.balance,
      });
    }
    set_edit_modal_open(true);
    handle_menu_close();
  };

  const handle_modal_close = () => {
    set_edit_modal_open(false);
  };

  const handle_delete_click = () => {
    set_delete_dialog_open(true);
    handle_menu_close();
  };

  const handle_delete_dialog_close = () => {
    set_delete_dialog_open(false);
  };

  const handle_delete_confirm = () => {
    delete_patron_mutation.mutate(patron_id ? parseInt(patron_id) : 0);
  };

  const handle_snackbar_close = () => {
    set_snackbar((prev) => ({ ...prev, open: false }));
  };

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
    if (!patron_id) return;

    const updated_data: Partial<Update_Patron_Data> = {
      first_name: form_data.first_name,
      last_name: form_data.last_name,
      email: form_data.email || undefined,
      phone: form_data.phone || undefined,
      birthday: form_data.birthday ? form_data.birthday : undefined,
      card_expiration_date: form_data.card_expiration_date
        ? form_data.card_expiration_date
        : new Date(),
      image_url: form_data.image_url || undefined,
      balance: form_data.balance !== undefined ? form_data.balance : undefined,
      is_active: form_data.is_active !== undefined ? form_data.is_active : true,
    };

    update_patron_mutation.mutate({
      patron_id: parseInt(patron_id),
      patron_data: updated_data,
    });
  };

  const {
    data: patron,
    isLoading: patron_loading,
    error: patron_error,
  } = usePatronById(parseInt(patron_id || '0'));

  const { data: pt, isLoading: transactions_loading } =
    useGetTransactionsByPatronId(parseInt(patron_id || '0'));

  if (!patron_id) {
    return (
      <Container sx={{ p: 3 }}>
        <Alert severity="error">No patron ID provided</Alert>
      </Container>
    );
  }

  if (patron_loading) {
    return (
      <Container sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (patron_error || !patron) {
    return (
      <Container sx={{ p: 3 }}>
        <Alert severity="error">
          {patron_error ? 'Error loading patron data' : 'Patron not found'}
        </Alert>
        <Link to="/patrons" style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBack />} sx={{ mt: 2 }}>
            Back to Patrons
          </Button>
        </Link>
      </Container>
    );
  }

  const is_card_expired = new Date(patron.card_expiration_date) < new Date();
  const total_fines =
    pt?.reduce((sum, t) => sum + (t.fine_amount || 0), 0) || 0;

  const total_checkouts = pt?.reduce(
    (count, t) =>
      t.transaction_type.toUpperCase() === 'CHECKOUT' &&
      t.status.toUpperCase() === 'ACTIVE'
        ? count + 1
        : count,
    0
  );

  const total_returned = pt?.reduce(
    (count, t) =>
      t.transaction_type.toUpperCase() === 'CHECKIN' &&
      t.status.toUpperCase() === 'COMPLETED'
        ? count + 1
        : count,
    0
  );

  return (
    <Container maxWidth="xl" sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3, height: '-webkit-fill-available' }}>
            <CardHeader
              action={
                <>
                  <IconButton onClick={handle_menu_click}>
                    <MoreVert />
                  </IconButton>
                  <Menu
                    id="demo-positioned-menu"
                    aria-labelledby="demo-positioned-button"
                    anchorEl={anchor_el}
                    open={open}
                    onClose={handle_menu_close}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem sx={{ gap: 2 }} onClick={handle_edit_click}>
                      <Edit /> Edit
                    </MenuItem>
                    <MenuItem sx={{ gap: 2 }} onClick={handle_delete_click}>
                      <Delete /> Delete
                    </MenuItem>
                  </Menu>
                </>
              }
              title={
                <Stack
                  sx={{
                    ml: { xs: 0, md: 1 },
                    flexGrow: 1,
                    justifyContent: 'flex-start',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                    }}
                  >
                    {patron.first_name} {patron.last_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                  >
                    Patron ID: {patron.id}
                  </Typography>
                </Stack>
              }
              avatar={
                <Avatar
                  sx={{
                    width: { xs: 60, sm: 80, md: 100 },
                    height: { xs: 60, sm: 80, md: 100 },
                    bgcolor: 'primary.main',
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                    mb: { xs: 1, md: 2 },
                  }}
                  src={patron.image_url}
                >
                  {patron?.image_url
                    ? null
                    : patron.first_name[0] + patron.last_name[0]}
                </Avatar>
              }
              subheader={
                <Stack
                  gap={{ xs: 1, sm: 2, md: 3 }}
                  direction={{ xs: 'column', sm: 'row' }}
                  flexWrap="wrap"
                >
                  <InfoItem
                    icon={<CreditCard sx={{ color: 'text.secondary' }} />}
                    value={
                      <>
                        {new Date(
                          patron.card_expiration_date
                        ).toLocaleDateString()}
                        {is_card_expired && (
                          <Chip
                            component="span"
                            label="Expired"
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                            variant="outlined"
                          />
                        )}
                      </>
                    }
                    label="Card Expiration"
                  />

                  <InfoItem
                    icon={<AccountBalance sx={{ color: 'text.secondary' }} />}
                    value={
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            patron.balance > 0 ? 'error.main' : 'success.main',
                          fontWeight: 600,
                        }}
                      >
                        {patron.balance < 0 ? '+' : ''}$
                        {Math.abs(patron.balance).toFixed(2)}
                      </Typography>
                    }
                    label="Balance"
                  />

                  {patron?.birthday && (
                    <InfoItem
                      icon={<Cake sx={{ color: 'text.secondary' }} />}
                      value={format_date(patron.birthday)}
                      label="Birthday"
                    />
                  )}
                </Stack>
              }
            />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              borderRadius: 3,
              height: '-webkit-fill-available',
            }}
          >
            <CardContent sx={{ p: 1.25 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                }}
              >
                Statistics
              </Typography>
              <Grid container spacing={1}>
                <StatCard
                  value={total_checkouts || 0}
                  label="Active Checkouts"
                />
                <StatCard value={total_returned || 0} label="Total Returns" />
                <StatCard
                  value={`$${total_fines.toFixed(2)}`}
                  label="Total Fines"
                />
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card
            sx={{
              height: { xs: 400, sm: 450, md: 500 },
              width: '100%',
              borderRadius: 3,
            }}
          >
            <BaseDataGrid
              label={` ${patron.first_name} ${patron.last_name}'s Transactions`}
              rows={pt}
              columns={cols}
              loading={transactions_loading}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                },
                '& .MuiDataGrid-cell': {
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                },
              }}
            />
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={edit_modal_open}
        onClose={handle_modal_close}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit /> Edit Patron Information
        </DialogTitle>
        <DialogContent sx={{ p: 5 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={{ xs: 2, sm: 4 }} sx={{ mt: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First Name"
                  value={form_data.first_name}
                  onChange={(e) =>
                    handle_input_change('first_name', e.target.value)
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last Name"
                  value={form_data.last_name}
                  onChange={(e) =>
                    handle_input_change('last_name', e.target.value)
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={form_data.email}
                  onChange={(e) => handle_input_change('email', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone Number"
                  type="tel"
                  value={form_data.phone}
                  onChange={(e) => handle_input_change('phone', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Birthday"
                  value={dayjs(form_data.birthday)}
                  onChange={(value) => handle_date_change('birthday', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Card Expiration Date"
                  value={dayjs(form_data.card_expiration_date)}
                  onChange={(value) =>
                    handle_date_change('card_expiration_date', value)
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  label="Profile Image URL"
                  type="url"
                  value={form_data.image_url}
                  onChange={(e) =>
                    handle_input_change('image_url', e.target.value)
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  label="Balance"
                  type="number"
                  value={
                    form_data.balance === undefined ? 0 : form_data.balance
                  }
                  onChange={(e) =>
                    handle_input_change('balance', e.target.value)
                  }
                  fullWidth
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
                    />
                  }
                  label="Active?"
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handle_modal_close}>Cancel</Button>
          <Button
            onClick={handle_save}
            variant="contained"
            disabled={update_patron_mutation.isPending}
          >
            {update_patron_mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={delete_dialog_open}
        onClose={handle_delete_dialog_close}
        maxWidth="sm"
        fullWidth
      >
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
            onClick={handle_delete_dialog_close}
            color="inherit"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handle_delete_confirm}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Delete Patron
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handle_snackbar_close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handle_snackbar_close}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
