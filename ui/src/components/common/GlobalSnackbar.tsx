import { Alert, AlertTitle, Snackbar } from '@mui/material';
import { useSnackbar } from '../../hooks/use_snackbar';

export const GlobalSnackbar = () => {
  const { snackbar_state, hide_snackbar } = useSnackbar();

  return (
    <Snackbar
      open={snackbar_state.open}
      autoHideDuration={snackbar_state.duration}
      onClose={hide_snackbar}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={hide_snackbar}
        severity={snackbar_state.severity}
        variant={snackbar_state.variant}
        sx={{ width: '100%' }}
      >
        {snackbar_state.title && (
          <AlertTitle color="inherit">{snackbar_state.title}</AlertTitle>
        )}
        {snackbar_state.message}
      </Alert>
    </Snackbar>
  );
};
