import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  AlertTitle,
  Step,
  StepLabel,
  Stepper,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { LibraryAdd } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PatronsDataGrid } from '../components/patrons/PatronsDataGrid';
import { CopiesDataGrid } from '../components/copies/CopiesDataGrid';
import { useCheckoutBook } from '../hooks/useTransactions';
import { ConfirmCheckoutDetails } from '../components/common/ConfirmCheckoutDetails';
import type { Item_Copy } from '../types';
import { CheckoutReceipt } from '../components/common/CheckoutReceipt';

const STEPS = ['Select Patron', 'Select Item', 'Confirm Details'] as const;

interface CheckOutFormData {
  patron_id: number;
  item: Item_Copy | null;
}

export const CheckOutItem: React.FC = () => {
  const [form_data, set_form_data] = useState<CheckOutFormData>({
    patron_id: 0,
    item: null,
  });

  const [error, set_error] = useState<string | null>(null);
  const [receipt_open, set_receipt_open] = useState<boolean>(false);
  const [active_step, set_active_step] = useState(0);

  const {
    mutate: checkoutBook,
    data: checkout_receipt,
    isSuccess,
    isError,
    isPending: loading,
    reset,
  } = useCheckoutBook();

  const handle_checkout_book = useCallback(() => {
    checkoutBook(
      {
        patron_id: form_data.patron_id,
        copy_id: form_data.item?.id || 0,
      },
      {
        onSuccess: () => {
          set_receipt_open(true);
        },
        onError: (error: Error) => {
          set_error(
            `Failed to check out item. ${
              error.message ? 'Error: ' + error.message : ''
            }`
          );
        },
      }
    );
  }, [checkoutBook, form_data.patron_id, form_data.item]);

  const handle_retry = useCallback(() => {
    set_error(null);
    handle_checkout_book();
  }, [handle_checkout_book]);

  const handle_next = () => {
    if (active_step === STEPS.length - 1) {
      if (isSuccess || !!checkout_receipt) {
        handle_reset();
      } else {
        handle_checkout_book();
      }
      return;
    }

    set_active_step((prev_step) => prev_step + 1);
  };

  const handle_back = () => {
    set_active_step((prev_step) => prev_step - 1);
  };

  const handle_reset = () => {
    set_active_step(0);
    set_form_data({ patron_id: 0, item: null });
    set_error(null);
    reset();
  };

  const is_next_disabled = () => {
    if (active_step === 0) return !form_data.patron_id;
    if (active_step === 1) return !form_data.item;
    return false;
  };

  const get_next_button_label = () => {
    if (active_step === STEPS.length - 1) {
      return isSuccess ? 'Reset' : 'Complete';
    }
    return 'Next';
  };

  const get_tooltip_message = () => {
    if (is_next_disabled()) {
      const missing_item = active_step === 0 ? 'patron' : 'item';
      return `Select ${missing_item} to proceed`;
    }
    if (active_step === STEPS.length - 1) {
      return isSuccess ? 'Reset' : 'Complete the transaction';
    }
    return 'Next Page';
  };

  const handle_patron_selected = (patron_id: string) => {
    set_form_data((prev) => ({ ...prev, patron_id: Number(patron_id) }));
  };

  const handle_copy_selected = (copy: Item_Copy) => {
    set_form_data((prev) => ({ ...prev, item: copy }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth="xl"
        sx={{
          py: 2,
          height: 1,
          maxHeight: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          title={'Active Step: ' + active_step}
          sx={{
            fontWeight: 'bold',
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          }}
        >
          <LibraryAdd color="primary" fontSize="large" />
          Check Out Item
        </Typography>

        <Snackbar
          open={!!error}
          autoHideDuration={60000}
          onClose={() => set_error(null)}
        >
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Check-out Error</AlertTitle>
            {error}
            <Button
              size="small"
              onClick={handle_retry}
              sx={{ mt: 1, display: 'block' }}
            >
              Try Again
            </Button>
          </Alert>
        </Snackbar>

        <Stepper activeStep={active_step}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {active_step === STEPS.length ? (
          <>
            <Typography sx={{ mt: 2, mb: 1 }}>
              {"All steps completed - you're finished"}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handle_reset}>Reset</Button>
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                flex: 1,
                mt: 2,
                overflow: 'hidden',
              }}
            >
              {active_step === 0 && (
                <PatronsDataGrid
                  onPatronSelected={handle_patron_selected}
                  check_overdue={true}
                  hidden_columns={['name_link']}
                />
              )}
              {active_step === 1 && (
                <CopiesDataGrid
                  just_available={true}
                  on_copy_selected={handle_copy_selected}
                />
              )}
              {active_step === 2 && form_data.item && (
                <ConfirmCheckoutDetails
                  patron_id={form_data.patron_id}
                  copy={form_data.item}
                  was_successful={isSuccess ? true : isError ? false : null}
                  loading={loading}
                />
              )}
              <Box />
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                pt: 2,
              }}
            >
              <Button
                disabled={active_step === 0}
                onClick={handle_back}
                sx={{ mr: 1 }}
                variant="outlined"
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Tooltip
                children={
                  <span>
                    {/* this span is needed to avoid a ref error caused by MUI code */}
                    <Button
                      variant="outlined"
                      onClick={handle_next}
                      disabled={is_next_disabled()}
                    >
                      {get_next_button_label()}
                    </Button>
                  </span>
                }
                title={get_tooltip_message()}
              ></Tooltip>
            </Box>
          </>
        )}
      </Container>
      <CheckoutReceipt
        open={receipt_open}
        on_close={() => set_receipt_open(false)}
        receipt={checkout_receipt}
      />
    </LocalizationProvider>
  );
};
