// React & Core

import { LibraryAdd } from '@mui/icons-material';

// Material-UI Components
import {
  Box,
  Button,
  Chip,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
} from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid/models/colDef';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { type FC, useCallback, useMemo, useState } from 'react';
import { useSelectedBranch } from '../hooks/useBranchHooks';
import { useCopies } from '../hooks/useCopies';
import { usePatronById } from '../hooks/usePatrons';
import { useSnackbar } from '../hooks/useSnackbar';
// Custom Hooks
import { useCheckoutBook } from '../hooks/useTransactions';

// TODO: Enable when implementing reservation filtering
// import { useReservations } from '../hooks/useReservations';

import { CheckoutReceipt } from '../components/common/CheckoutReceipt';
import { ConfirmCheckoutDetails } from '../components/common/ConfirmCheckoutDetails';
import { FineConfirmationDialog } from '../components/common/FineConfirmationDialog';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { SearchWithNameOrId } from '../components/common/SearchWithNameOrId';
import SimpleGrid from '../components/common/SimpleGrid';
import { ItemCopyConditionChip } from '../components/copies/ItemCopyConditionChip';
import { ItemCopyStatusChip } from '../components/copies/ItemCopyStatusChip';
import ItemTypeChip from '../components/library_items/ItemTypeChip';
// Custom Components
import { PatronsDataGrid } from '../components/patrons/PatronsDataGrid';

// Types
import type { Item_Copy_Result } from '../types';

// ============================================================================
// Constants & Types
// ============================================================================

const STEPS = ['Select Patron', 'Select Copy', 'Confirm Details'] as const;

interface CheckOutFormData {
  patron_id: number;
  library_item_id: number | null;
  item: Item_Copy_Result | null;
}

// ============================================================================
// Column Definitions
// ============================================================================

const COPIES_GRID_COLUMNS: GridColDef[] = [
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

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Component for displaying and selecting available library item copies
 * Includes search functionality and filtering by patron reservations
 */
const LibraryItemCopiesList: FC<{
  on_copy_selected: (copy: Item_Copy_Result) => void;
  // TODO: Add patron_id when implementing reservation filtering
  // patron_id?: number;
}> = ({ on_copy_selected }) => {
  // Branch and data hooks
  const { selected_branch } = useSelectedBranch();
  const branch_id = selected_branch?.id ?? 1;

  const { data: copies, isLoading: loading_copies } = useCopies(
    branch_id,
    'Available'
  );

  // TODO: Enable when implementing reservation filtering
  // const { data: reservations } = useReservations(_patron_id, 'ready');

  // Local state
  const [search_term, set_search_term] = useState('');

  // Filter copies based on search term
  const filtered_copies = useMemo(() => {
    if (!search_term) return copies;

    const search_lower = search_term.toLowerCase();
    return copies?.filter((copy) => {
      const searchable_fields = [
        copy.id,
        copy.title,
        copy.item_type,
        copy.current_branch_name,
        copy.owning_branch_name,
      ];

      return searchable_fields.some((value) =>
        String(value).toLowerCase().includes(search_lower)
      );
    });
  }, [copies, search_term]);

  // TODO: Implement reservation filtering/highlighting
  // Use reservations data to show which copies are reserved for this patron

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
            cols={COPIES_GRID_COLUMNS}
            loading={loading_copies}
            on_row_click={(params) => on_copy_selected(params.row)}
          />
        </Box>
      </Stack>
    </Stack>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const CheckOutItem: FC = () => {
  // ==============================
  // State Management
  // ==============================

  // Form data state
  const [form_data, set_form_data] = useState<CheckOutFormData>({
    patron_id: 0,
    library_item_id: null,
    item: null,
  });

  // Stepper state
  const [active_step, set_active_step] = useState(0);

  // Dialog states
  const [receipt_open, set_receipt_open] = useState(false);
  const [fine_confirmation_open, set_fine_confirmation_open] = useState(false);

  // Fine-related state
  const [patron_balance, set_patron_balance] = useState(0);
  const [pending_checkout, set_pending_checkout] = useState<{
    patron_id: number;
    copy_id: number;
  } | null>(null);

  // ==============================
  // Hooks
  // ==============================

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

  // ==============================
  // Event Handlers
  // ==============================

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

            show_snackbar({
              message: error_message,
              severity: 'error',
            });
            set_fine_confirmation_open(false);
            set_pending_checkout(null);
          },
        }
      );
    },
    [checkoutBook, form_data.patron_id, form_data.item?.id, show_snackbar]
  );

  const handle_next = () => {
    // If not on final step, advance to next step
    if (active_step < STEPS.length - 1) {
      set_active_step((prev) => prev + 1);
      return;
    }

    // On final step: either reset or process checkout
    if (isSuccess || checkout_receipt) {
      handle_reset();
      return;
    }

    // Check for outstanding fines before checkout
    const has_fines = selected_patron && selected_patron.balance > 0;

    if (has_fines) {
      set_patron_balance(selected_patron.balance);
      set_pending_checkout({
        patron_id: form_data.patron_id,
        copy_id: form_data.item?.id || 0,
      });
      set_fine_confirmation_open(true);
    } else {
      handle_checkout_book(false);
    }
  };

  const handle_back = () => {
    set_active_step((prev) => prev - 1);
  };

  const handle_reset = () => {
    set_active_step(0);
    set_form_data({ patron_id: 0, library_item_id: null, item: null });
    reset();
  };

  const handle_patron_selected = (patron_id: string) => {
    set_form_data((prev) => ({ ...prev, patron_id: Number(patron_id) }));
  };

  const handle_copy_selected = (copy: Item_Copy_Result) => {
    reset();
    set_form_data((prev) => ({ ...prev, item: copy }));
  };

  // ==============================
  // Computed Values
  // ==============================

  const is_next_disabled = () => {
    if (active_step === 0) return !form_data.patron_id;
    if (active_step === 1) return !form_data.item;
    return false;
  };

  const next_button_label =
    active_step === STEPS.length - 1
      ? isSuccess
        ? 'Reset'
        : 'Complete'
      : 'Next';

  const tooltip_message = (() => {
    if (is_next_disabled()) {
      const missing_item = active_step === 0 ? 'patron' : 'library item';
      return `Select ${missing_item} to proceed`;
    }
    if (active_step === STEPS.length - 1) {
      return isSuccess ? 'Reset' : 'Complete the transaction';
    }
    return 'Next Page';
  })();

  // ==============================
  // Render
  // ==============================

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
                  // TODO: Pass patron_id when implementing reservation filtering
                  // patron_id={form_data.patron_id}
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
              <Tooltip title={tooltip_message}>
                <span>
                  <Button
                    variant={
                      next_button_label === 'Complete'
                        ? 'contained'
                        : 'outlined'
                    }
                    onClick={handle_next}
                    disabled={is_next_disabled()}
                  >
                    {next_button_label}
                  </Button>
                </span>
              </Tooltip>
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
