import { type GridColDef } from "@mui/x-data-grid";
import { BaseDataGrid } from "../common/BaseDataGrid";
import { TransactionTypeChip } from "./TransactionTypeChip";
import { useAllCopyTransactions } from "../../hooks/useCopies";

const transaction_cols: GridColDef[] = [
  {
    field: "id",
    headerName: "ID",
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: "item_copy_id",
    headerName: "Copy ID",
    width: 90,
  },
  {
    field: "patron_id",
    headerName: "Patron ID",
    width: 90,
    type: "number",
  },
  {
    field: "transaction_type",
    headerName: "Type",
    width: 120,
    renderCell: (params) => (
      <TransactionTypeChip transaction_type={params.value} />
    ),
  },
  {
    field: "date",
    headerName: "Date",
    width: 225,
    valueFormatter: (value) => {
      return value ? new Date(value).toLocaleString() : "-";
    },
  },
  {
    field: "branch_id",
    headerName: "Branch ID",
    width: 100,
    editable: false,
  },
  { field: "notes", headerName: "Notes", width: 200 },
];

export const TransactionsDataGrid = ({
  label = "Transactions",
  hidden_columns = [],
}: {
  label?: string;
  hidden_columns?: string[];
}) => {
  const { data, isLoading: loading } = useAllCopyTransactions();

  return (
    <BaseDataGrid
      rows={data || []}
      columns={transaction_cols}
      label={label}
      loading={loading}
      hidden_columns={[
        ...hidden_columns,
        "id",
        "current_branch_id",
        "owning_branch_id",
      ]}
    />
  );
};
