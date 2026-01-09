import { type GridColDef } from "@mui/x-data-grid";
import { useSelectedBranch } from "../../hooks/useBranchHooks";
import { useCheckedOutCopies } from "../../hooks/useCopies";
import { ItemCopyConditionChip } from "../copies/ItemCopyConditionChip";
import { ItemCopyStatusChip } from "../copies/ItemCopyStatusChip";
import ItemTypeChip from "../library_items/ItemTypeChip";
import { BaseDataGrid } from "./BaseDataGrid";
import { useMemo } from "react";

const columns: GridColDef[] = [
  {
    field: "id",
    headerName: "ID",
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: "patron_id",
    headerName: "P-ID",
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: "member",
    headerName: "Patron",
    width: 180,
    valueGetter: (_value, row) =>
      `${row.patron_first_name} ${row.patron_last_name}`,
  },
  {
    field: "title",
    headerName: "Library Item",
    width: 200,
    flex: 1,
  },
  {
    field: "condition",
    headerName: "Condition",
    width: 130,
    renderCell: (params) => <ItemCopyConditionChip condition={params.value} />,
  },
  {
    field: "due_date",
    headerName: "Due Date",
    width: 150,
    valueFormatter: (value) => {
      if (!value) return "?";
      return new Date(value).toLocaleDateString();
    },
  },
  {
    field: "status",
    headerName: "Status",
    width: 120,
    renderCell: (params) => {
      return (
        <ItemCopyStatusChip
          status={
            new Date(params.row.due_date) < new Date()
              ? "Overdue"
              : "Checked Out"
          }
        />
      );
    },
  },
  {
    field: "item_type",
    headerName: "Type",
    width: 120,
    sortable: true,
    valueGetter: (value) => String(value),
    renderCell: (params) => <ItemTypeChip item_type={params.value} />,
  },
  { field: "current_branch_name", headerName: "Branch", width: 200 },
];

export const CheckedOutItemsGrid = ({
  select_item_copy,
  hidden_columns = [],
  filter,
}: {
  select_item_copy: (copy_id: number) => void;
  hidden_columns?: string[];
  filter?: string;
}) => {
  const { selected_branch } = useSelectedBranch();
  const { data: checked_out_copies, isLoading } = useCheckedOutCopies(
    selected_branch?.id || 1
  );

  const filtered_copies = useMemo(() => {
    if (!filter) return checked_out_copies;
    return checked_out_copies?.filter((copy) =>
      Object.values(copy).some((value) =>
        String(value).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [checked_out_copies, filter]);
  return (
    <BaseDataGrid
      rows={filtered_copies || []}
      columns={columns}
      loading={isLoading}
      initialState={{
        pagination: { paginationModel: { pageSize: 15 } },
      }}
      onRowClick={(params) => select_item_copy(params.row.id)}
      hidden_columns={hidden_columns}
    />
  );
};
