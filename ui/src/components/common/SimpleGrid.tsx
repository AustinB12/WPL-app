import { CheckCircle } from '@mui/icons-material';
import Button from '@mui/material/Button';
import {
  DataGrid,
  type DataGridProps,
  GridActionsCell,
  GridActionsCellItem,
  type GridColDef,
} from '@mui/x-data-grid';

const default_cols: GridColDef[] = [
  { field: 'id', headerName: 'Copy ID', width: 90 },
  { field: 'title', headerName: 'Title', width: 150 },
  { field: 'status', headerName: 'Status', width: 120 },
  { field: 'condition', headerName: 'Condition', width: 120 },
  { field: 'item_type', headerName: 'Type', width: 150 },
  {
    field: 'actions',
    type: 'actions',
    width: 160,
    renderCell: (params) => (
      <GridActionsCell {...params}>
        <GridActionsCellItem
          label='Reshelve'
          icon={
            <Button
              size='small'
              variant='contained'
              color='success'
              startIcon={<CheckCircle />}
            >
              {'Reshelve'}
            </Button>
          }
          showInMenu={false}
          title='Reshelve'
        />
      </GridActionsCell>
    ),
  },
];

type Simple_Grid_Props = {
  rows: DataGridProps['rows'];
  cols?: GridColDef[];
  loading?: boolean;
  no_rows_overlay?: React.ReactNode;
  no_results_overlay?: React.ReactNode;
  overlay_height?: string;
  on_row_click?: DataGridProps['onRowClick'];
  on_row_double_click?: DataGridProps['onRowDoubleClick'];
};

export default function Simple_Grid({
  rows,
  cols,
  loading = false,
  no_rows_overlay,
  no_results_overlay,
  overlay_height,
  on_row_click,
  on_row_double_click,
}: Simple_Grid_Props) {
  return (
    <DataGrid
      density='compact'
      rows={rows}
      columns={cols || default_cols}
      loading={loading}
      disableColumnFilter
      disableColumnMenu
      disableColumnSorting
      disableDensitySelector
      disableMultipleRowSelection
      disableRowSelectionOnClick
      onRowClick={on_row_click}
      onRowDoubleClick={on_row_double_click}
      sx={{
        height: '100%',
        '--DataGrid-overlayHeight': overlay_height || '100px',
        '& .MuiDataGrid-cell:focus': {
          outline: 'none',
        },
        '& .MuiDataGrid-row:hover': {
          cursor: 'pointer',
        },
      }}
      slots={{
        noRowsOverlay: () => no_rows_overlay,
        noResultsOverlay: () => no_results_overlay,
      }}
      pageSizeOptions={[10, 20, 50]}
      initialState={{
        pagination: {
          paginationModel: {
            pageSize: 20,
          },
        },
      }}
    />
  );
}
