import { Chip, useTheme } from '@mui/material';
import type { JSX } from 'react';
import type { Transaction_Type } from '../../types';

export function TransactionTypeChip({
  transaction_type,
}: {
  transaction_type: Transaction_Type;
}): JSX.Element {
  const theme = useTheme();
  const is_light = theme.palette.mode === 'light';
  switch (transaction_type.toUpperCase()) {
    case 'CHECKOUT':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Check-Out"
          color="secondary"
        />
      );
    case 'CHECKIN':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Check-In"
          color="primary"
        />
      );
    case 'BALANCE':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Balance"
          color="error"
        />
      );
    case 'RENEWAL':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Renewal"
          color="success"
        />
      );
    case 'LOST':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Lost"
          color="error"
        />
      );
    case 'DAMAGED':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Damaged"
          color="warning"
        />
      );
    case 'RESHELVE':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Reshelve"
          color="success"
        />
      );
    default:
      return (
        <Chip variant={is_light ? 'filled' : 'outlined'} label="Unknown" />
      );
  }
}
