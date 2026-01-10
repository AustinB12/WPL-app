import {
  Dashboard,
  LibraryBooks,
  People,
  LocalLibrary,
  Warning,
  Refresh,
} from '@mui/icons-material';
import {
  Grid,
  Paper,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  CircularProgress,
} from '@mui/material';
import { useState, type FC } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { useAnalyticsSummary } from '../hooks/useAnalytics';
import {
  MetricCard,
  CirculationChart,
  PopularItemsChart,
  PatronActivityChart,
  OverdueByBranchChart,
  CollectionUtilizationChart,
} from '../components/analytics';
import { useSelectedBranch } from '../hooks/useBranchHooks';

export const DashboardPage: FC = () => {
  const { selected_branch } = useSelectedBranch();
  const queryClient = useQueryClient();

  // Date range state
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>(
    '30d'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate date range for circulation chart
  const getDateRange = () => {
    const end_date = new Date();
    const start_date = new Date();

    switch (dateRange) {
      case '7d':
        start_date.setDate(end_date.getDate() - 7);
        break;
      case '30d':
        start_date.setDate(end_date.getDate() - 30);
        break;
      case '90d':
        start_date.setDate(end_date.getDate() - 90);
        break;
      case '1y':
        start_date.setFullYear(end_date.getFullYear() - 1);
        break;
    }

    return {
      start_date: start_date.toISOString().split('T')[0],
      end_date: end_date.toISOString().split('T')[0],
    };
  };

  // Fetch summary metrics
  const { data: summary } = useAnalyticsSummary(selected_branch?.id);

  // Manual refresh all analytics data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const { start_date, end_date } = getDateRange();

  return (
    <PageContainer scroll={true}>
      <PageTitle title='Library Dashboard' Icon_Component={Dashboard} />

      {/* Summary Metrics */}
      <Grid container spacing={2} mb={2}>
        <Grid
          size={{ xs: 12, sm: 6, md: 3 }}
          sx={{ borderRadius: 3, overflow: 'clip' }}
        >
          <MetricCard
            title='Total Collection'
            value={summary?.collection_size ?? 0}
            icon={<LibraryBooks />}
            subtitle='Items in collection'
          />
        </Grid>
        <Grid
          size={{ xs: 12, sm: 6, md: 3 }}
          sx={{ borderRadius: 3, overflow: 'clip' }}
        >
          <MetricCard
            title='Active Patrons'
            value={summary?.active_patrons ?? 0}
            icon={<People />}
            subtitle='Active members'
          />
        </Grid>
        <Grid
          size={{ xs: 12, sm: 6, md: 3 }}
          sx={{ borderRadius: 3, overflow: 'clip' }}
        >
          <MetricCard
            title='Checkouts Today'
            value={summary?.current_checkouts ?? 0}
            icon={<LocalLibrary />}
            subtitle='Items checked out'
          />
        </Grid>
        <Grid
          size={{ xs: 12, sm: 6, md: 3 }}
          sx={{ borderRadius: 3, overflow: 'clip' }}
        >
          <MetricCard
            title='Overdue Items'
            value={summary?.overdue_items ?? 0}
            icon={<Warning />}
            subtitle='Items overdue'
          />
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, overflow: 'clip' }}>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          flexWrap='wrap'
          gap={2}
        >
          <Stack direction='row' spacing={2} alignItems='center'>
            <ToggleButtonGroup
              value={dateRange}
              exclusive
              onChange={(_, newRange) => newRange && setDateRange(newRange)}
              size='small'
            >
              <ToggleButton value='7d'>7 Days</ToggleButton>
              <ToggleButton value='30d'>30 Days</ToggleButton>
              <ToggleButton value='90d'>90 Days</ToggleButton>
              <ToggleButton value='1y'>1 Year</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Button
            variant='outlined'
            startIcon={
              isRefreshing ? <CircularProgress size={16} /> : <Refresh />
            }
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Refresh Data
          </Button>
        </Stack>
      </Paper>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Circulation Trends - Full Width */}
        <Grid size={{ xs: 12 }}>
          <CirculationChart
            branch_id={selected_branch?.id}
            start_date={start_date}
            end_date={end_date}
          />
        </Grid>

        {/* Popular Items & Genres */}
        <Grid size={{ xs: 12, md: 6 }}>
          <PopularItemsChart branch_id={selected_branch?.id} />
        </Grid>

        {/* Patron Activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <PatronActivityChart branch_id={selected_branch?.id} />
        </Grid>

        {/* Overdue Tracking */}
        <Grid size={{ xs: 12, md: 6 }}>
          <OverdueByBranchChart branch_id={selected_branch?.id} />
        </Grid>

        {/* Collection Utilization */}
        <Grid size={{ xs: 12, md: 6 }}>
          <CollectionUtilizationChart branch_id={selected_branch?.id} />
        </Grid>
      </Grid>
    </PageContainer>
  );
};
