import { createContext, useContext } from 'react';
import type { Snackbar_Options, Snackbar_State } from '../types/others';

interface Snackbar_Context_Type {
  show_snackbar: (options: Snackbar_Options) => void;
  hide_snackbar: () => void;
  snackbar_state: Snackbar_State;
}

export const Snackbar_Context = createContext<
  Snackbar_Context_Type | undefined
>(undefined);

export const useSnackbar = () => {
  const context = useContext(Snackbar_Context);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};
