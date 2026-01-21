import { ErrorOutline, Input } from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Stack,
  TextField,
  type SxProps,
  type Theme,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Activity,
  type FC,
  type SyntheticEvent,
  useCallback,
  useState,
} from 'react';
import { QuickCheckInCard } from '../components/checkin/QuickCheckInCard';
import { RecentCheckInsList } from '../components/checkin/RecentCheckInsList';
import { PageContainer, Page_Title } from '../components/common/PageBuilders';
import { useSelectedBranch } from '../hooks/use_branch_hooks';
import { useCheckedOutCopies } from '../hooks/use_copies';
import { useSnackbar } from '../hooks/use_snackbar';
import { useReturnBook } from '../hooks/use_transactions';
import type { Checkin_Receipt } from '../types/transaction_types';
import type { Item_Condition, Item_Copy_Result } from '../types/item_types';
import type { Patron } from '../types/patron_types';

interface Recent_Check_In {
  copy_id: number;
  title: string;
  timestamp: Date;
  had_fine: boolean;
  fine_amount?: number;
}

export const Check_In_Item: FC = () => {
  const [error_message, set_error_message] = useState<string | null>(null);
  const [recent_check_ins, set_recent_check_ins] = useState<Recent_Check_In[]>(
    [],
  );

  const [selected_item, set_selected_item] = useState<Item_Copy_Result | null>(
    null,
  );
  const [item_input_value, set_item_input_value] = useState('');

  const { selected_branch } = useSelectedBranch();
  const { show_snackbar } = useSnackbar();

  const { mutate: return_book, isPending: is_returning } = useReturnBook();

  const { data: checked_out_copies, isLoading: loading_checked_out_copies } =
    useCheckedOutCopies();

  // const handle_checked_out_clicked = (copy_id: number) => {
  //   set_error_message(null);
  //   set_selected_item(
  //     checked_out_copies?.find((copy) => copy.id === copy_id) || null,
  //   );
  // };

  const handle_confirm_checkin = (
    new_condition?: Item_Condition,
    notes?: string,
  ) => {
    if (!selected_item) return;

    return_book(
      {
        copy_id: selected_item.id,
        new_condition: new_condition || selected_item.condition,
        new_location_id: selected_branch?.id || selected_item.current_branch_id,
        notes: notes,
      },
      {
        onSuccess: (data: Checkin_Receipt | null) => {
          if (!data) return;
          // Add to recent check-ins
          set_recent_check_ins((prev) => [
            {
              copy_id: selected_item.id,
              title: data.title,
              timestamp: new Date(),
              had_fine: (data.fine_amount || 0) > 0,
              fine_amount: data.fine_amount,
            },
            ...prev.slice(0, 9), // Keep last 10
          ]);

          // Show success message
          const fine_message =
            data.fine_amount && data.fine_amount > 0
              ? ` Fine of $${data.fine_amount.toFixed(2)} applied.`
              : '';
          show_snackbar({
            message: `Successfully checked in "${data.title}"${fine_message}`,
            severity: 'success',
          });

          set_selected_item(null);
          set_error_message(null);
        },
        onError: (error: Error) => {
          show_snackbar({
            message: `Failed to check in: ${error.message}`,
            severity: 'error',
          });
          set_error_message(`Failed to check in: ${error.message}`);
        },
      },
    );
  };

  const handle_cancel = () => {
    set_selected_item(null);
    set_error_message(null);
  };

  const get_option_id = useCallback(
    (option: Patron | Item_Copy_Result) =>
      `${option.id}-${
        Object.hasOwn(option, 'copy_number')
          ? (option as Item_Copy_Result).copy_number
          : (option as Patron).active_checkouts
      }`,
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

  const format_item_label = useCallback(
    (option: Item_Copy_Result) =>
      `${option.title} [${option.copy_number}/${option.total_copies}]`,
    [],
  );

  const some_loading = loading_checked_out_copies || loading_checked_out_copies;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PageContainer width='xl' scroll={true}>
        <Page_Title title='Check In Item' Icon_Component={Input} />
        <Stack height={'100%'} gap={2}>
          <Autocomplete
            disabled={some_loading}
            value={selected_item}
            onChange={handle_item_change}
            inputValue={item_input_value}
            onInputChange={handle_item_input_change}
            sx={AUTOCOMPLETE_SX}
            loading={some_loading}
            options={checked_out_copies || []}
            renderInput={(params) => (
              <TextField {...params} label=' Select an item' />
            )}
            getOptionKey={get_option_id}
            getOptionLabel={format_item_label}
          />
          <Stack
            spacing={2}
            alignItems={'flex-start'}
            justifyContent={'space-between'}
            direction={'row'}
          >
            {/* <ItemReservationCard item={selected_item} /> */}

            {/* <Paper
              sx={{
                px: 4,
                py: 3,
                borderRadius: 16,
                cornerShape: 'squircle',
              }}
            >
              <Stack
                sx={{ alignSelf: 'flex-start' }}
                direction='row'
                gap={2}
                alignItems='center'
              >
                <IconButton
                  onClick={() => set_show_checked_out(!show_checked_out)}
                >
                  <ArrowUpward
                    sx={{
                      transform: show_checked_out
                        ? 'rotate(180deg)'
                        : 'rotate(0deg)',
                      transitionProperty: 'transform',
                      transitionDuration: '0.2s',
                    }}
                  />
                </IconButton>
                <Typography variant='h6' fontWeight='bold'>
                  Checked Out Copies
                </Typography>
              </Stack>
              <Collapse in={show_checked_out}>
                {!loading_checked_out_copies &&
                checked_out_copies &&
                checked_out_copies.length > 0 ? (
                  <Stack
                    direction='row'
                    gap={2}
                    flexWrap={'wrap'}
                    sx={{ my: 2 }}
                  >
                    {checked_out_copies.map((copy) => (
                      <Chip
                        sx={{
                          maxWidth: 200,
                          ['&:hover']: {
                            cursor: 'pointer',
                            boxShadow: 3,
                          },
                        }}
                        key={copy.id}
                        label={copy.id + ': ' + copy.title}
                        variant='outlined'
                        icon={get_checked_out_copy_chip_icon(
                          copy.item_type,
                          new Date(copy?.due_date || '') < new Date(),
                        )}
                        onClick={() => handle_checked_out_clicked(copy.id)}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ my: 2 }}
                  >
                    No checked out copies found.
                  </Typography>
                )}
              </Collapse>
            </Paper> */}
          </Stack>

          <Activity
            name='error-alert'
            mode={error_message ? 'visible' : 'hidden'}
          >
            <Alert
              severity='error'
              sx={{ mt: 2 }}
              icon={<ErrorOutline />}
              onClose={() => set_error_message(null)}
            >
              {error_message}
            </Alert>
          </Activity>

          {selected_item && (
            <QuickCheckInCard
              item_info={selected_item}
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

// function get_checked_out_copy_chip_icon(
//   item_type: Library_Item_Type,
//   is_overdue: boolean,
// ) {
//   const color = is_overdue ? 'error' : 'success';
//   switch (item_type) {
//     case 'BOOK':
//       return <ChromeReaderMode color={color} />;
//     case 'MAGAZINE':
//       return <MenuBook color={color} />;
//     case 'PERIODICAL':
//       return <Newspaper color={color} />;
//     case 'RECORDING':
//       return <Mic color={color} />;
//     case 'AUDIOBOOK':
//       return <ChromeReaderMode color={color} />;
//     case 'VIDEO':
//       return <YouTube color={color} />;
//     case 'CD':
//       return <Album color={color} />;
//     case 'VINYL':
//       return <Album color={color} />;
//     default:
//       return <QuestionMark color={color} />;
//   }
// }

const AUTOCOMPLETE_SX: SxProps<Theme> = {
  minWidth: { xs: 200, sm: 300 },
  width: { xs: '100%', sm: '50%' },
};
