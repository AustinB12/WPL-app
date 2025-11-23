import React, { useState } from 'react';
import {
  Typography,
  Button,
  Box,
  Alert,
  AlertTitle,
  Paper,
  Chip,
  Stack,
  Container,
} from '@mui/material';
import { CheckCircle, Loop, Undo } from '@mui/icons-material';
import { useBranchContext } from '../contexts/Branch_Context';
import { ItemCopyConditionChip } from '../components/copies/ItemCopyConditionChip';
import {
  useCopiesRecentlyReshelved,
  useCopiesUnshelved,
  useReshelveCopies,
  useReshelveCopy,
  useUndoReshelve,
} from '../hooks/useCopies';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import ItemTypeChip from '../components/library_items/ItemTypeChip';
import { ItemCopyStatusChip } from '../components/copies/ItemCopyStatusChip';
import { useSnackbar } from '../hooks/useSnackbar';
import SimpleGrid from '../components/common/SimpleGrid';
import {
  type GridColDef,
  GridActionsCell,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import { SearchWithNameOrId } from '../components/common/SearchWithNameOrId';

export const MarkAvailablePage: React.FC = () => {
  const { selected_branch } = useBranchContext();
  const [search_term, set_search_term] = useState<string>('');
  const { show_snackbar } = useSnackbar();

  const { data: recently_reshelved_items = [], refetch: refetch_recents } =
    useCopiesRecentlyReshelved(selected_branch?.id || 1);

  const {
    data: returned_copies = [],
    isLoading: copies_loading,
    isRefetching: copies_refetching,
    refetch,
  } = useCopiesUnshelved(selected_branch?.id || 1);

  // Merge returned copies with recently reshelved items for display
  // Recently reshelved items take precedence (they have status "Available" and show undo button)
  const all_copies = [
    ...recently_reshelved_items,
    ...returned_copies.filter(
      (item) =>
        !recently_reshelved_items.some((reshelved) => reshelved.id === item.id)
    ),
  ];

  // Filter copies based on search term (by copy ID or title)
  const filtered_copies = all_copies.filter((copy) => {
    if (search_term.trim().length === 0) return true;
    const search = search_term.toLowerCase();
    return (
      copy.id.toString().includes(search) ||
      (copy.title && copy.title.toLowerCase().includes(search)) ||
      (copy.item_type && copy.item_type.toLowerCase().includes(search))
    );
  });

  const { mutate: reshelve_copy, isPending: is_reshelving_copy } =
    useReshelveCopy({
      onSuccess: () => {
        show_snackbar({
          title: 'Success!',
          message: 'Item successfully reshelved!',
          severity: 'success',
        });
        refetch();
        refetch_recents();
      },
      onError: (error: Error) => {
        show_snackbar({
          title: 'Error',
          message: `Failed to reshelve item: ${error.message}`,
          severity: 'error',
        });
      },
    });

  const undo_reshelve_mutation = useUndoReshelve({
    onSuccess: () => {
      show_snackbar({
        title: 'Success!',
        message: 'Reshelve undone successfully!',
        severity: 'success',
      });
      refetch();
      refetch_recents();
    },
    onError: (error: Error) => {
      show_snackbar({
        title: 'Error',
        message: `Failed to undo reshelve: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const {
    mutate: reshelve_copies,
    isPending: is_reshelving_copies,
    data: reshelve_all_response,
  } = useReshelveCopies({
    onSuccess: () => {
      if (reshelve_all_response) {
        show_snackbar({
          title: 'Success!',
          message: `All ${reshelve_all_response.total} items(s) successfully reshelved!'`,
          severity: 'success',
        });
      }
      refetch();
      refetch_recents();
    },
    onError: (error: Error) => {
      show_snackbar({
        title: 'Error',
        message: `Failed to reshelve items: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const handle_reshelve_all = () => {
    const all_ids = returned_copies
      .filter((item) => item.status !== 'Available')
      .map((item) => item.id);
    reshelve_copies(all_ids);
  };

  const something_loading =
    copies_loading ||
    copies_refetching ||
    is_reshelving_copies ||
    is_reshelving_copy ||
    undo_reshelve_mutation.isPending;

  // Mark item from list
  const mark_available_from_list = (copy_id: number) => {
    if (!selected_branch) return;

    reshelve_copy({ copy_id, branch_id: selected_branch.id });
  };

  const handle_undo_reshelve = (copy_id: number) => {
    undo_reshelve_mutation.mutate(copy_id, {
      onSuccess: () => {
        show_snackbar({
          title: 'Success!',
          message: 'Reshelve undone successfully!',
          severity: 'success',
        });
        // Refetch to get the item back in returned_copies
        refetch();
        refetch_recents();
      },
      onError: (error: Error) => {
        show_snackbar({
          title: 'Error',
          message: `Failed to undo reshelve: ${error.message}`,
          severity: 'error',
        });
      },
    });
  };

  const cols: GridColDef[] = [
    { field: 'id', headerName: 'Copy ID', width: 90 },
    {
      field: 'title',
      headerName: 'Title',
      width: 150,
      flex: 1,
      // valueGetter: (_, row) => {
      //   return row?.title || row?.title || 'Unknown Title';
      // },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <ItemCopyStatusChip size="small" status={params.value} />
      ),
    },
    {
      field: 'condition',
      headerName: 'Condition',
      width: 120,
      renderCell: (params) => (
        <ItemCopyConditionChip size="small" condition={params.value} />
      ),
    },
    {
      field: 'item_type',
      headerName: 'Type',
      width: 150,
      renderCell: (params) => (
        <ItemTypeChip size="small" item_type={params.value} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Reshelve',
      type: 'actions',
      width: 160,
      renderCell: (params) => (
        <GridActionsCell {...params}>
          {params.row.status.toUpperCase() === 'AVAILABLE' ? (
            <GridActionsCellItem
              label="Undo"
              disabled={something_loading}
              icon={
                <Button
                  size="small"
                  variant="contained"
                  color="info"
                  startIcon={<Undo />}
                >
                  {'Undo'}
                </Button>
              }
              onClick={() => handle_undo_reshelve(params.row.id)}
              showInMenu={false}
              title="Reshelve"
            />
          ) : (
            <GridActionsCellItem
              label="Reshelve"
              disabled={something_loading}
              icon={
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                >
                  {'Reshelve'}
                </Button>
              }
              onClick={() => mark_available_from_list(params.row.id)}
              showInMenu={false}
              title="Reshelve"
            />
          )}
        </GridActionsCell>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageTitle title={'Reshelve'} Icon_Component={CheckCircle} />
      <Typography variant="body1" color="text.secondary">
        Select items from the reshelve bin to mark them as available for
        checkout.
      </Typography>
      <Chip
        onClick={() => console.log(all_copies, search_term)}
        sx={{ maxWidth: 'min-content' }}
        label={`Current Branch: ${selected_branch?.branch_name || ''}`}
        color="primary"
      />

      {/* List of Returned Items */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight="bold">
            {`Items Ready for Reshelving (${filtered_copies.length} of ${all_copies.length})`}
          </Typography>
          <Stack
            sx={{
              flexDirection: 'row',
              gap: 2,
              alignItems: 'center',
              flex: 1,
            }}
          >
            <SearchWithNameOrId
              search_term={search_term}
              set_search_term={set_search_term}
              full_width={false}
              sx={{ width: 'clamp(200px, 30%, 400px)' }}
            />
            <Button
              color="info"
              variant="outlined"
              loading={copies_loading || copies_refetching}
              loadingPosition="start"
              onClick={() => {
                refetch();
                refetch_recents();
              }}
              startIcon={<Loop />}
            >
              {'Refresh'}
            </Button>
            <Button
              color="success"
              variant="contained"
              loading={something_loading}
              loadingPosition="start"
              disabled={returned_copies.length === 0}
              onClick={() => handle_reshelve_all()}
              startIcon={<CheckCircle />}
            >
              {'Reshelve All'}
            </Button>
          </Stack>
          <Box sx={{ my: 1 }}>
            <SimpleGrid
              cols={cols}
              rows={filtered_copies}
              loading={copies_loading || copies_refetching}
              overlay_height="125px"
              no_rows_overlay={
                all_copies.length === 0 ? (
                  <NoItemsToReshelveOverlay />
                ) : (
                  <NoResultsToReshelveOverlay />
                )
              }
            />
          </Box>
        </Stack>
      </Paper>
    </PageContainer>
  );
};

const overlay_sx = {
  py: 3,
  px: 1,
};

function NoItemsToReshelveOverlay() {
  return (
    <Container sx={overlay_sx}>
      <Alert severity="info">
        <AlertTitle>No Items to Reshelve</AlertTitle>
        All returned items at this branch have been reshelved. Great job!
      </Alert>
    </Container>
  );
}

function NoResultsToReshelveOverlay() {
  return (
    <Container sx={overlay_sx}>
      <Alert severity="warning">
        <AlertTitle>No Items Match Your Search</AlertTitle>
        Try adjusting your search term or clearing the filter.
      </Alert>
    </Container>
  );
}
