import { Chip, useTheme } from '@mui/material';
import type { JSX } from 'react';
import type { Transaction_Status } from '../../types';

export function TransactionStatusChip({
  status,
}: {
  status: Transaction_Status;
}): JSX.Element {
  const theme = useTheme();
  const is_light = theme.palette.mode === 'light';
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Active"
          color="info"
        />
      );
    case 'RETURNED':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Returned"
          color="primary"
        />
      );
    case 'OVERDUE':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Overdue"
          color="error"
        />
      );
    case 'LOST':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Lost"
          color="success"
        />
      );
    case 'COMPLETED':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Completed"
          color="warning"
        />
      );
    case 'WAITING':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Waiting"
          color="warning"
        />
      );
    default:
      return (
        <Chip variant={is_light ? 'filled' : 'outlined'} label="Unknown" />
      );
  }
}
