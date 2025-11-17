import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { Availability_Status } from '../../types';

export function ItemCopyStatusChip({
  status,
}: {
  status: Availability_Status | 'Overdue';
}): JSX.Element {
  switch (status) {
    case 'Available':
      return <Chip variant="outlined" label="Available" color="info" />;
    case 'Checked Out':
      return <Chip variant="outlined" label="Checked Out" color="primary" />;
    case 'Reserved':
      return <Chip variant="outlined" label="Reserved" color="error" />;
    case 'Processing':
      return <Chip variant="outlined" label="Processing" color="success" />;
    case 'Unshelved':
      return <Chip variant="outlined" label="Unshelved" color="warning" />;
    case 'Overdue':
      return <Chip variant="outlined" label="Overdue" color="warning" />;
    case 'Damaged':
      return <Chip variant="outlined" label="Damaged" color="secondary" />;
    case 'Lost':
      return <Chip variant="outlined" label="Lost" color="default" />;
    default:
      return <Chip variant="outlined" label="Unknown" />;
  }
}
