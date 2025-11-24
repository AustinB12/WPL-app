import {
  GridActionsCellItem,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowSelectionModel,
} from '@mui/x-data-grid';
import { useDeferredValue, useState, type FC } from 'react';
import { format_date, is_overdue } from '../../utils/dateUtils';
import {
  Alert,
  Box,
  Chip,
  Snackbar,
  Typography,
  Stack,
  Button,
  AlertTitle,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { BaseDataGrid } from '../common/BaseDataGrid';
import { Delete, Edit, PersonAdd } from '@mui/icons-material';
import {
  useAllPatrons,
  useCreatePatron,
  useUpdatePatron,
  useDeletePatronById,
} from '../../hooks/usePatrons';
import New_Patron_Modal from './NewPatronModal';
import { EditPatronModal } from './EditPatronModal';
import { DeletePatronModal } from './DeletePatronModal';
import type {
  Create_Patron_Data,
  Update_Patron_Data,
  Patron,
} from '../../types';
import { SearchWithNameOrId } from '../common/SearchWithNameOrId';
import { PatronsStatusChip } from './PatronsStatusChip';

const NoResultsOverlay = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Typography variant="h6" color="text.secondary">
        No results found
      </Typography>
    </Box>
  );
};

const create_columns = (
  handle_edit: (patron_id: number) => void,
  handle_delete: (patron_id: number) => void
): GridColDef[] => [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
  },
  {
    field: 'name_link',
    headerName: 'Name',
    flex: 2,
    renderCell: (params: GridRenderCellParams) => (
      <Link
        to={`/patron/${params.row.id}`}
        style={{ textDecoration: 'none', height: '100%', display: 'block' }}
      >
        <Typography
          sx={(theme) => ({
            textDecoration: 'none',
            color: `color-mix(in srgb, ${theme.palette.primary.main} 20%, ${theme.palette.text.primary} 80%)`,
            display: 'inline',
            fontWeight: 500,
          })}
        >{`${params.row.first_name} ${params.row.last_name}`}</Typography>
      </Link>
    ),
  },
  {
    field: 'patron_name',
    headerName: 'Name',
    flex: 2,
    valueGetter: (_value, row) => `${row.first_name} ${row.last_name}`,
  },
  {
    field: 'balance',
    headerName: 'Balance',
    align: 'left',
    headerAlign: 'left',
    type: 'number',
    width: 150,
    valueFormatter: (value) =>
      value === null || value === undefined
        ? '$0.00'
        : `$${Number(value).toFixed(2)}`,
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          color: params.value > 0 ? 'warning.main' : 'inherit',
        }}
      >
        {`$${params.value.toFixed(2)}`}
      </Box>
    ),
  },
  {
    field: 'birthday',
    headerName: 'Birthday',
    valueGetter: (value) => {
      if (!value || typeof value !== 'string') return '(No birthdate listed)';
      if (typeof value === 'string' && (value as string).length !== 10) {
        if ((value as string).includes('T')) {
          return format_date((value as string).split('T')[0]);
        }
        return '(Invalid Format)';
      }
      return format_date(value);
    },
    flex: 2,
    renderCell: (params: GridRenderCellParams) => <Box>{params.value}</Box>,
  },
  {
    field: 'card_expiration_date',
    headerName: 'Card Expiration',
    valueGetter: (value) => {
      if (!value || typeof value !== 'string')
        return '(No expiration date listed)';
      return format_date(value);
    },
    flex: 2,
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          color: !is_overdue(params.value) ? 'inherit' : 'error.main',
        }}
      >
        {params.value}
      </Box>
    ),
  },
  { field: 'email', headerName: 'Email', flex: 2 },
  { field: 'phone', headerName: 'Phone #', flex: 2 },
  {
    field: 'active_checkouts',
    headerName: 'Checked Out',
    flex: 1,
    renderCell: (params: GridRenderCellParams) => {
      const count = params.value || 0;
      const tooMany = count >= 20;
      return (
        <Chip
          label={`${count} / 20`}
          size="small"
          color={tooMany ? 'error' : 'default'}
          variant={tooMany ? 'filled' : 'outlined'}
        />
      );
    },
  },
  {
    field: 'is_active',
    headerName: 'Status',
    flex: 1,
    renderCell: (params) => (
      <PatronsStatusChip status={params.value as boolean} />
    ),
  },
  {
    field: 'actions',
    type: 'actions',
    width: 60,
    getActions: (params) => [
      <GridActionsCellItem
        icon={<Edit />}
        label="Edit"
        onClick={() => handle_edit(Number(params.id))}
        showInMenu
      />,
      <GridActionsCellItem
        icon={<Delete />}
        label="Delete"
        onClick={() => handle_delete(Number(params.id))}
        showInMenu
      />,
    ],
  },
];

interface PatronsDataGridProps {
  cols?: GridColDef[];
  onPatronSelected?: (patronId: string) => void;
  check_card_and_balance?: boolean;
  hidden_columns?: string[];
  just_active?: boolean;
}

export const PatronsDataGrid: FC<PatronsDataGridProps> = ({
  cols,
  hidden_columns = [],
  onPatronSelected = undefined,
  check_card_and_balance = false,
}) => {
  const [success_snack, set_success_snack] = useState('');
  const [error_snack, set_error_snack] = useState('');
  const [info_snack, set_info_snack] = useState('');
  const [search_term, set_search_term] = useState('');
  const deferred_search_term = useDeferredValue(search_term);

  const [dialog_open, set_dialog_open] = useState(false);
  const [edit_modal_open, set_edit_modal_open] = useState(false);
  const [delete_modal_open, set_delete_modal_open] = useState(false);
  const [selected_patron, set_selected_patron] = useState<Patron | null>(null);

  const { mutate: create_patron } = useCreatePatron({
    onSuccess: () => {
      set_success_snack('Patron created successfully!');
      set_dialog_open(false);
      refetch();
    },
    onError: (error: Error) => {
      set_error_snack(error.message || 'Failed to create patron');
    },
  });

  const update_patron_mutation = useUpdatePatron({
    onSuccess: () => {
      set_success_snack('Patron updated successfully!');
      set_edit_modal_open(false);
      set_selected_patron(null);
    },
    onError: (error: Error) => {
      set_error_snack(error.message || 'Failed to update patron');
    },
  });

  const delete_patron_mutation = useDeletePatronById({
    onSuccess: () => {
      set_success_snack('Patron deleted successfully!');
      set_delete_modal_open(false);
      set_selected_patron(null);
    },
    onError: (error: Error) => {
      set_error_snack(error.message || 'Failed to delete patron');
    },
  });

  const handle_create_patron = (patron_data: Create_Patron_Data) => {
    create_patron(patron_data);
  };

  const handle_edit_patron = (patron_id: number) => {
    const patron = all_patrons?.find((p) => p.id === patron_id);
    if (patron) {
      set_selected_patron(patron);
      set_edit_modal_open(true);
    }
  };

  const handle_delete_patron = (patron_id: number) => {
    const patron = all_patrons?.find((p) => p.id === patron_id);
    if (patron) {
      set_selected_patron(patron);
      set_delete_modal_open(true);
    }
  };

  const handle_save_patron = (patron_data: Update_Patron_Data) => {
    if (selected_patron) {
      update_patron_mutation.mutate({
        patron_id: selected_patron.id,
        patron_data,
      });
    }
  };

  const handle_confirm_delete = () => {
    if (selected_patron) {
      delete_patron_mutation.mutate(selected_patron.id);
    }
  };

  // Get all patrons if not provided
  const { data: all_patrons, isLoading: loading, refetch } = useAllPatrons();

  // Create columns with handlers
  const columns_with_actions = create_columns(
    handle_edit_patron,
    handle_delete_patron
  );

  // Use provided columns or default columns with actions
  const final_columns = cols || columns_with_actions;

  // Filter patrons based on search term
  const filtered_patrons = all_patrons?.filter((patron) => {
    const trimmedSearch = deferred_search_term.trim();
    if (!trimmedSearch) return true;

    const search = trimmedSearch.toLowerCase();
    const full_name = `${patron.first_name} ${patron.last_name}`.toLowerCase();

    return (
      patron.id.toString().includes(search) ||
      patron.first_name?.toLowerCase().includes(search) ||
      patron.last_name?.toLowerCase().includes(search) ||
      full_name.includes(search)
    );
  });

  const patron_can_be_selected = (row: {
    id: number;
    card_expiration_date: Date;
    balance: number;
    active_checkouts?: number;
  }) => {
    if (!check_card_and_balance) return true;

    // Check eligibility criteria - allow fines (will prompt to clear at checkout), but block expired cards and 20+ books
    const has_valid_card = !is_overdue(row.card_expiration_date);
    const under_book_limit = (row.active_checkouts || 0) < 20;

    return has_valid_card && under_book_limit;
  };

  const get_selection_error_message = (row: {
    card_expiration_date: Date;
    active_checkouts?: number;
  }) => {
    if (!check_card_and_balance) return '';

    const has_valid_card = !is_overdue(row.card_expiration_date);
    const under_book_limit = (row.active_checkouts || 0) < 20;

    if (!has_valid_card) {
      return 'Patron has an expired library card. Card must be renewed before checkout.';
    }
    if (!under_book_limit) {
      return 'Patron has reached the maximum limit of 20 checked out items.';
    }
    return '';
  };

  return (
    <>
      <Stack direction={'row'} sx={{ mb: 2 }} spacing={3}>
        <SearchWithNameOrId
          search_term={search_term}
          set_search_term={set_search_term}
        />
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => set_dialog_open(true)}
          sx={{ textWrap: 'nowrap', ml: 2, px: 4 }}
        >
          Create Patron
        </Button>
      </Stack>

      <BaseDataGrid
        label="Patrons"
        onRowDoubleClick={(params) =>
          !patron_can_be_selected(params.row) &&
          set_info_snack(get_selection_error_message(params.row))
        }
        rows={filtered_patrons}
        columns={final_columns}
        loading={loading}
        disableRowSelectionOnClick={!check_card_and_balance}
        onRowSelectionModelChange={(x) => {
          const selected_id =
            Array.from((x as GridRowSelectionModel).ids)[0]?.toString() || '';
          if (onPatronSelected) {
            onPatronSelected(selected_id);
          }
        }}
        slots={{ noRowsOverlay: NoResultsOverlay }}
        isRowSelectable={(params) => patron_can_be_selected(params.row)}
        hidden_columns={hidden_columns}
      />
      <New_Patron_Modal
        open={dialog_open}
        on_close={() => set_dialog_open(false)}
        on_submit={handle_create_patron}
      />
      <EditPatronModal
        open={edit_modal_open}
        patron={selected_patron}
        on_close={() => {
          set_edit_modal_open(false);
          set_selected_patron(null);
        }}
        on_save={handle_save_patron}
        is_loading={update_patron_mutation.isPending}
      />
      <DeletePatronModal
        open={delete_modal_open}
        patron={selected_patron}
        on_close={() => {
          set_delete_modal_open(false);
          set_selected_patron(null);
        }}
        on_confirm={handle_confirm_delete}
        is_loading={delete_patron_mutation.isPending}
      />
      <Snackbar
        open={Boolean(info_snack)}
        autoHideDuration={6000}
        onClose={() => set_info_snack('')}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Alert
          variant="filled"
          severity="info"
          onClose={() => set_info_snack('')}
        >
          {info_snack}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(success_snack)}
        autoHideDuration={6000}
        onClose={() => set_success_snack('')}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Alert
          variant="filled"
          severity="success"
          onClose={() => set_success_snack('')}
        >
          <AlertTitle sx={{ color: 'inherit' }}>Success!</AlertTitle>
          {success_snack}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(error_snack)}
        autoHideDuration={6000}
        onClose={() => set_error_snack('')}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Alert
          variant="filled"
          severity="error"
          onClose={() => set_error_snack('')}
        >
          <AlertTitle sx={{ color: 'inherit' }}>Error!</AlertTitle>
          {error_snack}
        </Alert>
      </Snackbar>
    </>
  );
};
