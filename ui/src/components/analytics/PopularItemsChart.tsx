import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { type FC, useState } from 'react';
import { usePopularItems } from '../../hooks/useAnalytics';

interface PopularItemsChartProps {
  branch_id?: number;
}

export const PopularItemsChart: FC<PopularItemsChartProps> = ({
  branch_id,
}) => {
  const [period, set_period] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [view, set_view] = useState<'items' | 'genres' | 'types'>('items');

  const { data, isLoading, error } = usePopularItems(period, branch_id, 10);

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
        <Typography color='error'>Failed to load popular items data</Typography>
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

  return (
    <Paper sx={{ p: 3 }}>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h6' fontWeight='bold'>
          Popular Items & Genres
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, newPeriod) => newPeriod && set_period(newPeriod)}
          size='small'
        >
          <ToggleButton value='7d'>7 Days</ToggleButton>
          <ToggleButton value='30d'>30 Days</ToggleButton>
          <ToggleButton value='90d'>90 Days</ToggleButton>
          <ToggleButton value='1y'>1 Year</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Tabs
        value={view}
        onChange={(_, newValue) => set_view(newValue)}
        sx={{ mb: 2 }}
      >
        <Tab label='Top Items' value='items' />
        <Tab label='Top Genres' value='genres' />
        <Tab label='By Type' value='types' />
      </Tabs>

      <Box sx={{ width: '100%', height: 400 }}>
        {view === 'items' && data.top_items.length > 0 && (
          <BarChart
            layout='horizontal'
            yAxis={[
              {
                scaleType: 'band',
                data: data.top_items.map((item) =>
                  item.title.length > 60
                    ? item.title.substring(0, 60) + '...'
                    : item.title
                ),
                width: 180,
              },
            ]}
            series={[
              {
                data: data.top_items.map((item) => item.checkout_count),
                label: 'Checkouts',
                color: '#1976d2',
              },
            ]}
            height={350}
            margin={{ left: 10, right: 10, top: 20, bottom: 60 }}
            hideLegend
          />
        )}

        {view === 'genres' && data.top_genres.length > 0 && (
          <PieChart
            series={[
              {
                data: data.top_genres.map((genre, idx) => ({
                  id: idx,
                  value: genre.checkout_count,
                  label: genre.genre || 'Unknown',
                })),
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: {
                  innerRadius: 30,
                  additionalRadius: -30,
                  color: 'gray',
                },
              },
            ]}
            height={350}
            slotProps={{
              legend: {
                direction: 'vertical',
                position: { vertical: 'middle', horizontal: 'end' },
                sx: { p: 0 },
              },
            }}
          />
        )}

        {view === 'types' && data.by_item_type.length > 0 && (
          <BarChart
            xAxis={[
              {
                scaleType: 'band',
                data: data.by_item_type.map((type) => type.item_type),
              },
            ]}
            series={[
              {
                data: data.by_item_type.map((type) => type.checkout_count),
                label: 'Checkouts',
                color: '#1976d2',
              },
            ]}
            height={350}
            margin={{ left: 10, right: 10, top: 20, bottom: 30 }}
            hideLegend
          />
        )}
      </Box>
    </Paper>
  );
};
