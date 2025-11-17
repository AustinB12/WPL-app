import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Divider,
  FormControlLabel,
  Switch,
  type SxProps,
  type Theme,
} from '@mui/material';
import {
  useState,
  useCallback,
  memo,
  type FC,
  type JSX,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from '@mui/material';
import { Info, NotificationsActive, Palette } from '@mui/icons-material';

const SECTION_PAPER_SX: SxProps<Theme> = {
  p: 3,
  borderRadius: 3,
  boxShadow: 4,
};

export const SettingsPage: FC = () => {
  const { mode, setMode } = useColorScheme();
  const [notifications_enabled, set_notifications_enabled] = useState(true);
  const [email_updates, set_email_updates] = useState(false);

  const handle_theme_toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

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

  return (
    <Container maxWidth="lg" sx={{ p: 4 }}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, boxShadow: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: '500',
            mb: 3,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          }}
        >
          Settings
        </Typography>

        <Stack spacing={3}>
          <Paper elevation={1} sx={SECTION_PAPER_SX}>
            <SectionHeader icon={<Palette />}>Appearance</SectionHeader>
            <Divider sx={{ my: 2 }} />
            <SettingItem
              label="Dark Mode"
              description="Toggle between light and dark themes"
              checked={mode === 'dark'}
              onChange={handle_theme_toggle}
            />
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
    </Container>
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
