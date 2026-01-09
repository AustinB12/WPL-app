import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { ReservationStatus } from '../../types';

export function ReservationStatusChip({
  status,
}: {
  status: ReservationStatus;
}): JSX.Element {
  switch (status) {
    case 'pending':
      return <Chip label="Pending" color="info" />;
    case 'fulfilled':
      return <Chip label="Fulfilled" color="primary" />;
    case 'cancelled':
      return <Chip label="Cancelled" color="error" />;
    case 'ready':
      return <Chip label="Ready for Pickup" color="success" />;
    case 'expired':
      return <Chip label="Expired" color="warning" />;
    case 'waiting':
      return <Chip label="Waitlist" color="secondary" />;
    default:
      return <Chip label="Unknown" />;
  }
}
