import {
  useState,
  useCallback,
  type FC,
  type SetStateAction,
  useMemo,
} from 'react';
import {
  Typography,
  Button,
  Box,
  Alert,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import { LibraryAdd } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PatronsDataGrid } from '../components/patrons/PatronsDataGrid';
import { useCheckoutBook } from '../hooks/useTransactions';
import { usePatronById } from '../hooks/usePatrons';
import { ConfirmCheckoutDetails } from '../components/common/ConfirmCheckoutDetails';
import type { Item_Copy_Result } from '../types';
import { CheckoutReceipt } from '../components/common/CheckoutReceipt';
import { useCopies, useCopiesOfLibraryItem } from '../hooks/useCopies';
import { useLibraryItems } from '../hooks/useLibraryItems';
import { useLibraryItemById } from '../hooks/useLibraryItems';
import { ItemCopyStatusChip } from '../components/copies/ItemCopyStatusChip';
import { ItemCopyConditionChip } from '../components/copies/ItemCopyConditionChip';
import { useSelectedBranch } from '../hooks/useBranchHooks';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { SearchWithNameOrId } from '../components/common/SearchWithNameOrId';
import { useSnackbar } from '../hooks/useSnackbar';
import { FineConfirmationDialog } from '../components/common/FineConfirmationDialog';
import { BaseDataGrid } from '../components/common/BaseDataGrid';
import type { GridColDef } from '@mui/x-data-grid/models/colDef';
import ItemTypeChip from '../components/library_items/ItemTypeChip';
import CopyNumbersOfItemChip from '../components/library_items/CopyNumbersOfItemChip';
import SimpleGrid from '../components/common/SimpleGrid';
import { useReservations } from '../hooks/useReservations';

const STEPS = ['Select Patron', 'Select Copy', 'Confirm Details'] as string[];

interface CheckOutFormData {
  patron_id: number;
  library_item_id: number | null;
  item: Item_Copy_Result | null;
}

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'title',
    headerName: 'Title',
    width: 150,
    editable: false,
    flex: 1,
  },
  {
    field: 'item_type',
    headerName: 'Type',
    width: 150,
    editable: false,
    renderCell: (params) => {
      return <ItemTypeChip item_type={params.value} />;
    },
  },
  {
    field: 'total_copies',
    headerName: 'Copies',
    width: 80,
    getSortComparator: (sortDirection) => (v1, v2) => {
      const num1 = Number(v1.available);
      const num2 = Number(v2.available);
      return sortDirection === 'asc' ? num1 - num2 : num2 - num1;
    },
    valueGetter: (value, row) => {
      return { total: Number(value), available: Number(row.available_copies) };
    },
    renderCell: (params) => {
      return (
        <CopyNumbersOfItemChip
          available={params.value.available}
          total={params.value.total}
        />
      );
    },
  },
  {
    field: 'description',
    headerName: 'Description',
    width: 200,
    editable: false,
    flex: 1,
  },
  {
    field: 'publication_year',
    headerName: 'Publication Year',
    width: 130,
    editable: false,
  },
];

// Component for searching and selecting library items
const LibraryItemSearchStep: FC<{
  onItemSelected: (item_id: number) => void;
}> = ({ onItemSelected }) => {
  const { data: library_items, isLoading } = useLibraryItems();
  const [search_term, set_search_term] = useState('');

  const filtered_items =
    library_items?.filter((item) => {
      if (!search_term.trim()) return true;
      const search = search_term.toLowerCase();
      return (
        item.title.toLowerCase().includes(search) ||
        item.id.toString().includes(search) ||
        (item.item_type && item.item_type.toLowerCase().includes(search))
      );
    }) || [];

  return (
    <Stack sx={{ p: 1, flex: 1, overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom>
        Search Library Items
      </Typography>
      <SearchWithNameOrId
        sx={{ mb: 2 }}
        search_term={search_term}
        set_search_term={set_search_term}
      />
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <BaseDataGrid
          rows={filtered_items}
          columns={columns}
          loading={isLoading}
          label="Library Items"
          onRowClick={(params) => onItemSelected(Number(params.id))}
        />
      </Box>
      {/* <Paper sx={{ maxHeight: '60vh', overflow: 'auto' }}>
        <List>
          {isLoading ? (
            <ListItem>
              <ListItemText primary="Loading..." />
            </ListItem>
          ) : filtered_items.length === 0 ? (
            <ListItem>
              <ListItemText primary="No items found" />
            </ListItem>
          ) : (
            filtered_items.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  onClick={() => onItemSelected(item.id)}
                  selected={selected_item_id === item.id}
                  sx={{
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.50',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.100',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={item.title}
                    secondary={`Item ID: ${item.id} | Type: ${item.item_type}`}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper> */}
    </Stack>
  );
};

const copies_cols: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60 },
  {
    field: 'copy_label',
    headerName: 'Label',
    width: 120,
    renderCell: (params) => <Chip label={params.value} size="small" />,
  },
  { field: 'title', headerName: 'Title', width: 150, flex: 1 },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => (
      <ItemCopyStatusChip size="small" status={params.value} />
    ),
  },
  {
    field: 'item_type',
    headerName: 'Type',
    width: 120,
    renderCell: (params) => <ItemTypeChip item_type={params.value} />,
  },
  {
    field: 'condition',
    headerName: 'Condition',
    width: 120,
    renderCell: (params) => (
      <ItemCopyConditionChip size="small" condition={params.value} />
    ),
  },
  // { field: 'current_branch_name', headerName: 'Location', width: 150 },
  // { field: 'owning_branch_name', headerName: 'Owner', width: 150 },
  // { field: 'notes', headerName: 'Notes', flex: 1 },
];

// Component for showing all copies of a library item
const LibraryItemCopiesList: FC<{
  on_copy_selected: (copy: Item_Copy_Result) => void;
  patron_id?: number;
}> = ({ on_copy_selected, patron_id }) => {
  const { selected_branch } = useSelectedBranch();
  const { data: copies, isLoading } = useCopies(
    selected_branch ? selected_branch.id : 1,
    'Available'
  );

  const [search_term, set_search_term] = useState('');

  const { data: reservations } = useReservations(patron_id, 'ready');

  const filtered_copies = useMemo(() => {
    if (!search_term) return copies;
    return copies?.filter((copy) =>
      [
        copy.id,
        copy.current_branch_name,
        copy.title,
        copy.owning_branch_name,
        copy.item_type,
      ].some((value) =>
        String(value).toLowerCase().includes(search_term.toLowerCase())
      )
    );
  }, [copies, search_term]);

  return (
    <Stack sx={{ height: 1, overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom>
        Select a Copy
      </Typography>

      <Stack sx={{ flex: 1, overflow: 'hidden' }}>
        <SearchWithNameOrId
          search_term={search_term}
          set_search_term={set_search_term}
          sx={{ mb: 2 }}
        />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <SimpleGrid
            rows={filtered_copies || []}
            cols={copies_cols}
            loading={isLoading}
            on_row_click={(params) => on_copy_selected(params.row)}
          />
        </Box>
        {/* <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {available_copies.map((copy) => {
              const isReserved =
                (copy.status || '').trim().toLowerCase() === 'reserved';
              const reservation = copy.reservation;
              // Can select if: not reserved, or reserved and patron_id matches reservation patron_id
              const canSelectReserved =
                isReserved &&
                reservation &&
                patron_id &&
                patron_id === reservation.patron_id;
              // Cannot select if: reserved and (no reservation info or patron_id doesn't match)
              const cannotSelectReserved =
                isReserved &&
                (!reservation ||
                  !patron_id ||
                  patron_id !== reservation.patron_id);

              return (
                <Card
                  key={copy.id}
                  sx={{
                    cursor: cannotSelectReserved ? 'not-allowed' : 'pointer',
                    minWidth: 280,
                    flex: '1 1 280px',
                    maxWidth: 400,
                    border: '2px solid',
                    borderColor:
                      selected_copy_id === copy.id
                        ? 'primary.main'
                        : isReserved
                        ? 'warning.main'
                        : 'divider',
                    bgcolor:
                      selected_copy_id === copy.id
                        ? 'primary.50'
                        : isReserved
                        ? 'warning.50'
                        : 'background.paper',
                    opacity: cannotSelectReserved ? 0.6 : 1,
                    '&:hover': {
                      boxShadow: cannotSelectReserved ? 0 : 2,
                      borderColor: cannotSelectReserved
                        ? 'warning.main'
                        : isReserved
                        ? 'warning.dark'
                        : 'primary.main',
                    },
                  }}
                  onClick={() => {
                    if (!cannotSelectReserved) {
                      on_copy_selected(copy);
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Copy ID: {copy.id}
                    </Typography>
                    <Box
                      sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}
                    >
                      <ItemCopyStatusChip status={copy.status} />
                      {copy.condition && (
                        <ItemCopyConditionChip condition={copy.condition} />
                      )}
                    </Box>
                    {isReserved && (
                      <Alert
                        severity={canSelectReserved ? 'success' : 'warning'}
                        sx={{ mt: 1, mb: 1 }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          display="block"
                          gutterBottom
                        >
                          {canSelectReserved
                            ? '✓ Reserved for You'
                            : 'Reserved'}
                        </Typography>
                        {reservation ? (
                          <>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              Reserved for:{' '}
                              <strong>
                                {reservation.patron_name || 'Unknown Patron'}
                              </strong>
                              {reservation.queue_position && (
                                <span>
                                  {' '}
                                  (Queue Position: #{reservation.queue_position}
                                  )
                                </span>
                              )}
                            </Typography>
                            {cannotSelectReserved && (
                              <Typography
                                variant="caption"
                                color="error.main"
                                sx={{ mt: 0.5, display: 'block' }}
                              >
                                Only{' '}
                                {reservation.patron_name ||
                                  'the reserving patron'}{' '}
                                can checkout this copy.
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            This copy is reserved. Only the reserving patron can
                            checkout this copy.
                          </Typography>
                        )}
                      </Alert>
                    )}
                    {copy.branch_name && (
                      <Typography variant="body2" color="text.secondary">
                        Branch: {copy.branch_name}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box> */}
      </Stack>
    </Stack>
  );
};

export const CheckOutItem: FC = () => {
  const [form_data, set_form_data] = useState<CheckOutFormData>({
    patron_id: 0,
    library_item_id: null,
    item: null,
  });

  // const [queue_info, set_queue_info] = useState<Array<{
  //   patron_id: number;
  //   patron_name: string;
  //   queue_position: number;
  //   status: string;
  // }> | null>(null);
  const [receipt_open, set_receipt_open] = useState<boolean>(false);
  const [active_step, set_active_step] = useState(0);
  const [fine_confirmation_open, set_fine_confirmation_open] = useState(false);
  const [patron_balance, set_patron_balance] = useState<number>(0);
  const [pending_checkout, set_pending_checkout] = useState<{
    patron_id: number;
    copy_id: number;
  } | null>(null);

  const { show_snackbar } = useSnackbar();

  const {
    mutate: checkoutBook,
    data: checkout_receipt,
    isSuccess,
    isError,
    isPending: loading,
    reset,
  } = useCheckoutBook();

  const { data: selected_patron } = usePatronById(form_data.patron_id || 0);

  const handle_checkout_book = useCallback(
    (clear_fines: boolean = false) => {
      checkoutBook(
        {
          patron_id: form_data.patron_id,
          copy_id: form_data.item?.id || 0,
          clear_fines,
        },
        {
          onSuccess: () => {
            show_snackbar({
              message: 'Item checked out successfully!',
              severity: 'success',
              title: 'Success!',
            });
            set_receipt_open(true);
            set_fine_confirmation_open(false);
            set_pending_checkout(null);
          },
          onError: (error: Error) => {
            const error_message = error.message || 'Failed to check out item';

            show_snackbar({ message: error_message, severity: 'error' });
            set_fine_confirmation_open(false);
            set_pending_checkout(null);
          },
        }
      );
    },
    [checkoutBook, form_data.patron_id, form_data.item?.id, show_snackbar]
  );

  const handle_next = () => {
    if (active_step === STEPS.length - 1) {
      if (isSuccess || !!checkout_receipt) {
        handle_reset();
      } else {
        // Check if patron has fines before checkout
        if (selected_patron && selected_patron.balance > 0) {
          set_patron_balance(selected_patron.balance);
          set_pending_checkout({
            patron_id: form_data.patron_id,
            copy_id: form_data.item?.id || 0,
          });
          set_fine_confirmation_open(true);
        } else {
          handle_checkout_book(false);
        }
      }
      return;
    }

    set_active_step((prev_step) => prev_step + 1);
  };

  const handle_back = () => {
    set_active_step((prev_step) => prev_step - 1);
  };

  const handle_reset = () => {
    set_active_step(0);
    set_form_data({ patron_id: 0, library_item_id: null, item: null });
    reset();
  };

  const is_next_disabled = () => {
    if (active_step === 0) return !form_data.patron_id;
    if (active_step === 1) return !form_data.item;
    return false;
  };

  const get_next_button_label = () => {
    if (active_step === STEPS.length - 1) {
      return isSuccess ? 'Reset' : 'Complete';
    }
    return 'Next';
  };

  const get_tooltip_message = () => {
    if (is_next_disabled()) {
      const missing_item =
        active_step === 0
          ? 'patron'
          : active_step === 1
          ? 'library item'
          : 'copy';
      return `Select ${missing_item} to proceed`;
    }
    if (active_step === STEPS.length - 1) {
      return isSuccess ? 'Reset' : 'Complete the transaction';
    }
    return 'Next Page';
  };

  const handle_patron_selected = (patron_id: string) => {
    set_form_data((prev) => ({ ...prev, patron_id: Number(patron_id) }));
  };

  const handle_library_item_selected = (library_item_id: number) => {
    set_form_data((prev) => ({ ...prev, library_item_id, item: null }));
  };

  const handle_copy_selected = (copy: Item_Copy_Result) => {
    reset();
    set_form_data((prev) => ({ ...prev, item: copy }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PageContainer width="xl">
        <PageTitle title="Check Out Item" Icon_Component={LibraryAdd} />

        <Stepper activeStep={active_step}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {active_step === STEPS.length ? (
          <>
            <Typography sx={{ mt: 2, mb: 1 }}>
              {"All steps completed - you're finished"}
            </Typography>
            <Stack direction={'row'} sx={{ pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handle_reset}>Reset</Button>
            </Stack>
          </>
        ) : (
          <>
            <Stack
              sx={{
                flex: 1,
                mt: 1,
                overflow: 'hidden',
              }}
            >
              {active_step === 0 && (
                <PatronsDataGrid
                  check_card_and_balance={false}
                  onPatronSelected={handle_patron_selected}
                  hidden_columns={[
                    'name_link',
                    'local_branch_id',
                    'phone',
                    'birthday',
                    'email',
                  ]}
                />
              )}
              {active_step === 1 && (
                <LibraryItemCopiesList
                  on_copy_selected={handle_copy_selected}
                  patron_id={form_data.patron_id}
                />
              )}
              {active_step === 2 && form_data.item && (
                <ConfirmCheckoutDetails
                  patron_id={form_data.patron_id}
                  copy={form_data.item}
                  was_successful={isSuccess ? true : isError ? false : null}
                  loading={loading}
                />
              )}
            </Stack>
            <Stack direction={'row'} sx={{ pt: 2 }}>
              <Button
                disabled={active_step === 0}
                onClick={handle_back}
                sx={{ mr: 1 }}
                variant="outlined"
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Tooltip
                children={
                  <span>
                    <Button
                      variant="outlined"
                      onClick={handle_next}
                      disabled={is_next_disabled()}
                    >
                      {get_next_button_label()}
                    </Button>
                  </span>
                }
                title={get_tooltip_message()}
              ></Tooltip>
            </Stack>
          </>
        )}
      </PageContainer>
      <CheckoutReceipt
        open={receipt_open}
        on_close={() => set_receipt_open(false)}
        receipt={checkout_receipt}
      />
      <FineConfirmationDialog
        open={fine_confirmation_open}
        patron_balance={patron_balance}
        on_close={() => {
          set_fine_confirmation_open(false);
          set_pending_checkout(null);
        }}
        on_confirm={() => {
          if (pending_checkout) {
            handle_checkout_book(true);
          }
        }}
      />
    </LocalizationProvider>
  );
};
