import {
  Paper,
  Typography,
  CircularProgress,
  Box,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { useState, type FC } from 'react';
import { usePatronMetrics } from '../../hooks/useAnalytics';

interface PatronActivityChartProps {
  branch_id?: number;
}

export const PatronActivityChart: FC<PatronActivityChartProps> = ({
  branch_id,
}) => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data, isLoading, error } = usePatronMetrics(period, branch_id);

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
          Failed to load patron activity data
        </Typography>
      </Paper>
    );
  }

  if (!data) {
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
        <Typography color='text.secondary'>No data available</Typography>
      </Paper>
    );
  }

  const total_users =
    data.patron_types.heavy_users +
    data.patron_types.regular_users +
    data.patron_types.light_users;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h6' fontWeight='bold'>
          Patron Activity
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, newPeriod) => newPeriod && setPeriod(newPeriod)}
          size='small'
        >
          <ToggleButton value='7d'>7 Days</ToggleButton>
          <ToggleButton value='30d'>30 Days</ToggleButton>
          <ToggleButton value='90d'>90 Days</ToggleButton>
          <ToggleButton value='1y'>1 Year</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack direction='row' spacing={2} mb={2}>
        <Box>
          <Typography variant='body2' color='text.secondary'>
            Active Patrons
          </Typography>
          <Typography variant='h5' fontWeight='bold'>
            {data.active_patrons}
          </Typography>
        </Box>
        <Box>
          <Typography variant='body2' color='text.secondary'>
            New Registrations
          </Typography>
          <Typography variant='h5' fontWeight='bold'>
            {data.new_registrations}
          </Typography>
        </Box>
      </Stack>

      {total_users > 0 ? (
        <Box sx={{ width: '100%', height: 320 }}>
          <PieChart
            series={[
              {
                data: [
                  {
                    id: 0,
                    value: data.patron_types.heavy_users,
                    label: `Heavy Users (10+)`,
                    color: '#1976d2',
                  },
                  {
                    id: 1,
                    value: data.patron_types.regular_users,
                    label: `Regular Users (3-9)`,
                    color: '#2e7d32',
                  },
                  {
                    id: 2,
                    value: data.patron_types.light_users,
                    label: `Light Users (1-2)`,
                    color: '#ed6c02',
                  },
                ],
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: { innerRadius: 30, additionalRadius: -30 },
                innerRadius: 60,
                outerRadius: 120,
                paddingAngle: 2,
                cornerRadius: 5,
              },
            ]}
            height={300}
            slotProps={{
              legend: {
                direction: 'horizontal',
                position: { vertical: 'middle', horizontal: 'end' },
                sx: { p: 0 },
              },
            }}
          />
        </Box>
      ) : (
        <Typography color='text.secondary' align='center' sx={{ mt: 4 }}>
          No patron activity in this period
        </Typography>
      )}
    </Paper>
  );
};
