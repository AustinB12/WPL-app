import { Chip, useTheme } from '@mui/material';
import type { JSX } from 'react';
import type { Library_Copy_Status } from '../../types';

export function ItemCopyStatusChip({
  status,
}: {
  status: Library_Copy_Status | 'Overdue';
}): JSX.Element {
  const theme = useTheme();
  const is_light = theme.palette.mode === 'light';
  switch (status) {
    case 'Available':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Available"
          color="info"
        />
      );
    case 'Checked Out':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Checked Out"
          color="primary"
        />
      );
    case 'Reserved':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Reserved"
          color="error"
        />
      );
    case 'Processing':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Processing"
          color="success"
        />
      );
    case 'Unshelved':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Unshelved"
          color="warning"
        />
      );
    case 'Ready For Pickup':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Ready For Pickup"
          color="success"
        />
      );
    case 'Overdue':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Overdue"
          color="warning"
        />
      );
    case 'Damaged':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Damaged"
          color="secondary"
        />
      );
    case 'Lost':
      return (
        <Chip
          variant={is_light ? 'filled' : 'outlined'}
          label="Lost"
          color="default"
        />
      );
    default:
      return (
        <Chip variant={is_light ? 'filled' : 'outlined'} label="Unknown" />
      );
  }
}
