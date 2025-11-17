import { useState, type PropsWithChildren } from 'react';
import { Container, Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
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
      sx={{
        p: 3,
        maxHeight: '100%',
        overflow: 'hidden',
        height: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
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
