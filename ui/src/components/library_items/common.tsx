import { type SxProps, Paper, Stack, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';

export function LIP_Section({
  children,
  sx,
}: PropsWithChildren<{ sx?: SxProps }>) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3, ...sx }}>
      {children}
    </Paper>
  );
}

export function LIP_Field({ label, value }: { label: string; value: string }) {
  if (!value || value.trim() === '') return;
  return (
    <Stack spacing={1} sx={{ minWidth: 150, flex: 1 }}>
      <Typography fontWeight={'bold'} variant='caption' color='text.secondary'>
        {label}:
      </Typography>
      <Typography variant='body1' sx={{ mt: '0px !important' }}>
        {value}
      </Typography>
    </Stack>
  );
}
