import { Stack } from '@mui/material';
import { type GridColDef } from '@mui/x-data-grid';
import ItemTypeChip from '../library_items/ItemTypeChip';
import { ItemCopyConditionChip } from '../copies/ItemCopyConditionChip';
import { useCheckedOutCopies } from '../../hooks/useCopies';
import { useSelectedBranch } from '../../hooks/useBranchHooks';
import { ItemCopyStatusChip } from '../copies/ItemCopyStatusChip';
import { BaseDataGrid } from './BaseDataGrid';

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'patron_id',
    headerName: 'P-ID',
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'member',
    headerName: 'Patron',
    width: 180,
    valueGetter: (_value, row) =>
      `${row.patron_first_name} ${row.patron_last_name}`,
  },
  {
    field: 'title',
    headerName: 'Library Item',
    width: 200,
    flex: 1,
  },
  {
    field: 'condition',
    headerName: 'Condition',
    width: 130,
    renderCell: (params) => <ItemCopyConditionChip condition={params.value} />,
  },
  {
    field: 'due_date',
    headerName: 'Due Date',
    width: 150,
    valueFormatter: (value) => {
      if (!value) return '?';
      return value;
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => (
      <Stack sx={{ height: 1 }} direction={'row'} gap={1} alignItems={'center'}>
        {new Date(params.row.due_date) < new Date() ? (
          <ItemCopyStatusChip status="Overdue" />
        ) : (
          <ItemCopyStatusChip status="Checked Out" />
        )}
      </Stack>
    ),
  },
  {
    field: 'item_type',
    headerName: 'Type',
    width: 100,
    renderCell: (params) => <ItemTypeChip item_type={params.value} />,
  },
  { field: 'branch_name', headerName: 'Branch', width: 200 },
];

export const CheckedOutItemsGrid = ({
  select_item_copy,
  hidden_columns = [],
}: {
  select_item_copy: (copy_id: number) => void;
  hidden_columns?: string[];
}) => {
  const { selected_branch } = useSelectedBranch();
  const { data: checked_out_copies, isLoading } = useCheckedOutCopies(
    selected_branch?.id || 1
  );
  return (
    <BaseDataGrid
      rows={checked_out_copies || []}
      columns={columns}
      loading={isLoading}
      pageSizeOptions={[15, 30, 50]}
      initialState={{
        pagination: { paginationModel: { pageSize: 15 } },
      }}
      onRowClick={(params) => select_item_copy(params.row.id)}
      hidden_columns={hidden_columns}
    />
  );
};
