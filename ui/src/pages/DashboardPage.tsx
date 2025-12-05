import {
  AttachMoney,
  Dashboard,
  EventNote,
  LibraryBooks,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import type { FC, PropsWithChildren } from 'react';
import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { useStats } from '../hooks/useStats';

// Constant style objects to prevent re-creation
const LINK_STYLE = { textDecoration: 'none' };
const GRID_CONTAINER_SX = { mb: 4 };
const ICON_BOX_SX = { display: 'flex', alignItems: 'center', mb: 1 };
const HEADING_SX = { fontWeight: 600 };
const VALUE_SX_PRIMARY = { fontWeight: 'bold', color: 'primary.main' };
const VALUE_SX_SECONDARY = { fontWeight: 'bold', color: 'secondary.main' };
const VALUE_SX_ERROR = { fontWeight: 'bold', color: 'error.main' };
const ICON_SX_PRIMARY = { mr: 1, color: 'primary.main' };
const ICON_SX_SECONDARY = { mr: 1, color: 'secondary.main' };
const ICON_SX_ERROR = { mr: 1, color: 'error.main' };

export const DashboardPage: FC = () => {
  const { data, isLoading, error } = useStats();

  // Memoize pie chart data to prevent re-creation on every render
  const pie_chart_data = useMemo(() => {
    if (!data) return null;
    return [
      {
        data: [
          {
            id: 0,
            value: data.available_items,
            label: 'Available',
          },
          {
            id: 1,
            value: data.borrowed_items,
            label: 'Checked Out',
          },
          {
            id: 2,
            value: data.unshelved_items,
            label: 'Unshelved',
          },
          {
            id: 3,
            value: data.reserved_items,
            label: 'Reserved',
          },
        ],
      },
    ];
  }, [data]);

  return (
    <PageContainer>
      <PageTitle title="Library Dashboard" Icon_Component={Dashboard} />
      <Grid container spacing={3} sx={GRID_CONTAINER_SX}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard>
            <CardContent>
              <Link to="/library-items" style={LINK_STYLE}>
                <Box sx={ICON_BOX_SX}>
                  <LibraryBooks sx={ICON_SX_PRIMARY} />
                  <Typography variant="h6" component="h3" sx={HEADING_SX}>
                    Items Borrowed
                  </Typography>
                </Box>
              </Link>
              {isLoading && <Skeleton variant="text" width={100} height={30} />}
              {error && <Typography>-</Typography>}
              {data && !isLoading && !error && (
                <Typography variant="h3" sx={VALUE_SX_PRIMARY}>
                  {data.borrowed_items}
                </Typography>
              )}
            </CardContent>
          </DashboardCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard>
            <CardContent>
              <Link to="/reservations" style={LINK_STYLE}>
                <Box sx={ICON_BOX_SX}>
                  <EventNote sx={ICON_SX_SECONDARY} />
                  <Typography variant="h6" component="h3" sx={HEADING_SX}>
                    Reservations
                  </Typography>
                </Box>
              </Link>
              {isLoading && <Skeleton variant="text" width={100} height={30} />}
              {error && <Typography>-</Typography>}
              {data && !isLoading && !error && (
                <Typography variant="h3" sx={VALUE_SX_SECONDARY}>
                  {data.total_reservations}
                </Typography>
              )}
            </CardContent>
          </DashboardCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard>
            <CardContent>
              <Box sx={ICON_BOX_SX}>
                <AttachMoney sx={ICON_SX_ERROR} />
                <Typography variant="h6" component="h3" sx={HEADING_SX}>
                  Outstanding Fines
                </Typography>
              </Box>
              {isLoading && <Skeleton variant="text" width={100} height={30} />}
              {error && <Typography>-</Typography>}
              {data && !isLoading && !error && (
                <Typography variant="h3" sx={VALUE_SX_ERROR}>
                  ${Number(data.total_outstanding_fines).toFixed(2)}
                </Typography>
              )}
            </CardContent>
          </DashboardCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <DashboardCard>
            <CardContent>
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={HEADING_SX}
              >
                Inventory Status
              </Typography>
              {pie_chart_data && !isLoading && !error && (
                <PieChart series={pie_chart_data} width={300} height={400} />
              )}
            </CardContent>
          </DashboardCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

const CARD_SX = { height: 1, borderRadius: 3, boxShadow: 3 };

const DashboardCard = memo(({ children }: PropsWithChildren) => {
  return <Card sx={CARD_SX}>{children}</Card>;
});
