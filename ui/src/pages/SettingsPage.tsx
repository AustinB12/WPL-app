import {
  AccessTime,
  Info,
  NotificationsActive,
  Save,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  Box,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  type SxProps,
  TextField,
  type Theme,
  Typography,
} from '@mui/material';
import {
  type FC,
  type JSX,
  memo,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { useSnackbar } from '../hooks/useSnackbar';

const SECTION_PAPER_SX: SxProps<Theme> = {
  p: 3,
  borderRadius: 3,
  boxShadow: 4,
};

type Loan_Duration_Values = {
  book: number;
  audiobook: number;
  cd: number;
  magazine: number;
  video: number;
  new_video: number;
  periodical: number;
  recording: number;
  vinyl: number;
};

export const SettingsPage: FC = () => {
  const [notifications_enabled, set_notifications_enabled] = useState(true);
  const [email_updates, set_email_updates] = useState(false);

  const { show_snackbar } = useSnackbar();

  const [data, set_data] = useState<Loan_Duration_Values>({
    audiobook: 28,
    book: 21,
    cd: 14,
    magazine: 7,
    video: 7,
    new_video: 7,
    periodical: 7,
    recording: 7,
    vinyl: 7,
  });

  const { data: loan_durations, isLoading } = useSettings();

  const {
    mutate: update_loan_duration,
    isPending: update_loading,
    variables,
  } = useUpdateSettings();

  const handle_notifications_toggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      set_notifications_enabled(e.target.checked);
    },
    []
  );

  const handle_email_toggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      set_email_updates(e.target.checked);
    },
    []
  );

  useEffect(() => {
    if (loan_durations) {
      const updated_values: Loan_Duration_Values = {} as Loan_Duration_Values;
      loan_durations.forEach((setting) => {
        updated_values[
          setting.name.toLowerCase() as keyof Loan_Duration_Values
        ] = setting.duration;
      });
      set_data(updated_values);
    }
  }, [loan_durations]);

  const handle_days_change = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    which: string
  ) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      set_data((prev) => ({
        ...prev,
        [which]: value,
      }));
    } else if (e.target.value === '') {
      set_data((prev) => ({
        ...prev,
        [which]: 0,
      }));
    }
  };

  const handle_update_duration = (id: number, days: number) => {
    update_loan_duration(
      { id, duration: days },
      {
        onSuccess: () => {
          const name = loan_durations?.find((ld) => ld.id === id)?.name || '';
          show_snackbar({
            message: name + ' loan duration now set to ' + days + ' days',
            title: 'Loan Duration Updated',
            severity: 'success',
          });
        },
        onError: (error: Error) => {
          show_snackbar({
            title: 'Failed: ' + error.name,
            message: error.message,
            severity: 'error',
          });
        },
      }
    );
  };

  return (
    <PageContainer>
      <PageTitle title="Settings" Icon_Component={SettingsIcon} />
      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: 3, boxShadow: 4, overflowY: 'auto' }}
      >
        <Stack spacing={3}>
          <Paper elevation={1} sx={SECTION_PAPER_SX}>
            <SectionHeader icon={<AccessTime />}>Loan Durations</SectionHeader>
            <Typography sx={{ pt: 1 }} variant="body2" color="text.secondary">
              {
                'Set the default loan durations for different item types. (Days)'
              }
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={2} rowSpacing={4}>
              {loan_durations &&
                !isLoading &&
                loan_durations.map((setting) => {
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={setting.id}>
                      <Stack direction="row" alignItems="center">
                        <TextField
                          key={setting.id}
                          disabled={isLoading}
                          label={`${setting.name.toUpperCase()}`}
                          type="number"
                          value={
                            data[
                              setting.name.toLowerCase() as keyof Loan_Duration_Values
                            ] || ''
                          }
                          onChange={(e) =>
                            handle_days_change(e, setting.name.toLowerCase())
                          }
                          slotProps={{
                            htmlInput: {
                              min: 1,
                              max: 365,
                              step: 1,
                            },
                          }}
                          fullWidth
                          sx={{ maxWidth: 400, minWidth: 200 }}
                        />
                        <IconButton
                          loading={
                            update_loading && variables?.id === setting.id
                          }
                          onClick={() =>
                            handle_update_duration(
                              setting.id,
                              data[
                                setting.name.toLowerCase() as keyof Loan_Duration_Values
                              ] || 28
                            )
                          }
                        >
                          <Save fontSize="large" />
                        </IconButton>
                      </Stack>
                    </Grid>
                  );
                })}
            </Grid>
          </Paper>
          <Paper elevation={1} sx={SECTION_PAPER_SX}>
            <SectionHeader icon={<NotificationsActive />}>
              Notifications
            </SectionHeader>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <SettingItem
                label="Enable Notifications"
                description="Receive notifications for important events"
                checked={notifications_enabled}
                onChange={handle_notifications_toggle}
              />
              <SettingItem
                label="Email Updates"
                description="Receive email notifications for overdue items"
                checked={email_updates}
                onChange={handle_email_toggle}
                disabled={!notifications_enabled}
              />
            </Stack>
          </Paper>
          <Paper elevation={1} sx={SECTION_PAPER_SX}>
            <SectionHeader icon={<Info />}>System Information</SectionHeader>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  1.0.0
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Environment
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {import.meta.env.MODE === 'development' ? 'DEV' : 'PROD'}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Paper>
    </PageContainer>
  );
};

const SectionHeader = memo<PropsWithChildren<{ icon: JSX.Element }>>(
  ({ icon, children }) => (
    <Stack direction="row" alignItems="center" spacing={1}>
      {icon}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {children}
      </Typography>
    </Stack>
  )
);

SectionHeader.displayName = 'SectionHeader';

const SettingItem: FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}> = ({ label, description, checked, onChange, disabled = false }) => (
  <Box>
    <FormControlLabel
      control={
        <Switch checked={checked} onChange={onChange} disabled={disabled} />
      }
      label={label}
    />
    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
      {description}
    </Typography>
  </Box>
);
