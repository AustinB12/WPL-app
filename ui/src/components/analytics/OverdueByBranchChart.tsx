import { Paper, Typography, CircularProgress, Box, Stack } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { type FC } from 'react';
import { useOverdueTracking } from '../../hooks/useAnalytics';

interface OverdueByBranchChartProps {
  branch_id?: number;
}

export const OverdueByBranchChart: FC<OverdueByBranchChartProps> = ({
  branch_id,
}) => {
  const { data, isLoading, error } = useOverdueTracking(branch_id);

  if (isLoading) {
    return (
      <Paper
        sx={{
          p: 3,
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper
        sx={{
          p: 3,
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color='error'>
          Failed to load overdue tracking data
        </Typography>
      </Paper>
    );
  }

  if (!data || data.by_branch.length === 0) {
    return (
      <Paper
        sx={{
          p: 3,
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color='text.secondary'>No overdue items</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h6' fontWeight='bold'>
          Overdue Items by Branch
        </Typography>
      </Stack>

      <Stack direction='row' spacing={3} mb={3}>
        <Box>
          <Typography variant='body2' color='text.secondary'>
            Total Overdue
          </Typography>
          <Typography variant='h5' fontWeight='bold' color='error.main'>
            {data.total_overdue}
          </Typography>
        </Box>
        <Box>
          <Typography variant='body2' color='text.secondary'>
            Total Fines
          </Typography>
          <Typography variant='h5' fontWeight='bold' color='warning.main'>
            ${data.total_fines.toFixed(2)}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ width: '100%', height: 300 }}>
        <BarChart
          hideLegend
          xAxis={[
            {
              scaleType: 'band',
              data: data.by_branch.map((branch) => branch.branch_name),
            },
          ]}
          series={[
            {
              data: data.by_branch.map((branch) => branch.overdue_count),
              label: 'Overdue Items',
              color: '#d32f2f',
            },
          ]}
          height={280}
          margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
        />
      </Box>
    </Paper>
  );
};
