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
  CardContent,
} from '@mui/material';
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
import { EditPatronModal } from '../components/patrons/EditPatronModal';
import { DeletePatronModal } from '../components/patrons/DeletePatronModal';
import { PageContainer } from '../components/common/PageBuilders';
import { useSnackbar } from '../hooks/useSnackbar';

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
    field: 'copy_label',
    headerName: 'Copy',
    width: 120,
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
  const { show_snackbar } = useSnackbar();
  const [anchor_el, set_anchor_el] = useState<null | HTMLElement>(null);
  const [edit_modal_open, set_edit_modal_open] = useState(false);
  const [delete_dialog_open, set_delete_dialog_open] = useState(false);

  const open = Boolean(anchor_el);

  const update_patron_mutation = useUpdatePatron({
    onSuccess: () => {
      set_edit_modal_open(false);
      show_snackbar({
        message: 'Patron updated successfully',
        severity: 'success',
        title: 'Success!',
      });
    },
    onError: (error) => {
      console.error('Failed to update patron:', error);
      show_snackbar({
        message: `Failed to update patron: ${error.message}`,
        severity: 'error',
        title: 'Error!',
      });
    },
  });

  const delete_patron_mutation = useDeletePatronById({
    onSuccess: () => {
      set_delete_dialog_open(false);
      show_snackbar({
        message: 'Patron deleted successfully',
        severity: 'success',
        title: 'Success!',
      });
      // Redirect to patrons list after showing success message
      setTimeout(() => {
        window.location.href = '/patrons';
      }, 500);
    },
    onError: (error) => {
      console.error('Failed to delete patron:', error);
      show_snackbar({
        message: `Failed to delete patron: ${error.message}`,
        severity: 'error',
        title: 'Error!',
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
    set_edit_modal_open(true);
    handle_menu_close();
  };

  const handle_delete_click = () => {
    set_delete_dialog_open(true);
    handle_menu_close();
  };

  const handle_save = (patron_data: Update_Patron_Data) => {
    if (!patron_id) return;

    update_patron_mutation.mutate({
      patron_id: parseInt(patron_id),
      patron_data,
    });
  };

  const handle_delete_confirm = () => {
    delete_patron_mutation.mutate(patron_id ? parseInt(patron_id) : 0);
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
    <PageContainer>
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
                    anchorEl={anchor_el}
                    open={open}
                    onClose={handle_menu_close}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
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
                borderRadius: 3,
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

      <EditPatronModal
        open={edit_modal_open}
        patron={patron}
        on_close={() => set_edit_modal_open(false)}
        on_save={handle_save}
        is_loading={update_patron_mutation.isPending}
      />

      <DeletePatronModal
        open={delete_dialog_open}
        patron={patron}
        on_close={() => set_delete_dialog_open(false)}
        on_confirm={handle_delete_confirm}
        is_loading={delete_patron_mutation.isPending}
      />
    </PageContainer>
  );
};
