import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { type FC } from 'react';
import { useCollectionUtilization } from '../../hooks/use_analytics';

interface CollectionUtilizationChartProps {
  branch_id?: number;
}

export const CollectionUtilizationChart: FC<
  CollectionUtilizationChartProps
> = ({ branch_id }) => {
  const { data, isLoading, error } = useCollectionUtilization(branch_id, 30);

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
        <Typography color="error">
          Failed to load collection utilization data
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
        <Typography color="text.secondary">No data available</Typography>
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
          Collection Utilization
        </Typography>
      </Stack>

      <Stack direction="row" spacing={3} mb={3}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Never Checked Out
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="warning.main">
            {data.summary.total_never_checked}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Oldest Unused (Days)
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {data.summary.oldest_item_days}
          </Typography>
        </Box>
      </Stack>

      {data.checkout_rate_by_type.length > 0 && (
        <Box sx={{ width: '100%', height: 300, mb: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Utilization by Item Type
          </Typography>
          <BarChart
            xAxis={[
              {
                scaleType: 'band',
                data: data.checkout_rate_by_type.map((type) => type.item_type),
              },
            ]}
            series={[
              {
                data: data.checkout_rate_by_type.map(
                  (type) => type.checked_out_ever
                ),
                label: 'Checked Out',
                stack: 'total',
                color: '#2e7d32',
              },
              {
                data: data.checkout_rate_by_type.map(
                  (type) => type.total_copies - type.checked_out_ever
                ),
                label: 'Never Checked Out',
                stack: 'total',
                color: '#ed6c02',
              },
            ]}
            height={280}
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
      )}

      {data.age_analysis && data.age_analysis.labels.length > 0 && (
        <Box sx={{ width: '100%', height: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            Age Analysis
          </Typography>
          <BarChart
            xAxis={[
              {
                scaleType: 'band',
                data: data.age_analysis.labels,
              },
            ]}
            series={[
              {
                data: data.age_analysis.total_items.map(
                  (total, idx) => total - data.age_analysis.never_checked[idx]
                ),
                label: 'Checked Out',
                stack: 'total',
                color: '#2e7d32',
              },
              {
                data: data.age_analysis.never_checked,
                label: 'Never Checked Out',
                stack: 'total',
                color: '#ed6c02',
              },
            ]}
            height={280}
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
      )}
    </Paper>
  );
};
