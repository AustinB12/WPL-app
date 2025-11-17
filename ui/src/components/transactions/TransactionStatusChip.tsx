import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { Transaction_Status } from '../../types';

export function TransactionStatusChip({
  status,
}: {
  status: Transaction_Status;
}): JSX.Element {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return <Chip variant="outlined" label="Active" color="info" />;
    case 'RETURNED':
      return <Chip variant="outlined" label="Returned" color="primary" />;
    case 'OVERDUE':
      return <Chip variant="outlined" label="Overdue" color="error" />;
    case 'LOST':
      return <Chip variant="outlined" label="Lost" color="success" />;
    case 'COMPLETED':
      return <Chip variant="outlined" label="Completed" color="warning" />;
    default:
      return <Chip variant="outlined" label="Unknown" />;
  }
}
