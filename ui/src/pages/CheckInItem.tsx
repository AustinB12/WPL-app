import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Grid,
  Button,
  Chip,
  Box,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  AlertTitle,
  CardHeader,
} from '@mui/material';
import { useState, useEffect, type FC } from 'react';
import { type SelectChangeEvent } from '@mui/material/Select';
import { useBranchesContext, useSelectedBranch } from '../hooks/useBranchHooks';
import { get_condition_color } from '../utils/colors';
import { CheckedOutItemsGrid } from '../components/common/CheckedOutItemsGrid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { Item_Condition } from '../types';
import { useReturnBook } from '../hooks/useTransactions';
import { useCopyById } from '../hooks/useCopies';
import { format_date } from '../utils/dateUtils';

const conditions: string[] = ['New', 'Excellent', 'Good', 'Fair', 'Poor'];
const steps = ['Select Item', 'Confirm Details'];

interface CheckInFormData {
  copy_id: number | null;
  new_condition?: Item_Condition;
  new_location_id?: number;
  notes?: string;
}

export const CheckInItem: FC = () => {
  const [form_data, set_form_data] = useState<CheckInFormData>({
    copy_id: null,
  });

  const { selected_branch } = useSelectedBranch();

  const [active_step, set_active_step] = useState(0);
  const [skipped, set_skipped] = useState(new Set<number>());
  const [snackbar, set_snackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { branches, loading } = useBranchesContext();

  const [condition, set_condition] = useState<Item_Condition>('Excellent');

  const { data: copy_data } = useCopyById(form_data.copy_id ?? 0);

  // Update condition when copy data is fetched
  useEffect(() => {
    if (copy_data?.condition) {
      set_condition(copy_data.condition);
    }
  }, [copy_data]);

  const {
    mutate: return_book,
    isPending: is_returning,
    data: return_data,
  } = useReturnBook();

  const is_step_skipped = (step: number) => {
    return skipped.has(step);
  };

  const handle_next = () => {
    if (active_step === steps.length - 1) {
      return_book(
        {
          copy_id: form_data.copy_id || 0,
          new_condition: condition,
          new_location_id:
            form_data?.new_location_id || selected_branch?.id || 1,
          notes: form_data?.notes,
        },
        {
          onSuccess: (data) => {
            set_snackbar({
              open: true,
              message: `${data?.title} successfully checked in! ${
                data?.fine_amount && data.fine_amount > 0
                  ? ` Fine applied: $${data.fine_amount.toFixed(2)}`
                  : ''
              }`,
              severity: 'success',
            });
            // Reset form and go to completion step
            setTimeout(() => {
              set_active_step(steps.length);
              set_form_data({ copy_id: null });
              set_condition('Excellent');
            }, 1500);
          },
          onError: (error: Error) => {
            set_snackbar({
              open: true,
              message: `Failed to check in item: ${error.message}`,
              severity: 'error',
            });
          },
        }
      );
      return;
    }
    let new_skipped = skipped;
    if (is_step_skipped(active_step)) {
      new_skipped = new Set(new_skipped.values());
      new_skipped.delete(active_step);
    }

    set_active_step((prevActiveStep) => prevActiveStep + 1);
    set_skipped(new_skipped);
  };

  const handle_back = () => {
    set_active_step((prevActiveStep) => prevActiveStep - 1);
  };

  const handle_reset = () => {
    set_active_step(0);
    set_form_data({ copy_id: null });
    set_condition('Excellent');
    set_snackbar({ open: false, message: '', severity: 'success' });
  };

  const is_next_disabled = () => {
    if (active_step === 0 && (!form_data.copy_id || form_data.copy_id === null))
      return true;

    return false;
  };

  const handle_copy_selected = (copy_id: number) => {
    set_form_data((prev) => ({ ...prev, copy_id: copy_id }));
  };

  const handle_condition_change = (event: SelectChangeEvent) => {
    set_condition(event.target.value as Item_Condition);
  };

  const handle_notes_change = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_form_data((prev) => ({ ...prev, notes: event.target.value }));
  };

  const handle_change_branch = (event: SelectChangeEvent<string>) => {
    set_form_data((prev) => ({
      ...prev,
      new_location_id: Number(event.target.value),
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container
        maxWidth="xl"
        sx={{
          p: 4,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Typography
          onClick={() => console.log(return_data)}
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            mb: 3,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          }}
        >
          {'Check In Item'}
        </Typography>

        <Stepper activeStep={active_step} sx={{ mb: 3 }}>
          {steps.map((label, index) => {
            const stepProps: { completed?: boolean } = {};
            const labelProps: {
              optional?: React.ReactNode;
            } = {};
            if (is_step_skipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        {active_step === steps.length ? (
          <>
            <Card
              sx={{
                overflow: 'auto',
                maxHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                boxShadow: 2,
              }}
            >
              <CardHeader
                title="Check-In Receipt"
                subheader={`Transaction ID: #${return_data?.id}`}
              />
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  m: 2,
                }}
              >
                {/* Patron Information */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Patron Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        ID
                      </Typography>
                      <Typography variant="body1">
                        #{return_data?.patron_id}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {return_data?.first_name} {return_data?.last_name}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {return_data?.email}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {return_data?.phone}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Item Information */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Item Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Copy ID
                      </Typography>
                      <Typography variant="body1">
                        #{return_data?.copy_id}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Title
                      </Typography>
                      <Typography variant="body1">
                        {return_data?.title}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body1">
                        {return_data?.item_type}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body1">
                        {return_data?.branch_name}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Timeline */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Timeline
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Checkout Date
                      </Typography>
                      <Typography variant="body1">
                        {return_data?.checkout_date
                          ? format_date(return_data.checkout_date)
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Due Date
                      </Typography>
                      <Typography variant="body1">
                        {return_data?.due_date
                          ? format_date(return_data.due_date)
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Return Date
                      </Typography>
                      <Typography variant="body1">
                        {return_data?.return_date
                          ? format_date(return_data.return_date)
                          : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Fine or Success Message */}
                {return_data && return_data.fine_amount > 0 ? (
                  <Alert
                    sx={{
                      p: 2,
                      bgcolor: 'warning.light',
                      borderRadius: 1,
                    }}
                  >
                    <AlertTitle>⚠️ Overdue Fine</AlertTitle>
                    {`This item was returned after the due date.  Fine Amount: ${return_data.fine_amount.toFixed(
                      2
                    )}`}
                  </Alert>
                ) : (
                  <Alert
                    sx={{
                      p: 2,
                      borderRadius: 1,
                    }}
                    severity="success"
                  >
                    <AlertTitle>Returned On Time</AlertTitle>
                    No fines charged.
                  </Alert>
                )}

                {/* Notes (if present) */}
                {return_data?.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {return_data.notes}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button variant="outlined" onClick={handle_reset}>
                Check In Another Item
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              {active_step === 0 && (
                <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                  <CheckedOutItemsGrid
                    select_item_copy={handle_copy_selected}
                    hidden_columns={['branch_name']}
                  />
                </Box>
              )}
              {active_step === 1 && (
                <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
                  <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="condition-simple-select-label" shrink>
                        Condition
                      </InputLabel>
                      <Select
                        title="The condition of the library item"
                        disabled={!form_data.copy_id}
                        labelId="condition-simple-select-label"
                        id="condition-simple-select"
                        value={condition || form_data?.new_condition || ''}
                        label="Condition"
                        onChange={handle_condition_change}
                        notched
                      >
                        {conditions.map((c) => (
                          <MenuItem key={c} value={c}>
                            <Chip
                              label={c}
                              color={get_condition_color(c)}
                              variant="outlined"
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      disabled={!form_data.copy_id}
                      fullWidth
                      label="Notes"
                      multiline
                      rows={4}
                      value={form_data?.notes || ''}
                      onChange={handle_notes_change}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="branch-select-label">
                        {'New Location?'}
                      </InputLabel>
                      <Select
                        disabled={!form_data.copy_id || loading}
                        label={'New Location?'}
                        labelId="branch-select-label"
                        id="branch-select"
                        value={form_data?.new_location_id?.toString() || ''}
                        onChange={handle_change_branch}
                      >
                        {branches &&
                          branches.map((branch) => (
                            <MenuItem
                              key={branch.id}
                              value={branch.id.toString()}
                            >
                              {branch.branch_name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                pt: 2,
                flexShrink: 0,
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
                      disabled={is_next_disabled() || is_returning}
                      startIcon={
                        is_returning && active_step === steps.length - 1 ? (
                          <CircularProgress size={20} />
                        ) : null
                      }
                    >
                      {active_step === steps.length - 1
                        ? is_returning
                          ? 'Processing...'
                          : 'Finish'
                        : 'Next'}
                    </Button>
                  </span>
                }
                title={
                  is_next_disabled()
                    ? `Select ${
                        active_step === 0 ? 'patron' : 'item'
                      } to proceed`
                    : active_step === steps.length - 1
                    ? 'Finish Check-In'
                    : 'Next page'
                }
              ></Tooltip>
            </Box>
          </>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={snackbar.severity === 'success' ? 4000 : 6000}
          onClose={() => set_snackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => set_snackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};
