import { useState, type PropsWithChildren } from 'react';
import { Container, Fab, Typography, Box } from '@mui/material';
import { Add, TableRows } from '@mui/icons-material';
import { CopiesDataGrid } from '../components/copies/CopiesDataGrid';
import { CreateCopyDialog } from '../components/copies/CreateCopyDialog';

function LibraryItemCopiesPageContent({ children }: PropsWithChildren) {
  const [dialog_open, set_dialog_open] = useState(false);

  const handle_close = () => {
    set_dialog_open(false);
  };

  const handle_create_library_item_copy = () => {
    set_dialog_open(true);
  };
  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
        }}
      >
        <TableRows color="primary" fontSize="large" />
        All Copies
      </Typography>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          mb: 8,
        }}
      >
        {children}
      </Box>
      <Fab
        color="primary"
        onClick={handle_create_library_item_copy}
        aria-label="Add library item"
        title="Add library item"
        sx={{
          position: 'fixed',
          bottom: '3vh',
          right: '3vh',
        }}
      >
        <Add />
      </Fab>
      <CreateCopyDialog open={dialog_open} on_close={handle_close} />
    </Container>
  );
}

export const LibraryItemCopiesPage = () => {
  return (
    <LibraryItemCopiesPageContent>
      <CopiesDataGrid />
    </LibraryItemCopiesPageContent>
  );
};
