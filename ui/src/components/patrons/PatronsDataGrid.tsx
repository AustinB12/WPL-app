import {
  type GridColDef,
  type GridRenderCellParams,
  type GridRowSelectionModel,
} from '@mui/x-data-grid';

import { useState, type FC } from 'react';
import { useAllPatrons } from '../../hooks/usePatrons';
import { format_date, is_overdue } from '../../utils/dateUtils';
import { Alert, Box, Chip, Snackbar, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { BaseDataGrid } from '../common/BaseDataGrid';

const columns: GridColDef[] = [
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
    field: 'is_active',
    headerName: 'Status',
    flex: 1,
    minWidth: 120,
    renderCell: (params) => (
      <>
        {params.value ? (
          <Chip variant="outlined" color="success" label="Active"></Chip>
        ) : (
          <Chip variant="outlined" color="error" label="Inactive"></Chip>
        )}
      </>
    ),
  },
];

interface PatronsDataGridProps {
  cols?: GridColDef[];
  onPatronSelected?: (patronId: string) => void;
  check_overdue?: boolean;
  hidden_columns?: string[];
  just_active?: boolean;
}

export const PatronsDataGrid: FC<PatronsDataGridProps> = ({
  cols = columns,
  hidden_columns = [],
  onPatronSelected = undefined,
  check_overdue = false,
  just_active = true,
}) => {
  const { data: patrons, isLoading: loading } = useAllPatrons(just_active);

  const [snack, set_snack] = useState<boolean>(false);

  const patron_can_be_selected = (row: {
    card_expiration_date: Date;
    balance: number;
  }) => {
    if (!check_overdue) return true;
    return (
      check_overdue &&
      !is_overdue(row.card_expiration_date) &&
      !(row.balance > 0)
    );
  };

  return (
    <>
      <BaseDataGrid
        label="Patrons"
        onRowDoubleClick={(params) =>
          !patron_can_be_selected(params.row) && set_snack(true)
        }
        rows={patrons || []}
        columns={cols}
        loading={loading}
        initialState={{
          filter: {
            filterModel: {
              items: check_overdue
                ? [
                    {
                      field: 'balance',
                      operator: '=',
                      value: 0,
                    },
                  ]
                : [],
            },
          },
        }}
        disableRowSelectionOnClick={!check_overdue}
        onRowSelectionModelChange={(x) => {
          const selected_id =
            Array.from((x as GridRowSelectionModel).ids)[0]?.toString() || '';
          if (onPatronSelected) {
            onPatronSelected(selected_id);
          }
        }}
        isRowSelectable={(params) => patron_can_be_selected(params.row)}
        hidden_columns={hidden_columns}
      />
      <Snackbar
        open={snack}
        autoHideDuration={6000}
        onClose={() => set_snack(false)}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <Alert severity="info">
          {
            'Only patrons with a zero balance and a valid library card can be selected.'
          }
        </Alert>
      </Snackbar>
    </>
  );
};
