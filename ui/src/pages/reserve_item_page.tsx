import { EventNote } from '@mui/icons-material';
import {
  Autocomplete,
  Fab,
  LinearProgress,
  Stack,
  type SxProps,
  TextField,
  type Theme,
} from '@mui/material';
import { Activity, type SyntheticEvent, useCallback, useState } from 'react';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { ItemReservationCard } from '../components/reservations/ItemReservationCard';
import { Patron_Reservation_Card } from '../components/reservations/PatronReservationCard';
import { useCheckedOutCopies } from '../hooks/use_copies';
import { useAllPatrons } from '../hooks/use_patrons';
import { useCreateReservation } from '../hooks/use_reservations';
import { useSnackbar } from '../hooks/use_snackbar';
import type { Item_Copy_Result } from '../types/item_types';
import type { Patron } from '../types/patron_types';

const AUTOCOMPLETE_SX: SxProps<Theme> = {
  flex: 1,
  minWidth: { xs: 200, sm: 300 },
  width: { xs: '100%', sm: 'auto' },
};

const COLUMN_STACK_SX: SxProps<Theme> = {
  flex: 1,
  width: { xs: '100%', sm: 'auto' },
};

const FAB_SX: SxProps<Theme> = {
  textAlign: 'right',
  position: 'absolute',
  bottom: 16,
  right: 16,
};

export const ReserveItemPage = () => {
  return (
    <PageContainer
      width='xl'
      sx={{ maxHeight: 'calc(100dvh - 64px)' }}
      scroll={true}
    >
      <PageTitle title='Reserve Item' Icon_Component={EventNote} />
      <Reserve_Item_Content />
    </PageContainer>
  );
};

const Reserve_Item_Content = () => {
  const { data: patrons, isLoading: patrons_loading } = useAllPatrons();
  const { data: checked_out_copies, isLoading: copies_loading } =
    useCheckedOutCopies();
  const { show_snackbar } = useSnackbar();

  const [selected_patron, set_selected_patron] = useState<Patron | null>(null);
  const [patron_input_value, set_patron_input_value] = useState('');

  const [selected_item, set_selected_item] = useState<Item_Copy_Result | null>(
    null
  );
  const [item_input_value, set_item_input_value] = useState('');

  const handle_success = useCallback(() => {
    const message = 'Reservation created successfully';
    show_snackbar({ message, severity: 'success' });

    // Reset form
    set_selected_patron(null);
    set_selected_item(null);
    set_patron_input_value('');
    set_item_input_value('');
  }, [show_snackbar]);

  // Mutation error handler
  const handle_error = useCallback(
    (error: Error) => {
      const error_message = error.message || 'Failed to create reservation';
      show_snackbar({ message: error_message, severity: 'error' });
    },
    [show_snackbar]
  );

  // Reservation mutation
  const { mutate: create_reservation, isPending: creating_reservation } =
    useCreateReservation();

  // Patron autocomplete handlers
  const handle_patron_change = useCallback(
    (_event: SyntheticEvent, new_value: Patron | null) => {
      set_selected_patron(new_value);
    },
    []
  );

  const handle_patron_input_change = useCallback(
    (_event: SyntheticEvent, new_input_value: string) => {
      set_patron_input_value(new_input_value);
    },
    []
  );

  // Item autocomplete handlers
  const handle_item_change = useCallback(
    (_event: SyntheticEvent, new_value: Item_Copy_Result | null) => {
      set_selected_item(new_value);
    },
    []
  );

  const handle_item_input_change = useCallback(
    (_event: SyntheticEvent, new_input_value: string) => {
      set_item_input_value(new_input_value);
    },
    []
  );

  // Form submission handler
  const handle_reserve_click = useCallback(() => {
    if (selected_patron && selected_item) {
      create_reservation(
        {
          patron_id: selected_patron.id,
          item_copy_id: selected_item.id,
        },
        { onSuccess: handle_success, onError: handle_error }
      );
    }
  }, [
    selected_patron,
    selected_item,
    create_reservation,
    handle_error,
    handle_success,
  ]);

  // Autocomplete formatters
  const format_patron_label = useCallback(
    (option: Patron) => `${option.first_name} ${option.last_name}`,
    []
  );

  const format_item_label = useCallback(
    (option: Item_Copy_Result) =>
      `${option.title} [${option.copy_number}/${option.total_copies}]`,
    []
  );

  const get_option_id = useCallback(
    (option: Patron | Item_Copy_Result) =>
      `${option.id}-${
        Object.hasOwn(option, 'copy_number')
          ? (option as Item_Copy_Result).copy_number
          : (option as Patron).active_checkouts
      }`,
    []
  );

  const is_form_valid =
    selected_patron && selected_item && !creating_reservation;

  return (
    <Stack gap={2} sx={{ flex: 1, pt: 1 }}>
      {/* Selection Section */}
      <Stack
        gap={2}
        direction={{ xs: 'column', sm: 'row' }}
        alignItems='flex-start'
        sx={{ p: 1 }}
      >
        {/* Patron Selection Column */}
        <Stack gap={2} sx={COLUMN_STACK_SX} alignItems='flex-end'>
          <Autocomplete
            disabled={creating_reservation}
            value={selected_patron}
            onChange={handle_patron_change}
            inputValue={patron_input_value}
            onInputChange={handle_patron_input_change}
            sx={AUTOCOMPLETE_SX}
            loading={patrons_loading}
            options={patrons || []}
            renderInput={(params) => <TextField {...params} label='Patron' />}
            getOptionKey={get_option_id}
            getOptionLabel={format_patron_label}
          />
          <Patron_Reservation_Card patron={selected_patron} />
        </Stack>

        {/* Item Selection Column */}
        <Stack gap={2} sx={COLUMN_STACK_SX} alignItems='flex-start'>
          <Autocomplete
            disabled={creating_reservation}
            value={selected_item}
            onChange={handle_item_change}
            inputValue={item_input_value}
            onInputChange={handle_item_input_change}
            sx={AUTOCOMPLETE_SX}
            loading={copies_loading}
            options={checked_out_copies || []}
            renderInput={(params) => <TextField {...params} label='Item' />}
            getOptionKey={get_option_id}
            getOptionLabel={format_item_label}
          />
          <ItemReservationCard item={selected_item} />
        </Stack>
      </Stack>

      <Activity mode={creating_reservation ? 'visible' : 'hidden'}>
        <LinearProgress sx={{ width: '80%', alignSelf: 'center' }} />
      </Activity>

      <Fab
        disabled={!is_form_valid}
        onClick={handle_reserve_click}
        variant='extended'
        color='primary'
        sx={FAB_SX}
      >
        <EventNote sx={{ mr: 1 }} />
        Reserve
      </Fab>
    </Stack>
  );
};
