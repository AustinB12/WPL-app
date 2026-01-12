import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { Transaction_Type } from '../../types/transaction_types';

export function TransactionTypeChip({
  transaction_type,
  size,
}: {
  transaction_type: Transaction_Type;
  size?: 'small' | 'medium';
}): JSX.Element {
  switch (transaction_type.toUpperCase()) {
    case 'CHECKOUT':
      return <Chip label='Check Out' color='secondary' size={size} />;
    case 'CHECKIN':
      return <Chip label='Check In' color='primary' size={size} />;
    case 'BALANCE':
      return <Chip label='Balance' color='error' size={size} />;
    case 'RENEWAL':
      return <Chip label='Renewal' color='success' size={size} />;
    case 'RESERVATION':
      return <Chip label='Reservation' color='primary' size={size} />;
    case 'LOST':
      return <Chip label='Lost' color='error' size={size} />;
    case 'DAMAGED':
      return <Chip label='Damaged' color='warning' size={size} />;
    case 'RESHELVE':
      return <Chip label='Reshelve' color='success' size={size} />;
    default:
      return <Chip label='Unknown' size={size} />;
  }
}
