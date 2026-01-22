import { Chip, type ChipProps } from '@mui/material';
import type { JSX } from 'react';
import type { Item_Condition } from '../../types/item_types';

export function Item_Copy_Condition_Chip({
  condition,
  size = 'medium',
}: {
  condition: Item_Condition;
  size?: ChipProps['size'];
}): JSX.Element {
  switch (condition) {
    case 'New':
      return <Chip size={size} label='New' color='success' />;
    case 'Excellent':
      return (
        <Chip
          size={size}
          label='Excellent'
          color='success'
          sx={{ border: '2px solid #38ff6a' }}
        />
      );
    case 'Good':
      return <Chip size={size} label='Good' color='success' />;
    case 'Fair':
      return <Chip size={size} label='Fair' color='primary' />;
    case 'Poor':
      return <Chip size={size} label='Poor' color='warning' />;
    case 'Digital':
      return <Chip size={size} label='Digital' color='secondary' />;
    default:
      return <Chip size={size} label='info' />;
  }
}
