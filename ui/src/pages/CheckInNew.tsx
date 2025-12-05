import { ErrorOutline, Input } from '@mui/icons-material';
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { type FC, useEffect, useRef, useState } from 'react';
import { QuickCheckInCard } from '../components/checkin/QuickCheckInCard';
import { RecentCheckInsList } from '../components/checkin/RecentCheckInsList';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { useSelectedBranch } from '../hooks/useBranchHooks';
import { useCopyById } from '../hooks/useCopies';
import { useReturnBook } from '../hooks/useTransactions';
import type { Checkin_Receipt, Item_Condition } from '../types';

interface RecentCheckIn {
  copy_id: number;
  title: string;
  timestamp: Date;
  had_fine: boolean;
  fine_amount?: number;
}

export const CheckInNew: FC = () => {
  const [barcode_input, set_barcode_input] = useState('');
  const [error_message, set_error_message] = useState<string | null>(null);
  const [recent_check_ins, set_recent_check_ins] = useState<RecentCheckIn[]>(
    []
  );
  const barcode_input_ref = useRef<HTMLInputElement>(null);

  const { selected_branch } = useSelectedBranch();

  const {
    data: item_info,
    isLoading: loading_item,
    refetch: fetch_item_details,
    error: item_error,
  } = useCopyById(barcode_input ? parseInt(barcode_input) : null, {
    lazy: true,
  });

  const { mutate: return_book, isPending: is_returning } = useReturnBook();

  // Auto-focus barcode input on mount
  useEffect(() => {
    barcode_input_ref.current?.focus();
  }, []);

  // Handle errors
  useEffect(() => {
    if (item_error) {
      set_error_message(
        'Copy not found. Please check the barcode and try again.'
      );
    }
  }, [item_error]);

  const handle_barcode_submit = () => {
    const copy_id = parseInt(barcode_input);
    if (isNaN(copy_id) || copy_id <= 0) {
      set_error_message('Please enter a valid Copy ID (Barcode)');
      return;
    }
    fetch_item_details();
  };

  const handle_confirm_checkin = (
    new_condition?: Item_Condition,
    notes?: string
  ) => {
    if (!item_info) return;

    return_book(
      {
        copy_id: item_info.id,
        new_condition: new_condition || item_info.condition,
        new_location_id: selected_branch?.id || item_info.branch_id,
        notes: notes,
      },
      {
        onSuccess: (data: Checkin_Receipt | null) => {
          if (!data) return;
          // Add to recent check-ins
          set_recent_check_ins((prev) => [
            {
              copy_id: item_info.id,
              title: data.title,
              timestamp: new Date(),
              had_fine: (data.fine_amount || 0) > 0,
              fine_amount: data.fine_amount,
            },
            ...prev.slice(0, 9), // Keep last 10
          ]);

          // Clear form and refocus
          set_barcode_input('');
          set_error_message(null);
          barcode_input_ref.current?.focus();
        },
        onError: (error: Error) => {
          set_error_message(`Failed to check in: ${error.message}`);
        },
      }
    );
  };

  const handle_cancel = () => {
    set_barcode_input('');
    set_error_message(null);
    barcode_input_ref.current?.focus();
  };

  const has_valid_item = item_info && !error_message;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PageContainer width="xl">
        <PageTitle title="Check In Item" Icon_Component={Input} />

        <Stack spacing={3}>
          {/* Barcode Input Section */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Scan or Enter Copy ID
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scan the barcode or manually enter the Copy ID to check in an
              item.
            </Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                inputRef={barcode_input_ref}
                label="Copy ID"
                value={barcode_input}
                onChange={(e) => set_barcode_input(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handle_barcode_submit();
                  } else if (e.key === 'Escape') {
                    handle_cancel();
                  }
                }}
                placeholder="Enter Copy ID"
                type="number"
                fullWidth
                error={!!error_message}
                disabled={loading_item || is_returning}
                autoFocus
              />
              <Button
                variant="contained"
                onClick={handle_barcode_submit}
                disabled={!barcode_input || loading_item || is_returning}
                sx={{ minWidth: 120 }}
                startIcon={loading_item ? <CircularProgress size={20} /> : null}
              >
                {loading_item ? 'Searching...' : 'Lookup'}
              </Button>
            </Stack>

            {error_message && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                icon={<ErrorOutline />}
                onClose={() => set_error_message(null)}
              >
                {error_message}
              </Alert>
            )}
          </Paper>

          {/* Item Preview Card */}
          {has_valid_item && (
            <QuickCheckInCard
              item_info={item_info}
              on_confirm={handle_confirm_checkin}
              on_cancel={handle_cancel}
              is_processing={is_returning}
            />
          )}

          {/* Recent Check-Ins */}
          {recent_check_ins.length > 0 && (
            <RecentCheckInsList check_ins={recent_check_ins} />
          )}
        </Stack>
      </PageContainer>
    </LocalizationProvider>
  );
};
