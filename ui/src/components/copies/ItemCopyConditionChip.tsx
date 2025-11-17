import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { Item_Condition } from '../../types';

export function ItemCopyConditionChip({
  condition,
}: {
  condition: Item_Condition;
}): JSX.Element {
  switch (condition) {
    case 'New':
      return <Chip variant="outlined" label="New" color="success" />;
    case 'Excellent':
      return <Chip variant="outlined" label="Excellent" color="success" />;
    case 'Good':
      return <Chip variant="outlined" label="Good" color="primary" />;
    case 'Fair':
      return <Chip variant="outlined" label="Fair" color="secondary" />;
    case 'Poor':
      return <Chip variant="outlined" label="Poor" color="warning" />;
    default:
      return <Chip variant="outlined" label="Unknown" />;
  }
}
