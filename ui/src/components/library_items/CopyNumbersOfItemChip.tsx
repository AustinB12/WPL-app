import { Chip, type ChipProps } from '@mui/material';

export default function CopyNumbersOfItemChip({
  available,
  total,
}: {
  available: number;
  total: number;
}) {
  let color: ChipProps['color'] = 'success';
  if (available === 0) {
    if (total === 0) {
      color = 'default';
    } else {
      color = 'error';
    }
  } else if (available < total) {
    const availability_ratio = available / total;
    if (availability_ratio <= 0.4) {
      color = 'warning';
    }
  }

  return <Chip label={`${available} / ${total}`} size="small" color={color} />;
}
