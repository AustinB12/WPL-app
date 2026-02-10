import {
  ArrowBack,
  CheckCircle,
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
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Input,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { type FC, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageContainer } from '../components/common/PageBuilders';
import { useBranchById, useUpdateBranch } from '../hooks/use_branches';
import { useSnackbar } from '../hooks/use_snackbar';
import type { Branch } from '../types/others';

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

interface EditBranchDialogProps {
  open: boolean;
  branch: Branch | null;
  on_close: () => void;
  on_save: (updates: Partial<Branch>) => void;
  is_loading?: boolean;
}

const EditBranchDialog: FC<EditBranchDialogProps> = ({
  open,
  branch,
  on_close,
  on_save,
  is_loading = false,
}) => {
  const [form_data, set_form_data] = useState({
    branch_name: branch?.branch_name || '',
    address: branch?.address || '',
    phone: branch?.phone || '',
    description: branch?.description || '',
    primary_color: branch?.primary_color || '',
    secondary_color: branch?.secondary_color || '',
    cover_image: branch?.cover_image || '',
  });

  const handle_change =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      set_form_data((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handle_save = () => {
    on_save(form_data);
  };

  return (
    <Dialog open={open} onClose={on_close} maxWidth='sm' fullWidth>
      <DialogTitle>Edit Branch Information</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label='Branch Name'
            fullWidth
            value={form_data.branch_name}
            onChange={handle_change('branch_name')}
            disabled={is_loading}
          />
          <TextField
            label='Address'
            fullWidth
            multiline
            rows={2}
            value={form_data.address}
            onChange={handle_change('address')}
            disabled={is_loading}
          />
          <TextField
            label='Phone'
            fullWidth
            value={form_data.phone}
            onChange={handle_change('phone')}
            disabled={is_loading}
          />
          <TextField
            label='Description'
            fullWidth
            multiline
            rows={3}
            value={form_data.description || ''}
            onChange={handle_change('description')}
            disabled={is_loading}
          />
          <Stack direction='row' spacing={2} alignItems='center'>
            <InputLabel htmlFor='primary-color-input'>Primary Color</InputLabel>
            <Input
              id='primary-color-input'
              type='color'
              sx={{ width: 50, height: 50, p: 0, border: 'none' }}
              value={form_data.primary_color || ''}
              onChange={handle_change('primary_color')}
              disabled={is_loading}
            />
            <InputLabel htmlFor='secondary-color-input'>
              Secondary Color
            </InputLabel>
            <Input
              id='secondary-color-input'
              type='color'
              sx={{ width: 50, height: 50, p: 0, border: 'none' }}
              value={form_data.secondary_color || ''}
              onChange={handle_change('secondary_color')}
              disabled={is_loading}
            />
          </Stack>
          <TextField
            label='Cover Image URL'
            fullWidth
            value={form_data.cover_image || ''}
            onChange={handle_change('cover_image')}
            disabled={is_loading}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={on_close} disabled={is_loading}>
          Cancel
        </Button>
        <Button
          onClick={handle_save}
          variant='contained'
          disabled={is_loading || !form_data.branch_name || !form_data.address}
        >
          {is_loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const BranchPage: FC = () => {
  const { branch_id } = useParams<{ branch_id: string }>();
  const { show_snackbar } = useSnackbar();

  const { mutate: update_branch } = useUpdateBranch();

  const [anchor_el, set_anchor_el] = useState<null | HTMLElement>(null);
  const [edit_dialog_open, set_edit_dialog_open] = useState(false);

  const open_menu = Boolean(anchor_el);

  const {
    data: branch,
    isLoading: loading,
    refetch,
  } = useBranchById(parseInt(branch_id || '1'));

  const overdue_rate = branch
    ? Math.round(
        (branch.item_copy_count_overdue / branch.item_copy_count_checked_out) *
          100,
      )
    : 0;

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

  const availability_percentage = Math.round(
    (branch.item_copy_count_active / branch.item_copy_count_total) * 100,
  );

  return (
    <PageContainer sx={{ overflowY: 'auto' }}>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${branch.primary_color}50 0%, ${branch.secondary_color}50 100%)`,
        }}
      >
        <Stack
          direction='row'
          alignItems='flex-start'
          justifyContent='space-between'
        >
          <Box sx={{ flex: 1 }}>
            <Stack
              direction='row'
              alignItems='center'
              spacing={1}
              sx={{ mb: 1 }}
            >
              <Typography variant='h4' fontWeight='bold'>
                {branch.branch_name}
              </Typography>
              {!!branch.is_main && (
                <Chip
                  icon={<Star />}
                  label='Main Branch'
                  color='primary'
                  size='small'
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>

            <Stack spacing={1.5} sx={{ mt: 2 }}>
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
              <Stack direction='row' alignItems='center' spacing={1}>
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
            </Stack>
          </Box>

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
            </Menu>
          </Box>
        </Stack>
      </Paper>

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
            subtitle={`${availability_percentage}% availability`}
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
                    {availability_percentage}%
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
                      width: `${availability_percentage}%`,
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
                    {Math.round(
                      (branch.item_copy_count_checked_out /
                        branch.item_copy_count_total) *
                        100,
                    )}
                    %
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
                  {(
                    branch.item_copy_count_checked_out / branch.patron_count
                  ).toFixed(1)}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Edit Dialog */}
      <EditBranchDialog
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
    </PageContainer>
  );
};
