import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { type FC, useState } from 'react';
import { useCirculationTrends } from '../../hooks/use_analytics';

interface CirculationChartProps {
  branch_id?: number;
  start_date?: string;
  end_date?: string;
}

export const CirculationChart: FC<CirculationChartProps> = ({
  branch_id,
  start_date,
  end_date,
}) => {
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily'
  );

  const { data, isLoading, error } = useCirculationTrends(
    start_date,
    end_date,
    interval,
    branch_id
  );

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
        <Typography color="error">Failed to load circulation data</Typography>
      </Paper>
    );
  }

  if (!data || data.labels.length === 0) {
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
        <Typography color="text.secondary">
          No circulation data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" fontWeight="bold">
          Circulation Trends
        </Typography>
        <ToggleButtonGroup
          value={interval}
          exclusive
          onChange={(_, newInterval) => newInterval && setInterval(newInterval)}
          size="small"
        >
          <ToggleButton value="daily">Daily</ToggleButton>
          <ToggleButton value="weekly">Weekly</ToggleButton>
          <ToggleButton value="monthly">Monthly</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box sx={{ width: '100%', height: 400 }}>
        <LineChart
          xAxis={[
            {
              data: data.labels,
              scaleType: 'point',
              label:
                interval === 'daily'
                  ? 'Date'
                  : interval === 'weekly'
                    ? 'Week'
                    : 'Month',
            },
          ]}
          series={[
            {
              data: data.checkouts,
              label: 'Checkouts',
              color: '#1976d2',
              curve: 'linear',
            },
            {
              data: data.checkins,
              label: 'Check-ins',
              color: '#2e7d32',
              curve: 'linear',
            },
            {
              data: data.renewals,
              label: 'Renewals',
              color: '#ed6c02',
              curve: 'linear',
            },
          ]}
          height={350}
          margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
          slotProps={{
            legend: {
              direction: 'horizontal',
              position: { vertical: 'bottom', horizontal: 'center' },
              sx: { p: '-10px' },
            },
          }}
        />
      </Box>
    </Paper>
  );
};
