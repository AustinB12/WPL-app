import { Add, Book } from '@mui/icons-material';
import { Box, Fab } from '@mui/material';
import { useState } from 'react';
import { PageContainer, Page_Title } from '../components/common/PageBuilders';
import { CreateLibraryItemDialog } from '../components/library_items/CreateLibraryItemDialog';
import { Library_Item_Data_Grid } from '../components/library_items/LibraryItemGrid';

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
      <Page_Title title='Library Items' Icon_Component={Book} />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          mb: 2,
        }}
      >
        <Library_Item_Data_Grid />
        <Fab
          color='primary'
          onClick={handle_create_library_item}
          aria-label='Add library item'
          title='Add library item'
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
