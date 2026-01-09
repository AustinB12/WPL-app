import { EventNote } from "@mui/icons-material";
import { BaseDataGrid } from "../components/common/BaseDataGrid";
import { PageContainer, PageTitle } from "../components/common/PageBuilders";
import ItemTypeChip from "../components/library_items/ItemTypeChip";
import { ReservationStatusChip } from "../components/reservations/ReservationStatusChip";
import { useReservations } from "../hooks/useReservations";
import type { ReservationStatus } from "../types";

export const ReservationsPage = () => {
  const { data: reservations = [], isLoading: loading } = useReservations();

  return (
    <PageContainer width="xl">
      <PageTitle title="Reservations" Icon_Component={EventNote} />
      <BaseDataGrid
        label="Reservations"
        rows={reservations}
        getRowId={(row) => row.id}
        columns={[
          {
            field: "id",
            headerName: "ID",
            width: 90,
            valueGetter: (value) => Number(value),
          },
          {
            field: "first_name",
            headerName: "Patron",
            width: 200,
            valueGetter: (value, row) => {
              if (!value) return "";
              return `${value} ${row.last_name}`;
            },
          },
          { field: "title", headerName: "Item", width: 275 },
          {
            field: "reservation_date",
            headerName: "Reservation Date",
            width: 150,
            valueFormatter: (value) => {
              const date = new Date(value);
              return date.toLocaleDateString();
            },
          },
          {
            field: "expiry_date",
            headerName: "Expiry Date",
            width: 150,
            valueFormatter: (value) => {
              const date = new Date(value);
              return date.toLocaleDateString();
            },
          },
          {
            field: "status",
            headerName: "Status",
            width: 125,
            renderCell: (params) => (
              <ReservationStatusChip
                status={params.value as ReservationStatus}
              />
            ),
          },
          { field: "queue_position", headerName: "Queue Spot", width: 100 },
          {
            field: "item_type",
            headerName: "Type",
            width: 100,
            renderCell: (params) => {
              return <ItemTypeChip item_type={params.value} />;
            },
          },
        ]}
        loading={loading}
      />
    </PageContainer>
  );
};
