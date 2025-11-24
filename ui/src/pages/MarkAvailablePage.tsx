import React, { useState } from 'react';
import {
  Typography,
  Button,
  Box,
  Alert,
  AlertTitle,
  Paper,
  TextField,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
} from '@mui/material';
import { CheckCircle, Undo } from '@mui/icons-material';
import { useBranchContext } from '../contexts/Branch_Context';
import { ItemCopyConditionChip } from '../components/copies/ItemCopyConditionChip';
import {
  useCopiesUnshelved,
  useReshelveCopy,
  useUndoReshelve,
} from '../hooks/useCopies';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import type { Item_Condition } from '../types';

export const MarkAvailablePage: React.FC = () => {
  const { selected_branch } = useBranchContext();
  const [search_term, set_search_term] = useState<string>('');
  // Track recently reshelved items (items that were just reshelved in this session)
  const [recently_reshelved_items, set_recently_reshelved_items] = useState<
    Array<{
      id: number;
      library_item_id?: number;
      library_item_title?: string;
      item_type?: string;
      condition?: string;
      status: string;
    }>
  >([]);

  const {
    data: returned_copies = [],
    isLoading: copies_loading,
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
    if (!search_term.trim()) return true;
    const search = search_term.toLowerCase();
    return (
      copy.id.toString().includes(search) ||
      (copy.library_item_title &&
        copy.library_item_title.toLowerCase().includes(search)) ||
      (copy.item_type && copy.item_type.toLowerCase().includes(search))
    );
  });

  const [snackbar, set_snackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const reshelve_copy_mutation = useReshelveCopy({
    skipInvalidation: true, // Don't invalidate unshelved_item_copies - we manage state manually
    onSuccess: () => {
      set_snackbar({
        open: true,
        message: 'Item successfully reshelved!',
        severity: 'success',
      });
      // Don't refetch - we manage state manually with recently_reshelved_items
    },
    onError: (error: Error) => {
      set_snackbar({
        open: true,
        message: `Failed to reshelve item: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const undo_reshelve_mutation = useUndoReshelve({
    onSuccess: () => {
      set_snackbar({
        open: true,
        message: 'Reshelve undone successfully!',
        severity: 'success',
      });
      // Remove the item from recently_reshelved_items when undone
      // It will reappear in returned_copies after the query refreshes
    },
    onError: (error: Error) => {
      set_snackbar({
        open: true,
        message: `Failed to undo reshelve: ${error.message}`,
        severity: 'error',
      });
    },
  });

  const something_loading =
    copies_loading ||
    reshelve_copy_mutation.isPending ||
    undo_reshelve_mutation.isPending;

  // Mark item from list
  const mark_available_from_list = (copy_id: number) => {
    if (!selected_branch) return;

    // Find the item before reshelving
    const item_to_reshelve = returned_copies.find(
      (item) => item.id === copy_id
    );

    if (!item_to_reshelve) {
      set_snackbar({
        open: true,
        message: 'Item not found',
        severity: 'error',
      });
      return;
    }

    // Create the reshelved item with status "Available"
    const reshelved_item = {
      ...item_to_reshelve,
      status: 'Available',
    };

    // Add the item to recently_reshelved_items IMMEDIATELY
    set_recently_reshelved_items((prev) => {
      const filtered = prev.filter((item) => item.id !== copy_id);
      return [...filtered, reshelved_item];
    });

    reshelve_copy_mutation.mutate({ copy_id, branch_id: selected_branch.id });
  };

  const handle_undo_reshelve = (copy_id: number) => {
    undo_reshelve_mutation.mutate(copy_id, {
      onSuccess: () => {
        // Remove the item from recently_reshelved_items when undone
        set_recently_reshelved_items((prev) =>
          prev.filter((item) => item.id !== copy_id)
        );
        // Refetch to get the item back in returned_copies
        refetch();
      },
    });
  };

  return (
    <PageContainer>
      <Box sx={{ mb: 4 }}>
        <PageTitle title={'Reshelve'} Icon_Component={CheckCircle} />
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Select items from the reshelve bin to mark them as available for
          checkout.
        </Typography>
        <Chip
          label={`Current Branch: ${selected_branch?.branch_name || ''}`}
          color="primary"
        />
      </Box>

      {/* List of Returned Items */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Items Ready for Reshelving ({filtered_copies.length} of{' '}
            {all_copies.length})
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flex: 1,
              maxWidth: 400,
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="Search by Copy ID or Title"
              value={search_term}
              onChange={(e) => set_search_term(e.target.value)}
              placeholder="Enter copy ID or title..."
            />
            <Button
              variant="outlined"
              disabled={copies_loading}
              onClick={() => refetch()}
              startIcon={copies_loading ? <CircularProgress size={20} /> : null}
            >
              {copies_loading ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        {copies_loading && all_copies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : all_copies.length === 0 ? (
          <Alert severity="info">
            <AlertTitle>No Items to Reshelve</AlertTitle>
            All returned items at this branch have been reshelved. Great job!
          </Alert>
        ) : filtered_copies.length === 0 ? (
          <Alert severity="warning">
            <AlertTitle>No Items Match Your Search</AlertTitle>
            Try adjusting your search term or clearing the filter.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Copy ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Title</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Type</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Condition</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Action</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered_copies.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {item.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.library_item_title ||
                        `Item ${item.library_item_id}`}
                    </TableCell>
                    <TableCell>{item.item_type || 'N/A'}</TableCell>
                    <TableCell>
                      <ItemCopyConditionChip
                        condition={(item.condition as Item_Condition) || 'Good'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          item.status === 'Available' ||
                          (item.status &&
                            item.status.trim().toLowerCase() === 'available')
                            ? 'Available'
                            : 'Returned (not yet available)'
                        }
                        color={
                          item.status === 'Available' ||
                          (item.status &&
                            item.status.trim().toLowerCase() === 'available')
                            ? 'success'
                            : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {item.status === 'Available' ||
                        (item.status &&
                          item.status.trim().toLowerCase() === 'available') ? (
                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => handle_undo_reshelve(item.id)}
                            disabled={undo_reshelve_mutation.isPending}
                            startIcon={<Undo />}
                            size="small"
                          >
                            Undo
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => mark_available_from_list(item.id)}
                            disabled={something_loading}
                            startIcon={<CheckCircle />}
                            size="small"
                          >
                            Reshelve
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => set_snackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => set_snackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};
