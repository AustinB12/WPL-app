import {
  Dashboard,
  LibraryBooks,
  LocalLibrary,
  People,
  Refresh,
  Warning,
} from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { type FC, useState } from 'react';
import {
  CirculationChart,
  CollectionUtilizationChart,
  MetricCard,
  OverdueByBranchChart,
  PatronActivityChart,
  PopularItemsChart,
} from '../components/analytics';
import { PageContainer, Page_Title } from '../components/common/PageBuilders';
import { useAnalyticsSummary } from '../hooks/use_analytics';
import { useSelectedBranch } from '../hooks/use_branch_hooks';

export const DashboardPage: FC = () => {
  const { selected_branch } = useSelectedBranch();
  const queryClient = useQueryClient();

  // Date range state
  const [date_range, set_date_range] = useState<'7d' | '30d' | '90d' | '1y'>(
    '30d',
  );
  const [is_refreshing, set_is_refreshing] = useState(false);

  // Calculate date range for circulation chart
  const get_date_range = () => {
    const end_date = new Date();
    const start_date = new Date();

    switch (date_range) {
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
    set_is_refreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    setTimeout(() => set_is_refreshing(false), 1000);
  };

  const { start_date, end_date } = get_date_range();

  return (
    <PageContainer scroll={true}>
      <Page_Title title='Library Dashboard' Icon_Component={Dashboard} />

      {/* Summary Metrics */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={GRID_ITEM_SX}>
          <MetricCard
            title='Total Collection'
            value={summary?.collection_size ?? 0}
            icon={<LibraryBooks />}
            subtitle='Items in collection'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={GRID_ITEM_SX}>
          <MetricCard
            title='Active Patrons'
            value={summary?.active_patrons ?? 0}
            icon={<People />}
            subtitle='Active Members'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={GRID_ITEM_SX}>
          <MetricCard
            title='Checkouts Today'
            value={summary?.current_checkouts ?? 0}
            icon={<LocalLibrary />}
            subtitle='Items Checked Out'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={GRID_ITEM_SX}>
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
              value={date_range}
              exclusive
              onChange={(_, newRange) => newRange && set_date_range(newRange)}
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
              is_refreshing ? <CircularProgress size={16} /> : <Refresh />
            }
            onClick={handleRefresh}
            disabled={is_refreshing}
          >
            Refresh Data
          </Button>
        </Stack>
      </Paper>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Circulation Trends - Full Width */}
        <Grid size={{ xs: 12 }} sx={GRID_ITEM_SX}>
          <CirculationChart
            branch_id={selected_branch?.id}
            start_date={start_date}
            end_date={end_date}
          />
        </Grid>

        {/* Popular Items & Genres */}
        <Grid size={{ xs: 12, md: 6 }} sx={GRID_ITEM_SX}>
          <PopularItemsChart branch_id={selected_branch?.id} />
        </Grid>

        {/* Patron Activity */}
        <Grid size={{ xs: 12, md: 6 }} sx={GRID_ITEM_SX}>
          <PatronActivityChart branch_id={selected_branch?.id} />
        </Grid>

        {/* Overdue Tracking */}
        <Grid size={{ xs: 12, md: 6 }} sx={GRID_ITEM_SX}>
          <OverdueByBranchChart branch_id={selected_branch?.id} />
        </Grid>

        {/* Collection Utilization */}
        <Grid size={{ xs: 12, md: 6 }} sx={GRID_ITEM_SX}>
          <CollectionUtilizationChart branch_id={selected_branch?.id} />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

const GRID_ITEM_SX = { borderRadius: 3, overflow: 'clip' };
