import { Container } from '@mui/material';
import { useReservations } from '../hooks/useReservations';
import { ReservationStatusChip } from '../components/reservations/ReservationStatusChip';
import ItemTypeChip from '../components/library_items/ItemTypeChip';
import type { ReservationStatus } from '../types';
import { BaseDataGrid } from '../components/common/BaseDataGrid';

export const ReservationsPage = () => {
  const { data: reservations = [], isLoading: loading } = useReservations();

  return (
    <Container
      maxWidth="lg"
      sx={{
        p: 3,
        overflow: 'hidden',
        height: 1,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <BaseDataGrid
        rows={reservations}
        getRowId={(row) => row.id}
        columns={[
          {
            field: 'id',
            headerName: 'ID',
            width: 90,
            valueGetter: (value) => Number(value),
          },
          {
            field: 'first_name',
            headerName: 'Patron',
            width: 200,
            valueGetter: (value, row) => {
              if (!value) return '';
              return `${value} ${row.last_name}`;
            },
          },
          { field: 'title', headerName: 'Item', width: 275 },
          {
            field: 'reservation_date',
            headerName: 'Reservation Date',
            width: 150,
          },
          { field: 'expiry_date', headerName: 'Expiry Date', width: 150 },
          {
            field: 'status',
            headerName: 'Status',
            width: 125,
            renderCell: (params) => (
              <ReservationStatusChip
                status={params.value as ReservationStatus}
              />
            ),
          },
          { field: 'queue_position', headerName: 'Queue Spot', width: 100 },
          {
            field: 'item_type',
            headerName: 'Type',
            width: 100,
            renderCell: (params) => {
              return <ItemTypeChip item_type={params.value} />;
            },
          },
        ]}
        loading={loading}
      />
    </Container>
  );
};
