import { useState } from 'react';
import { Fab, Box } from '@mui/material';
import { Add, Book } from '@mui/icons-material';
import { LibraryItemDataGrid } from '../components/library_items/LibraryItemGrid';
import { CreateLibraryItemDialog } from '../components/library_items/CreateLibraryItemDialog';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';

export const LibraryItemsPage = () => {
  const [dialog_open, set_dialog_open] = useState(false);

  const handle_create_library_item = () => {
    set_dialog_open(true);
  };

  const handle_create_library_item_close = () => {
    set_dialog_open(false);
  };
  return (
    <PageContainer>
      <PageTitle title="Library Items" Icon_Component={Book} />
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
        <LibraryItemDataGrid />
        <Fab
          color="primary"
          onClick={handle_create_library_item}
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
      </Box>
      <CreateLibraryItemDialog
        open={dialog_open}
        on_close={handle_create_library_item_close}
      />
    </PageContainer>
  );
};
