import { Chip, useTheme } from '@mui/material';

export const PatronsStatusChip = ({
  status,
  size = 'medium',
}: {
  status: boolean;
  size?: 'small' | 'medium';
}) => {
  const theme = useTheme();
  const is_dark = theme.palette.mode === 'dark';
  return (
    <Chip
      variant={is_dark ? 'outlined' : 'filled'}
      label={status ? 'Active' : 'Inactive'}
      color={status ? 'success' : 'error'}
      size={size}
    />
  );
};
