import {
  useMediaQuery,
  Container,
  useTheme,
  Box,
  Fab,
  Alert,
  Snackbar,
} from '@mui/material';
import { PatronsDataGrid } from '../components/patrons/PatronsDataGrid';
import PatronsList from '../components/patrons/PatronsList';
import { Add } from '@mui/icons-material';
import New_Patron_Modal from '../components/patrons/NewPatronModal';
import { useState } from 'react';
import { useCreatePatron } from '../hooks/usePatrons';
import type { Create_Patron_Data } from '../types';

export const Patrons = () => {
  const theme = useTheme();
  const xsUp = useMediaQuery(theme.breakpoints.up('sm'));

  const [dialog_open, set_dialog_open] = useState(false);

  const [success_snackbar_open, set_success_snackbar_open] = useState(false);
  const [error_snackbar_open, set_error_snackbar_open] = useState(false);
  const [snackbar_message, set_snackbar_message] = useState('');

  const { mutate: create_patron, isPending: create_patron_loading } =
    useCreatePatron({
      onSuccess: () => {
        set_snackbar_message('Patron created successfully!');
        set_success_snackbar_open(true);
        set_dialog_open(false);
      },
      onError: (error: Error) => {
        set_snackbar_message(error.message || 'Failed to create patron');
        set_error_snackbar_open(true);
      },
    });

  const handle_create_patron = (patron_data: Create_Patron_Data) => {
    create_patron(patron_data);
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        p: 3,
        overflow: 'hidden',
        height: 1,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {xsUp ? (
          <PatronsDataGrid
            check_overdue={false}
            just_active={false}
            hidden_columns={['patron_name']}
          />
        ) : (
          <PatronsList />
        )}
      </Box>
      <Fab
        color="primary"
        onClick={() => set_dialog_open(true)}
        disabled={create_patron_loading}
        aria-label="Add library item"
        title="Create new patron"
        sx={{
          position: 'fixed',
          bottom: '3vh',
          right: '3vh',
        }}
      >
        <Add />
      </Fab>
      <New_Patron_Modal
        open={dialog_open}
        on_close={() => set_dialog_open(false)}
        on_submit={handle_create_patron}
      />
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
