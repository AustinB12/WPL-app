import { Add, TableRows } from '@mui/icons-material';
import { Box, Fab } from '@mui/material';
import { type PropsWithChildren, useState } from 'react';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
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
    <PageContainer width="xl">
      <PageTitle title="Library Item Copies" Icon_Component={TableRows} />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
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
    </PageContainer>
  );
}

export const LibraryItemCopiesPage = () => {
  return (
    <LibraryItemCopiesPageContent>
      <CopiesDataGrid />
    </LibraryItemCopiesPageContent>
  );
};
