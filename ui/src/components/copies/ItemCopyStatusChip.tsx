import { Chip, type ChipProps, useTheme } from '@mui/material';
import type { JSX } from 'react';
import type { Library_Copy_Status } from '../../types';

export function ItemCopyStatusChip({
  status,
  size = 'medium',
}: {
  status: Library_Copy_Status | 'Overdue';
  size?: ChipProps['size'];
}): JSX.Element {
  const theme = useTheme();
  const is_light = theme.palette.mode === 'light';
  switch (status) {
    case 'Available':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Available"
          color="success"
        />
      );
    case 'Checked Out':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Checked Out"
          color="primary"
        />
      );
    case 'Reserved':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Reserved"
          color="error"
        />
      );
    case 'Processing':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Processing"
          color="success"
        />
      );
    case 'Unshelved':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Unshelved"
          color="warning"
        />
      );
    case 'Ready For Pickup':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Ready For Pickup"
          color="success"
        />
      );
    case 'Overdue':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Overdue"
          color="warning"
        />
      );
    case 'Damaged':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Damaged"
          color="secondary"
        />
      );
    case 'Lost':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Lost"
          color="default"
        />
      );
    default:
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Unknown"
        />
      );
  }
}
