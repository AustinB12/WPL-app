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
      return 'LIBRARIAN';
    },
  },
  {
    field: 'transaction_type',
    headerName: 'Type',
    width: 120,
    renderCell: (params) => <TransactionTypeChip status={params.value} />,
  },
  {
    field: 'created_at',
    headerName: 'Time',
    width: 200,
    valueFormatter: (value) => (value ? new Date(value).toLocaleString() : '-'),
  },
  {
    field: 'checkout_date',
    headerName: 'Checkout Date',
    width: 160,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'due_date',
    headerName: 'Due Date',
    width: 160,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'return_date',
    headerName: 'Return Date',
    width: 160,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : '-';
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) => <TransactionStatusChip status={params.value} />,
  },
  {
    field: 'fine_amount',
    headerName: 'Fine',
    width: 100,
    valueFormatter: (value) => {
      return value ? `$${Number(value).toFixed(2)}` : '$0.00';
    },
  },
];

export const TransactionsDataGrid = ({
  label = 'Transactions',
}: {
  label?: string;
}) => {
  const { data: transactions, isLoading: loading } = useTransactions();

  return (
    <BaseDataGrid
      rows={transactions || []}
      columns={transaction_cols}
      label={label}
      loading={loading}
      hidden_columns={['id']}
    />
  );
};
