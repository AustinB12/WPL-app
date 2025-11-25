import { type GridColDef } from '@mui/x-data-grid';
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionStatusChip } from './TransactionStatusChip';
import { TransactionTypeChip } from './TransactionTypeChip';
import { BaseDataGrid } from '../common/BaseDataGrid';

const transaction_cols: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'title',
    headerName: 'Item',
    width: 225,
  },
  {
    field: 'patron_name',
    headerName: 'Patron',
    width: 175,
    valueGetter: (_, row) => {
      if (row.first_name && row.last_name) {
        return `${row.first_name} ${row.last_name}`;
      }
      return 'N/A';
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
    field: 'created_at',
    headerName: 'Time',
    width: 200,
    valueFormatter: (value) => (value ? new Date(value).toLocaleString() : '-'),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => <TransactionStatusChip status={params.value} />,
  },
  {
    field: 'checkout_date',
    headerName: 'Checkout Date',
    width: 150,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'due_date',
    headerName: 'Due Date',
    width: 150,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'return_date',
    headerName: 'Return Date',
    width: 150,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'fine_amount',
    headerName: 'Fine',
    width: 100,
    valueFormatter: (value) => {
      return value ? `$${Number(value).toFixed(2)}` : '$0.00';
    },
  },
  {
    field: 'owning_branch_name',
    headerName: 'Owning Branch',
    width: 200,
    editable: false,
  },
  {
    field: 'owning_branch_id',
    headerName: 'Owning Branch ID',
    width: 90,
    editable: false,
    type: 'number',
  },
  {
    field: 'current_branch_id',
    headerName: 'Current Branch ID',
    width: 90,
    editable: false,
    type: 'number',
  },
  {
    field: 'current_branch_name',
    headerName: 'Current Location',
    width: 200,
    editable: false,
    type: 'string',
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
  const { data: transactions, isLoading: loading } = useTransactions();

  return (
    <BaseDataGrid
      rows={transactions || []}
      columns={transaction_cols}
      label={label}
      loading={loading}
      hidden_columns={[
        ...hidden_columns,
        'id',
        'current_branch_id',
        'owning_branch_id',
      ]}
    />
  );
};
