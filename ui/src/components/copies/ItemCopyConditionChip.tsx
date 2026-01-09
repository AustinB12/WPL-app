import { Chip, type ChipProps } from '@mui/material';
import type { JSX } from 'react';
import type { Item_Condition } from '../../types';

export function ItemCopyConditionChip({
  condition,
  size = 'medium',
}: {
  condition: Item_Condition;
  size?: ChipProps['size'];
}): JSX.Element {
  switch (condition) {
    case 'New':
      return <Chip size={size} label="New" color="success" />;
    case 'Excellent':
      return <Chip size={size} label="Excellent" color="success" />;
    case 'Good':
      return <Chip size={size} label="Good" color="success" />;
    case 'Fair':
      return <Chip size={size} label="Fair" color="primary" />;
    case 'Poor':
      return <Chip size={size} label="Poor" color="warning" />;
    case 'Digital':
      return <Chip size={size} label="Digital" color="secondary" />;
    default:
      return <Chip size={size} label="info" />;
  }
}
