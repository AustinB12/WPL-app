import { type ReactNode, useCallback, useState } from 'react';
import { Snackbar_Context } from '../hooks/useSnackbar';
import type { Snackbar_Options, Snackbar_State } from '../types';

interface Snackbar_Provider_Props {
  children: ReactNode;
}

export const SnackbarProvider = ({ children }: Snackbar_Provider_Props) => {
  const [snackbar_state, set_snackbar_state] = useState<Snackbar_State>({
    open: false,
    message: '',
    severity: 'success',
    variant: 'filled',
    duration: 6000,
  });

  const show_snackbar = useCallback((options: Snackbar_Options) => {
    set_snackbar_state({
      open: true,
      message: options.message,
      severity: options.severity || 'success',
      variant: options.variant || 'filled',
      title: options.title,
      duration: options.duration || 6000,
    });
  }, []);

  const hide_snackbar = useCallback(() => {
    set_snackbar_state((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <Snackbar_Context.Provider
      value={{ show_snackbar, hide_snackbar, snackbar_state }}
    >
      {children}
    </Snackbar_Context.Provider>
  );
};
