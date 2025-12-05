import { Delete, Edit, PersonAdd } from '@mui/icons-material';
import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material';
import {
  GridActionsCellItem,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowSelectionModel,
} from '@mui/x-data-grid';
import { type FC, useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAllPatrons,
  useCreatePatron,
  useDeletePatronById,
  useUpdatePatron,
} from '../../hooks/usePatrons';
import { useSnackbar } from '../../hooks/useSnackbar';
import type {
  Create_Patron_Data,
  Patron,
  Update_Patron_Data,
} from '../../types';
import { is_overdue } from '../../utils/dateUtils';
import { BaseDataGrid } from '../common/BaseDataGrid';
import { SearchWithNameOrId } from '../common/SearchWithNameOrId';
import { DeletePatronModal } from './DeletePatronModal';
import { EditPatronModal } from './EditPatronModal';
import New_Patron_Modal from './NewPatronModal';
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
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar
          sx={{
            bgcolor:
              params.row.last_name.length > 6
                ? 'primary.main'
                : 'secondary.main',
          }}
          src={params.row.image_url || ''}
        >
          {`${params.row.first_name?.charAt(0) || ''}${
            params.row.last_name?.charAt(0) || ''
          }`}
        </Avatar>
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
      </Stack>
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
      return new Date(value).toLocaleDateString();
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
      return new Date(value).toLocaleDateString();
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
    width: 120,
    renderCell: (params: GridRenderCellParams) => {
      const count = params.value || 0;
      const tooMany = count >= 20;
      return (
        <Chip
          label={`${count} / 20`}
          color={tooMany ? 'error' : 'success'}
          variant="filled"
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
  { field: 'local_branch_id', headerName: 'Local Branch ID', width: 100 },
  { field: 'local_branch_name', headerName: 'Local Branch', width: 200 },
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
}) => {
  const { show_snackbar } = useSnackbar();
  const [search_term, set_search_term] = useState('');
  const deferred_search_term = useDeferredValue(search_term);

  const [dialog_open, set_dialog_open] = useState(false);
  const [edit_modal_open, set_edit_modal_open] = useState(false);
  const [delete_modal_open, set_delete_modal_open] = useState(false);
  const [selected_patron, set_selected_patron] = useState<Patron | null>(null);

  const { mutate: create_patron } = useCreatePatron({
    onSuccess: () => {
      show_snackbar({
        message: 'Patron created successfully!',
        severity: 'success',
        title: 'Success!',
      });
      set_dialog_open(false);
      refetch();
    },
    onError: (error: Error) => {
      show_snackbar({
        message: error.message || 'Failed to create patron',
        severity: 'error',
        title: 'Error!',
      });
    },
  });

  const update_patron_mutation = useUpdatePatron({
    onSuccess: () => {
      show_snackbar({
        message: 'Patron updated successfully!',
        severity: 'success',
        title: 'Success!',
      });
      set_edit_modal_open(false);
      set_selected_patron(null);
    },
    onError: (error: Error) => {
      show_snackbar({
        message: error.message || 'Failed to update patron',
        severity: 'error',
        title: 'Error!',
      });
    },
  });

  const delete_patron_mutation = useDeletePatronById({
    onSuccess: () => {
      show_snackbar({
        message: 'Patron deleted successfully!',
        severity: 'success',
        title: 'Success!',
      });
      set_delete_modal_open(false);
      set_selected_patron(null);
    },
    onError: (error: Error) => {
      show_snackbar({
        message: error.message || 'Failed to delete patron',
        severity: 'error',
        title: 'Error!',
      });
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
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <BaseDataGrid
          label="Patrons"
          rows={filtered_patrons}
          columns={final_columns}
          loading={loading}
          onRowSelectionModelChange={(x) => {
            const selected_id =
              Array.from((x as GridRowSelectionModel).ids)[0]?.toString() || '';
            if (onPatronSelected) {
              onPatronSelected(selected_id);
            }
          }}
          slots={{ noRowsOverlay: NoResultsOverlay }}
          hidden_columns={hidden_columns}
        />
      </Box>
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
    </>
  );
};
