import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  Snackbar,
  CardHeader,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  // Assessment,
  // Assignment,
  // CheckCircle,
  LibraryAdd,
  LibraryAddCheck,
  PersonAdd,
  Shelves,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import CreateLibraryItemDrawer from '../components/books/CreateLibraryItemDrawer';
import NewPatronModal from '../components/patrons/NewPatronModal';
import type { Create_Library_Item_Form_Data, Patron_Form_Data } from '../types';
import React, { useState, type PropsWithChildren } from 'react';
import { useCreatePatron } from '../hooks/usePatrons';
import { useStats } from '../hooks/useStats';
import { useCreateLibraryItem } from '../hooks/useLibraryItems';
import { TransactionsDataGrid } from '../components/transactions/TransactionsDataGrid';

export const HomePage = () => {
  const [create_book_drawer_open, set_create_book_drawer_open] =
    useState(false);
  const [create_patron_modal_open, set_create_patron_modal_open] =
    useState(false);
  const [success_snackbar_open, set_success_snackbar_open] = useState(false);
  const [error_snackbar_open, set_error_snackbar_open] = useState(false);
  const [snackbar_message, set_snackbar_message] = useState('');

  const {
    mutate: create_item,
    error: create_item_error,
    isPending: create_item_loading,
  } = useCreateLibraryItem();

  const { mutate: create_patron, isPending: create_patron_loading } =
    useCreatePatron({
      onSuccess: () => {
        set_snackbar_message('Patron created successfully!');
        set_success_snackbar_open(true);
        set_create_patron_modal_open(false);
      },
      onError: (error: Error) => {
        set_snackbar_message(error.message || 'Failed to create patron');
        set_error_snackbar_open(true);
      },
    });

  const handle_create_patron = (patron_data: Patron_Form_Data) => {
    create_patron(patron_data);
  };

  return (
    <Container maxWidth="xl" sx={{ p: 2 }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 3,
          color: 'text.primary',
          fontSize: 'calc(1.3rem + 1.6vw)',
        }}
      >
        {'Welcome!'}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
            }}
          >
            <CardHeader
              sx={{ pb: 0 }}
              title={
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Statistics
                </Typography>
              }
              subheader={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontStyle={'italic'}
                >
                  All branches
                </Typography>
              }
            />
            <CardContent sx={{ flex: 1 }}>
              <StatsCard />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardHeader
              sx={{ pb: 0 }}
              title={
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Quick Actions
                </Typography>
              }
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
              <Stack sx={{ flexGrow: 1, gap: 1 }}>
                <ActionButton
                  onClick={() => set_create_book_drawer_open(true)}
                  label="Create Item"
                  key="add-item-button"
                  icon={<Add />}
                />
                <ActionButton
                  label="Create Patron"
                  key="register-patron-button"
                  icon={<PersonAdd />}
                  onClick={() => set_create_patron_modal_open(true)}
                />
                {/* <ActionButton
                  icon={<Assignment />}
                  label="Process Returns"
                  key="process-returns-button"
                ></ActionButton> */}
              </Stack>
              <Stack sx={{ flexGrow: 1, gap: 1 }}>
                {/* <ActionButton
                  icon={<Assessment />}
                  label="Generate Reports"
                  key="generate-reports-button"
                ></ActionButton> */}
                <ActionLink url="/check-in">
                  <ActionButton
                    label="Check In"
                    key="qwerty"
                    icon={<LibraryAddCheck />}
                  />
                </ActionLink>
                <ActionLink url="/check-out">
                  <ActionButton
                    label="Check Out"
                    key="checkout-button"
                    icon={<LibraryAdd />}
                  />
                </ActionLink>
              </Stack>
              <Stack sx={{ flexGrow: 1, gap: 1 }}>
                {/* <ActionLink url="/reshelve">
                  <ActionButton
                    label="Reshelve Items"
                    key="reshelve-button"
                    icon={<Shelves />}
                  />
                </ActionLink> */}
                <ActionLink url="/reshelve-new">
                  <ActionButton
                    label="Reshelve Items"
                    key="reshelve-new-button"
                    icon={<Shelves />}
                  />
                </ActionLink>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TransactionsDataGrid label="Recent Transactions" />
      <CreateLibraryItemDrawer
        open={create_book_drawer_open}
        loading={create_item_loading}
        on_close={() => set_create_book_drawer_open(false)}
        on_submit={(item_data: Create_Library_Item_Form_Data) => {
          create_item(item_data, {
            onSuccess: () => {
              set_snackbar_message('Library item created successfully!');
              set_success_snackbar_open(true);
            },
          });
        }}
      />
      <NewPatronModal
        open={create_patron_modal_open}
        on_close={function (): void {
          set_create_patron_modal_open(false);
        }}
        on_submit={handle_create_patron}
        is_loading={create_patron_loading}
      />
      {/* Existing book error snackbar */}
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        open={Boolean(create_item_error)}
        onClose={() => {}}
        autoHideDuration={6000}
      >
        <Alert severity="error">
          {create_item_error?.message}
          <AlertTitle>{create_item_error?.name}</AlertTitle>
        </Alert>
      </Snackbar>

      {/* Success snackbar for patron creation */}
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        open={success_snackbar_open}
        onClose={() => set_success_snackbar_open(false)}
        autoHideDuration={6000}
      >
        <Alert
          severity="success"
          onClose={() => set_success_snackbar_open(false)}
        >
          {snackbar_message}
        </Alert>
      </Snackbar>

      {/* Error snackbar for patron creation */}
      <Snackbar
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        open={error_snackbar_open}
        onClose={() => set_error_snackbar_open(false)}
        autoHideDuration={6000}
      >
        <Alert severity="error" onClose={() => set_error_snackbar_open(false)}>
          {snackbar_message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

function ActionButton({
  label,
  icon,
  ...remainingProps
}: {
  label: string;
  onClick?: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Button
      fullWidth
      variant="outlined"
      color="primary"
      startIcon={icon}
      sx={{
        justifyContent: 'flex-start',
        p: 1.5,
        borderRadius: 2,
        borderWidth: 2,
        position: 'relative',
      }}
      {...remainingProps}
    >
      <span>{label}</span>
    </Button>
  );
}

function ActionLink({ url, children }: PropsWithChildren<{ url: string }>) {
  return (
    <Link to={url} style={{ textDecoration: 'none', display: 'block' }}>
      {children}
    </Link>
  );
}

function StatsCard() {
  const { data, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error" variant="body2">
          Failed to load statistics: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={2}>
        <Typography color="text.secondary" variant="body2">
          No statistics available
        </Typography>
      </Box>
    );
  }

  const get_overdue_color = (count: number): string => {
    if (count > 10) return 'error.main';
    if (count > 0) return 'warning.main';
    return 'success.main';
  };

  const stats_items = [
    // {
    //   label: 'Total Items',
    //   value: data.total_items,
    //   bgcolor: 'primary.main',
    //   icon: '📚',
    // },
    {
      label: 'Active Patrons',
      value: data.total_active_patrons,
      bgcolor: 'info.main',
      icon: '👥',
    },
    {
      label: 'Checked Out',
      value: data.borrowed_items,
      bgcolor: 'secondary.main',
      icon: '📖',
    },
    {
      label: 'Overdue',
      value: data.overdue_items,
      bgcolor: get_overdue_color(data.overdue_items),
      icon: '⏰',
    },
    {
      label: 'Total Fines',
      value: `$${data.total_outstanding_fines}`,
      bgcolor: 'warning.main',
      icon: '💰',
    },
  ];

  return (
    <Grid container spacing={1}>
      {stats_items.map(({ label, value, bgcolor, icon }) => (
        <Grid
          size={{ xs: 12, sm: 6 }}
          key={label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            borderRadius: 3,
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 3,
              borderColor: bgcolor,
            },
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: bgcolor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: 1,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5, fontSize: '0.7rem' }}
            >
              {label}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                fontSize: '1rem',
              }}
            >
              {value}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
