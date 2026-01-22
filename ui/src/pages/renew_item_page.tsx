import { Autorenew } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import dayjs from 'dayjs';
import { type SyntheticEvent, useCallback, useState } from 'react';
import { PageContainer, Page_Title } from '../components/common/PageBuilders';
import Item_Type_Chip from '../components/library_items/ItemTypeChip';
import {
  Recent_Renewals_List,
  type Recent_Renewal,
} from '../components/renewals/Recent_Renewals_List';
import { Renewal_Info_Card } from '../components/renewals/Renewal_Info_Card';
import { useCheckedOutCopies } from '../hooks/use_copies';
import { useSnackbar } from '../hooks/use_snackbar';
import { useRenewItem } from '../hooks/use_transactions';
import type { Item_Copy_Result } from '../types/item_types';
import type { Renewal_Response } from '../types/transaction_types';

export function Renew_Item_Page() {
  const [selected_item, set_selected_item] = useState<Item_Copy_Result | null>(
    null,
  );
  const [item_input_value, set_item_input_value] = useState('');
  const [recent_renewals, set_recent_renewals] = useState<Recent_Renewal[]>([]);

  const { show_snackbar } = useSnackbar();
  const {
    data: checked_out_copies,
    isLoading: loading_copies,
    refetch: refetch_checked_out,
    isRefetching: refetching_checked_out,
    isSuccess: checked_out_success,
  } = useCheckedOutCopies();
  const { mutate: renew_item, isPending: is_renewing } = useRenewItem();

  const handle_renew = () => {
    if (!selected_item) return;

    renew_item(
      { copy_id: selected_item.id },
      {
        onSuccess: (data: Renewal_Response) => {
          // Add to recent renewals
          set_recent_renewals((prev) => [
            {
              copy_id: selected_item.id,
              title: data.item.title,
              timestamp: new Date(),
              new_due_date: data.new_due_date,
              renewal_status: data.renewal_status,
            },
            ...prev.slice(0, 9), // Keep last 10
          ]);

          show_snackbar({
            message: `Successfully renewed "${
              data.item.title
            }". New due date: ${dayjs(data.new_due_date).format(
              'MMM D, YYYY',
            )}`,
            severity: 'success',
          });

          // Clear selection after successful renewal
          set_selected_item(null);
          set_item_input_value('');
        },
        onError: (error: Error) => {
          show_snackbar({
            message: `Failed to renew: ${error.message}`,
            severity: 'error',
          });
        },
      },
    );
  };

  const handle_refresh = () => {
    set_selected_item(null);
    set_item_input_value('');
    refetch_checked_out().then(() => {
      show_snackbar({
        message: checked_out_success
          ? 'Checked-out items list refreshed successfully'
          : 'Failed to refresh checked-out items list',
        severity: checked_out_success ? 'success' : 'error',
      });
    });
  };

  const format_item_label = useCallback(
    (option: Item_Copy_Result) =>
      `${option.title} [Copy ${option.copy_number}/${option.total_copies}] - ${option.patron_first_name} ${option.patron_last_name}`,
    [],
  );

  // Item autocomplete handlers
  const handle_item_change = useCallback(
    (_event: SyntheticEvent, new_value: Item_Copy_Result | null) => {
      set_selected_item(new_value);
    },
    [],
  );

  const handle_item_input_change = useCallback(
    (_event: SyntheticEvent, new_input_value: string) => {
      set_item_input_value(new_input_value);
    },
    [],
  );

  const handle_cancel = useCallback(() => {
    set_selected_item(null);
    set_item_input_value('');
  }, []);

  const get_option_id = useCallback(
    (option: Item_Copy_Result) => `${option.id}-${option.copy_number}`,
    [],
  );

  return (
    <PageContainer width='xl' scroll={true}>
      <Page_Title title='Renew Item' Icon_Component={Autorenew} />
      <Stack spacing={3}>
        <Stack direction='row' alignItems='center' spacing={1}>
          {/* Item Selection Autocomplete */}
          <Autocomplete
            value={selected_item}
            onChange={handle_item_change}
            inputValue={item_input_value}
            onInputChange={handle_item_input_change}
            sx={AUTOCOMPLETE_SX}
            loading={loading_copies || refetching_checked_out}
            loadingText={'Loading checked-out items...'}
            options={checked_out_copies || []}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Select a checked-out item to renew'
                placeholder='Search by title or patron name...'
              />
            )}
            getOptionKey={get_option_id}
            getOptionLabel={format_item_label}
            renderOption={(props, option) => (
              <Box component='li' {...props} key={get_option_id(option)}>
                <Stack spacing={0.5} sx={{ width: '100%' }}>
                  <Typography variant='body1' fontWeight={600}>
                    {option.title}
                  </Typography>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Item_Type_Chip item_type={option.item_type} />
                    <Typography variant='caption' color='text.secondary'>
                      Copy {option.copy_number}/{option.total_copies}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      •
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {option.patron_first_name} {option.patron_last_name}
                    </Typography>
                    {option.due_date && (
                      <>
                        <Typography variant='caption' color='text.secondary'>
                          -
                        </Typography>
                        <Typography
                          variant='caption'
                          color={
                            new Date(option.due_date) < new Date()
                              ? 'error'
                              : 'text.secondary'
                          }
                        >
                          Due: {dayjs(option.due_date).format('MMM D')}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </Stack>
              </Box>
            )}
            noOptionsText='No checked-out items found'
          />
          <Button variant='outlined' size='large' onClick={handle_refresh}>
            {'Refresh List'}
          </Button>
        </Stack>

        {/* Selected Item Details */}
        {selected_item && (
          <Renewal_Info_Card
            selected_item={selected_item}
            is_renewing={is_renewing}
            on_cancel={handle_cancel}
            on_renew={handle_renew}
          />
        )}

        {/* Recent Renewals List */}
        <Recent_Renewals_List renewals={recent_renewals} />
      </Stack>
    </PageContainer>
  );
}

const AUTOCOMPLETE_SX: SxProps<Theme> = {
  minWidth: { xs: 200, sm: 400 },
  width: { xs: '100%', sm: '70%' },
};
