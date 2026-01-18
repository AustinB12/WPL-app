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
      return <Chip label='Check Out' sx={{ bgcolor: '#b5179e' }} size={size} />;
    case 'CHECKIN':
      return <Chip label='Check In' sx={{ bgcolor: '#3a0ca3' }} size={size} />;
    case 'BALANCE':
      return <Chip label='Balance' color='error' size={size} />;
    case 'RENEWAL':
      return <Chip label='Renewal' sx={{ bgcolor: '#7209b7' }} size={size} />;
    case 'RESERVATION':
      return <Chip label='Reservation' color='primary' size={size} />;
    case 'LOST':
      return <Chip label='Lost' color='error' size={size} />;
    case 'DAMAGED':
      return <Chip label='Damaged' color='warning' size={size} />;
    case 'RESHELVE':
      return <Chip label='Reshelve' sx={{ bgcolor: '#4895ef' }} size={size} />;
    default:
      return <Chip label='Unknown' size={size} />;
  }
}
