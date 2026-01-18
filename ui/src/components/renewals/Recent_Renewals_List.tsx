import { CheckCircle } from '@mui/icons-material';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

export interface Recent_Renewal {
  copy_id: number;
  title: string;
  timestamp: Date;
  new_due_date: string;
  renewal_status: string;
}

interface Recent_Renewals_List_Props {
  renewals: Recent_Renewal[];
}

export function Recent_Renewals_List({ renewals }: Recent_Renewals_List_Props) {
  if (renewals.length === 0) {
    return null;
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Recent Renewals
        </Typography>
        <Stack spacing={1}>
          {renewals.map((renewal, index) => (
            <Stack
              key={`${renewal.copy_id}-${index}`}
              direction='row'
              justifyContent='space-between'
              alignItems='center'
              sx={{
                p: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 2,
              }}
            >
              <Stack direction='row' spacing={2} alignItems='center'>
                <CheckCircle color='success' />
                <Box>
                  <Typography variant='body1' fontWeight={500}>
                    {renewal.title}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Item ID #{renewal.copy_id} Renewed at{' '}
                    {dayjs(renewal.timestamp).format('h:mm A')}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction={'row'} alignItems='flex-end' gap={1}>
                <Typography
                  variant='body2'
                  color='textSecondary'
                  component={'span'}
                >
                  New due date:{' '}
                </Typography>
                <Typography variant='body2' component={'span'}>
                  <strong>
                    {dayjs(renewal.new_due_date).format('MMM D, YYYY')}
                  </strong>
                </Typography>
              </Stack>
              <Chip
                label={renewal.renewal_status}
                size='small'
                color='success'
                variant='outlined'
              />
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
