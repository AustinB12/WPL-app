import { type GridColDef } from '@mui/x-data-grid';
import { useAllCopyTransactions } from '../../hooks/use_copies';
import { BaseDataGrid } from '../common/BaseDataGrid';
import { TransactionTypeChip } from './TransactionTypeChip';

const transaction_cols: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'title',
    headerName: 'Title',
    width: 200,
  },
  {
    field: 'item_copy_id',
    headerName: 'Copy ID',
    width: 90,
  },
  {
    field: 'patron_name',
    headerName: 'Patron',
    width: 200,
    valueGetter: (_value, row) => {
      if (row.first_name && row.last_name) {
        return `${row.first_name} ${row.last_name}`;
      }
      return '-----';
    },
  },
  {
    field: 'transaction_type',
    headerName: 'Type',
    width: 120,
    renderCell: (params) => (
      <TransactionTypeChip transaction_type={params.value} />
    ),
  },
  {
    field: 'date',
    headerName: 'Date',
    width: 225,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleString() : '-';
    },
  },
  {
    field: 'current_branch_name',
    headerName: 'Current Branch',
    width: 100,
    editable: false,
  },
  {
    field: 'owning_branch_name',
    headerName: 'Owning Branch',
    width: 100,
    editable: false,
  },
  { field: 'notes', headerName: 'Notes', width: 200 },
];

export const TransactionsDataGrid = ({
  label = 'Transactions',
  hidden_columns = [],
}: {
  label?: string;
  hidden_columns?: string[];
}) => {
  const { data, isLoading: loading, refetch } = useAllCopyTransactions();

  return (
    <BaseDataGrid
      rows={data || []}
      refetch={refetch}
      columns={transaction_cols}
      label={label}
      loading={loading}
      hidden_columns={[
        ...hidden_columns,
        'id',
        'current_branch_name',
        'owning_branch_name',
      ]}
    />
  );
};
