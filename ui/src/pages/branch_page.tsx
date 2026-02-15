import {
  ArrowBack,
  CheckCircle,
  Delete,
  Edit,
  LocalLibrary,
  LocationOn,
  MoreVert,
  Phone,
  Schedule,
  Star,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { type FC, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Cover_Image_Dialog } from '../components/branch/Cover_Image_Dialog';
import { Edit_Branch_Dialog } from '../components/branch/Edit_Branch_Dialog';
import { PageContainer } from '../components/common/PageBuilders';
import { useBranchById, useUpdateBranch } from '../hooks/use_branches';
import { useImageUrl } from '../hooks/use_images';
import { useSnackbar } from '../hooks/use_snackbar';

// Helper to get branch cover image URL with optional cache buster
const get_branch_cover_url = (
  branch: { id: number; image_id?: number; cover_image?: string } | null,
  image_url_fn: (entity_type: 'BRANCH', id: number) => string,
  cache_buster?: number,
): string | undefined => {
  if (!branch) return undefined;
  // If branch has an image_id, use the IMAGES table endpoint
  if (branch.image_id) {
    const base_url = image_url_fn('BRANCH', branch.id);
    // Append cache buster to force browser to refetch
    return cache_buster ? `${base_url}?v=${cache_buster}` : base_url;
  }
  // Fallback to legacy cover_image field
  return branch.cover_image;
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => (
  <Card
    sx={{
      height: '100%',
      borderRadius: 4,
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: 6,
      },
    }}
  >
    <CardContent>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ mb: 2 }}
      >
        <Box
          sx={{
            bgcolor: `${color}.light`,
            borderRadius: 6,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            cornerShape: 'squircle',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Typography variant='h3' fontWeight='bold' gutterBottom>
          {value}
        </Typography>
      </Stack>
      <Typography variant='body2' color='text.secondary' gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant='caption' color='text.secondary'>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export const Branch_Page: FC = () => {
  const { branch_id } = useParams<{ branch_id: string }>();
  const { show_snackbar } = useSnackbar();

  const { mutate: update_branch } = useUpdateBranch();

  const [anchor_el, set_anchor_el] = useState<null | HTMLElement>(null);
  const [edit_dialog_open, set_edit_dialog_open] = useState(false);
  const [cover_image_dialog_open, set_cover_image_dialog_open] =
    useState(false);
  const [image_cache_buster, set_image_cache_buster] = useState<number>(
    Date.now(),
  );

  const open_menu = Boolean(anchor_el);

  const {
    data: branch,
    isLoading: loading,
    refetch,
  } = useBranchById(parseInt(branch_id || '1'));

  // Get cover image URL - uses IMAGES table if image_id exists, otherwise falls back to cover_image
  const branch_cover_image_url = get_branch_cover_url(
    branch ?? null,
    useImageUrl,
    image_cache_buster,
  );

  if (!branch_id) {
    return (
      <Container sx={{ p: 3 }}>
        <Alert severity='error'>No branch ID provided</Alert>
        <Link to='/' style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBack />} sx={{ mt: 2 }}>
            Back to Home
          </Button>
        </Link>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!branch) {
    return (
      <Container sx={{ p: 3 }}>
        <Alert severity='error'>
          <AlertTitle>Branch not found</AlertTitle>
          No branch exists with ID: {branch_id}
        </Alert>
        <Link to='/' style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBack />} sx={{ mt: 2 }}>
            Back to Home
          </Button>
        </Link>
      </Container>
    );
  }

  const handle_menu_click = (event: React.MouseEvent<HTMLElement>) => {
    set_anchor_el(event.currentTarget);
  };

  const handle_menu_close = () => {
    set_anchor_el(null);
  };

  const handle_edit_click = () => {
    set_edit_dialog_open(true);
    handle_menu_close();
  };

  const overdue_rate = branch?.item_copy_count_checked_out
    ? Math.round(
        (branch.item_copy_count_overdue / branch.item_copy_count_checked_out) *
          100,
      )
    : 0;

  const availability_rate = branch?.item_copy_count_total
    ? Math.round(
        (branch.item_copy_count_active / branch.item_copy_count_total) * 100,
      )
    : 0;

  const utilization_rate = branch?.item_copy_count_total
    ? Math.round(
        (branch.item_copy_count_checked_out / branch.item_copy_count_total) *
          100,
      )
    : 0;

  const items_per_patron = branch?.patron_count
    ? (branch.item_copy_count_checked_out / branch.patron_count).toFixed(1)
    : '0';

  return (
    <PageContainer sx={{ overflowY: 'auto' }}>
      <Grid container sx={{ width: '100%' }} spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              height: '100%',
              width: '100%',
              borderRadius: 3,
              background: `linear-gradient(135deg, ${branch.primary_color}50 0%, ${branch.secondary_color}50 100%)`,
            }}
          >
            <CardHeader
              title={
                <Typography variant='h4' fontWeight='bold'>
                  {branch.branch_name}
                </Typography>
              }
              subheader={
                !!branch.is_main && (
                  <Chip
                    icon={<Star />}
                    label='Main Branch'
                    color='primary'
                    size='small'
                    sx={{ fontWeight: 600 }}
                  />
                )
              }
              action={
                <Box>
                  <IconButton onClick={handle_menu_click}>
                    <MoreVert />
                  </IconButton>
                  <Menu
                    anchorEl={anchor_el}
                    open={open_menu}
                    onClose={handle_menu_close}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem sx={{ gap: 2 }} onClick={handle_edit_click}>
                      <Edit fontSize='small' /> Edit Branch
                    </MenuItem>
                    <MenuItem sx={{ gap: 2 }} onClick={handle_edit_click}>
                      <Delete fontSize='small' /> Delete Branch
                    </MenuItem>
                  </Menu>
                </Box>
              }
            ></CardHeader>
            <CardContent>
              <Stack direction='row' alignItems='center' spacing={1}>
                <LocationOn
                  sx={{
                    color: 'text.secondary',
                    fontSize: 20,
                  }}
                />
                <Typography variant='body2' color='text.secondary'>
                  {branch.address}
                </Typography>
              </Stack>
              <Stack
                direction='row'
                alignItems='center'
                spacing={1}
                sx={{ my: 2 }}
              >
                <Phone
                  sx={{
                    color: 'text.secondary',
                    fontSize: 20,
                  }}
                />
                <Typography variant='body2' color='text.secondary'>
                  {branch.phone}
                </Typography>
              </Stack>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                {branch.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ width: '100%', position: 'relative' }}>
            <Box
              component={'img'}
              src={branch_cover_image_url}
              alt={`${branch.branch_name} Cover`}
              sx={{
                borderRadius: 3,
                width: '100%',
              }}
            />
            <Box
              sx={{
                width: '80%',
                height: '80%',
                bgcolor: 'primary.main',
                position: 'absolute',
                top: 0,
                right: 0,
                borderRadius: 3,
                opacity: 0,
                transition: 'opacity 0.3s ease',
                background: `linear-gradient(35deg, #00000000 60%, #00000095 80%, #000000 100%)`,
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              <Edit
                onClick={() => set_cover_image_dialog_open(true)}
                sx={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 20,
                  right: 20,
                  fill: 'white',
                }}
              ></Edit>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Statistics Section */}
      <Typography variant='h5' fontWeight='bold'>
        Branch Statistics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title='Total Copies'
            value={branch.item_copy_count_total.toLocaleString()}
            icon={<LocalLibrary sx={{ color: 'primary.main', fontSize: 28 }} />}
            color='primary'
            subtitle='All items in this branch'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title='Available Copies'
            value={branch.item_copy_count_active.toLocaleString()}
            icon={<CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />}
            color='success'
            subtitle={`${availability_rate}% availability`}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title='Checked Out'
            value={branch.item_copy_count_checked_out.toLocaleString()}
            icon={<Schedule sx={{ color: 'info.main', fontSize: 28 }} />}
            color='info'
            subtitle='Currently on loan'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title='Unshelved'
            value={branch.item_copy_count_unshelved.toLocaleString()}
            icon={<Star sx={{ color: 'warning.main', fontSize: 28 }} />}
            color='warning'
            subtitle='Pending reshelve'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title='Overdue'
            value={branch.item_copy_count_overdue.toLocaleString()}
            icon={<Warning sx={{ color: 'error.main', fontSize: 28 }} />}
            color='error'
            subtitle='Past due date'
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title='Active Patrons'
            value={branch.patron_count.toLocaleString()}
            icon={<TrendingUp sx={{ color: 'secondary.main', fontSize: 28 }} />}
            color='secondary'
            subtitle='Registered members'
          />
        </Grid>
      </Grid>

      {/* Collection Overview */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          Collection Overview
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              <Box>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  sx={{ mb: 1 }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Availability Rate
                  </Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {availability_rate}%
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    height: 8,
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${availability_rate}%`,
                      bgcolor: 'success.main',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  sx={{ mb: 1 }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Utilization Rate
                  </Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    {utilization_rate}%
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    height: 8,
                    bgcolor: 'grey.200',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${
                        (branch.item_copy_count_checked_out /
                          branch.item_copy_count_total) *
                        100
                      }%`,
                      bgcolor: 'info.main',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='body2' color='text.secondary'>
                  Total Circulation
                </Typography>
                <Typography variant='body2' fontWeight='bold'>
                  {(
                    branch.item_copy_count_checked_out +
                    branch.item_copy_count_reserved
                  ).toLocaleString()}
                </Typography>
              </Stack>
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='body2' color='text.secondary'>
                  Overdue Rate
                </Typography>
                <Typography
                  variant='body2'
                  fontWeight='bold'
                  color={
                    overdue_rate > 20
                      ? 'error'
                      : overdue_rate > 10
                        ? 'warning'
                        : 'success'
                  }
                >
                  {overdue_rate}%
                </Typography>
              </Stack>
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='body2' color='text.secondary'>
                  Items per Patron
                </Typography>
                <Typography variant='body2' fontWeight='bold'>
                  {items_per_patron}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Edit Dialog */}
      <Edit_Branch_Dialog
        open={edit_dialog_open}
        branch={branch}
        on_close={() => set_edit_dialog_open(false)}
        on_save={(form_data) =>
          update_branch(
            { branch_id: branch?.id || 1, branch_data: form_data },
            {
              onSuccess: () => {
                show_snackbar({
                  message: 'Branch updated successfully!',
                  severity: 'success',
                  title: 'Success!',
                });
                set_edit_dialog_open(false);
                refetch();
              },
              onError: (error) => {
                show_snackbar({
                  title: 'Failed to update branch',
                  message: error.message,
                  severity: 'error',
                });
              },
            },
          )
        }
      />

      {/* Cover Image Dialog */}
      <Cover_Image_Dialog
        open={cover_image_dialog_open}
        branch_id={branch.id}
        current_image_url={branch_cover_image_url}
        on_close={() => set_cover_image_dialog_open(false)}
        on_success={() => {
          set_image_cache_buster(Date.now()); // Force browser to refetch image
          refetch();
        }}
      />
    </PageContainer>
  );
};
