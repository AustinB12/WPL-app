import { useMediaQuery, useTheme, Fab, Stack } from '@mui/material';
import { PatronsDataGrid } from '../components/patrons/PatronsDataGrid';
import PatronsList from '../components/patrons/PatronsList';
import { Add, Groups2 } from '@mui/icons-material';
import New_Patron_Modal from '../components/patrons/NewPatronModal';
import { useState } from 'react';
import { useCreatePatron } from '../hooks/usePatrons';
import type { Create_Patron_Data } from '../types';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { useSnackbar } from '../hooks/useSnackbar';

export const Patrons = () => {
  const theme = useTheme();
  const xsUp = useMediaQuery(theme.breakpoints.up('sm'));
  const { show_snackbar } = useSnackbar();

  const [dialog_open, set_dialog_open] = useState(false);

  const { mutate: create_patron, isPending: create_patron_loading } =
    useCreatePatron({
      onSuccess: () => {
        show_snackbar({
          message: 'Patron created successfully!',
          severity: 'success',
        });
        set_dialog_open(false);
      },
      onError: (error: Error) => {
        show_snackbar({
          message: error.message || 'Failed to create patron',
          severity: 'error',
          title: 'Error!',
        });
      },
    });

  const handle_create_patron = (patron_data: Create_Patron_Data) => {
    create_patron(patron_data);
  };

  return (
    <PageContainer width="xl">
      <PageTitle title="Patrons" Icon_Component={Groups2} sx={{ mb: 0 }} />
      <Stack sx={{ flex: 1, overflow: 'hidden' }}>
        {xsUp ? (
          <PatronsDataGrid
            check_card_and_balance={false}
            just_active={false}
            hidden_columns={[
              'patron_name',
              'phone',
              'birthday',
              'local_branch_id',
            ]}
          />
        ) : (
          <PatronsList />
        )}
      </Stack>
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
    </PageContainer>
  );
};
