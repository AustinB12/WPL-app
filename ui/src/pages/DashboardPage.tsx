import { PieChart } from '@mui/x-charts/PieChart';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Skeleton,
} from '@mui/material';
import { LibraryBooks, EventNote, AttachMoney } from '@mui/icons-material';
import type { FC, PropsWithChildren } from 'react';
import { useStats } from '../hooks/useStats';
import { Link } from 'react-router-dom';

export const DashboardPage: FC = () => {
  const { data, isLoading, error } = useStats();

  return (
    <Container sx={{ pt: 4, maxWidth: '7xl' }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 'bold', mb: 3 }}
      >
        Library Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard>
            <CardContent>
              <Link to="/library-items" style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LibraryBooks sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    Items Borrowed
                  </Typography>
                </Box>
              </Link>
              {isLoading && <Skeleton variant="text" width={100} height={30} />}
              {error && <Typography>-</Typography>}
              {data && !isLoading && !error && (
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 'bold', color: 'primary.main' }}
                >
                  {data.borrowed_items}
                </Typography>
              )}
            </CardContent>
          </DashboardCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard>
            <CardContent>
              <Link to="/reservations" style={{ textDecoration: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventNote sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{ fontWeight: 600 }}
                  >
                    Reservations
                  </Typography>
                </Box>
              </Link>
              {isLoading && <Skeleton variant="text" width={100} height={30} />}
              {error && <Typography>-</Typography>}
              {data && !isLoading && !error && (
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 'bold', color: 'secondary.main' }}
                >
                  {data ? data.total_reservations : 0}
                </Typography>
              )}
            </CardContent>
          </DashboardCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ mr: 1, color: 'error.main' }} />
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 600 }}
                >
                  Outstanding Fines
                </Typography>
              </Box>
              {isLoading && <Skeleton variant="text" width={100} height={30} />}
              {error && <Typography>-</Typography>}
              {data && !isLoading && !error && (
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 'bold', color: 'error.main' }}
                >
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
                sx={{ fontWeight: 600 }}
              >
                Inventory Status
              </Typography>
              {data && !isLoading && !error && (
                <PieChart
                  series={[
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
                  ]}
                  width={300}
                  height={400}
                />
              )}
            </CardContent>
          </DashboardCard>
        </Grid>
      </Grid>
    </Container>
  );
};

function DashboardCard({ children }: PropsWithChildren) {
  return (
    <Card sx={{ height: 1, borderRadius: 3, boxShadow: 3 }}>{children}</Card>
  );
}
