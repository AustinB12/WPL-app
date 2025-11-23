import { Chip, useTheme, type ChipProps } from '@mui/material';
import type { JSX } from 'react';
import type { Item_Condition } from '../../types';

export function ItemCopyConditionChip({
  condition,
  size = 'medium',
}: {
  condition: Item_Condition;
  size?: ChipProps['size'];
}): JSX.Element {
  const theme = useTheme();
  const is_light = theme.palette.mode === 'light';
  switch (condition) {
    case 'New':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="New"
          color="success"
        />
      );
    case 'Excellent':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Excellent"
          color="success"
        />
      );
    case 'Good':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Good"
          color="primary"
        />
      );
    case 'Fair':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Fair"
          color="secondary"
        />
      );
    case 'Poor':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Poor"
          color="warning"
        />
      );
    case 'Digital':
      return (
        <Chip
          size={size}
          variant={is_light ? 'filled' : 'outlined'}
          label="Digital"
          color="info"
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
