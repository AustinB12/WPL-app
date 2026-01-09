import { Chip, type ChipProps } from '@mui/material';
import type { JSX } from 'react';
import type { Library_Copy_Status } from '../../types';

export function ItemCopyStatusChip({
  status,
  size = 'medium',
}: {
  status: Library_Copy_Status | 'Overdue';
  size?: ChipProps['size'];
}): JSX.Element {
  switch (status) {
    case 'Available':
      return <Chip size={size} label="Available" color="success" />;
    case 'Checked Out':
      return <Chip size={size} label="Checked Out" color="primary" />;
    case 'Reserved':
      return <Chip size={size} label="Reserved" color="error" />;
    case 'Processing':
      return <Chip size={size} label="Processing" color="success" />;
    case 'Unshelved':
      return <Chip size={size} label="Unshelved" color="warning" />;
    case 'Ready For Pickup':
      return <Chip size={size} label="Ready For Pickup" color="success" />;
    case 'Overdue':
      return <Chip size={size} label="Overdue" color="warning" />;
    case 'Damaged':
      return <Chip size={size} label="Damaged" color="secondary" />;
    case 'Lost':
      return <Chip size={size} label="Lost" color="default" />;
    default:
      return <Chip size={size} label="Unknown" />;
  }
}
