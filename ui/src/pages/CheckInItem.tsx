import {
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
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Card,
  CardContent,
  AlertTitle,
  CardHeader,
  Paper,
  Snackbar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { useState, useEffect, type FC } from 'react';
import { type SelectChangeEvent } from '@mui/material/Select';
import { useBranchesContext, useSelectedBranch } from '../hooks/useBranchHooks';
import { get_condition_color } from '../utils/colors';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type { Item_Condition } from '../types';
import { useReturnBook, useCheckedOutItems } from '../hooks/useTransactions';
import { useCopyById } from '../hooks/useCopies';
import { format_date } from '../utils/dateUtils';
import { CheckCircle, ErrorOutline, Warning, Input } from '@mui/icons-material';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';

const conditions: Item_Condition[] = [
  'New',
  'Excellent',
  'Good',
  'Fair',
  'Poor',
];
const steps = ['Enter Copy ID', 'Enter Condition & Notes', 'Confirm Check-In'];

interface CheckInFormData {
  copy_id: number | null;
  new_condition?: Item_Condition;
  new_location_id?: number;
  notes?: string;
}

interface CopyInfo {
  copy_id: number;
  copy_label: string;
  copy_number: number;
  total_copies: number;
  status: string;
  condition: string;
  patron_name: string;
  patron_id: number;
  due_date: string;
  is_overdue: boolean;
  days_overdue: number;
  fine_amount: number;
}

interface ItemInfo {
  id: number;
  title: string;
  item_type: string;
  author?: string;
  director?: string;
}

export const CheckInItem: FC = () => {
  const [form_data, set_form_data] = useState<CheckInFormData>({
    copy_id: null,
  });

  const API_BASE_URL = 'http://localhost:3000/api/v1';

  const { selected_branch } = useSelectedBranch();

  const [active_step, set_active_step] = useState(0);
  const [snackbar, set_snackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [item_id_input, set_item_id_input] = useState('');
  const [item_info, set_item_info] = useState<ItemInfo | null>(null);
  const [selected_copy, set_selected_copy] = useState<CopyInfo | null>(null);
  const [loading_details, set_loading_details] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);

  const { branches } = useBranchesContext();
  const { data: checked_out_items = [], isLoading: loading_checked_out } =
    useCheckedOutItems(selected_branch?.id);

  const [condition, set_condition] = useState<Item_Condition>('Excellent');

  const { data: copy_data } = useCopyById(form_data.copy_id ?? 0);

  // Update condition when copy data is fetched
  useEffect(() => {
    if (copy_data?.condition) {
      // Only set condition if it's a valid condition value
      const valid_conditions = ['New', 'Excellent', 'Good', 'Fair', 'Poor'];
      if (valid_conditions.includes(copy_data.condition)) {
        set_condition(copy_data.condition as Item_Condition);
      }
    }
  }, [copy_data]);

  const {
    mutate: return_book,
    isPending: is_returning,
    data: return_data,
  } = useReturnBook();

  // Fetch copy details when copy ID (barcode) is entered
  const fetch_item_details = async (copy_id: number) => {
    set_loading_details(true);
    set_error_message(null);
    set_item_info(null);
    set_selected_copy(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions/checkin-lookup/${copy_id}`
      );

      // Get response as text first to check if it's JSON
      const text = await response.text();

      // Check if response is HTML (error page)
      if (
        text.trim().startsWith('<!DOCTYPE') ||
        text.trim().startsWith('<html')
      ) {
        throw new Error(
          `Server returned HTML instead of JSON. HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Invalid JSON response from server. HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to lookup copy');
      }

      // Set item info
      set_item_info(data.data.item);

      // Create CopyInfo object from the response (single copy lookup)
      const copyInfo: CopyInfo = {
        copy_id: data.data.copy.copy_id,
        copy_label: data.data.copy.copy_label,
        copy_number: data.data.copy.copy_number,
        total_copies: data.data.copy.total_copies,
        status: data.data.copy.status,
        condition: data.data.copy.condition,
        patron_name: data.data.patron.patron_name,
        patron_id: data.data.patron.id,
        due_date: data.data.transaction.due_date,
        is_overdue: data.data.transaction.is_overdue,
        days_overdue: data.data.transaction.days_overdue,
        fine_amount: data.data.transaction.fine_amount,
      };

      // Auto-select the copy and move to review step
      set_selected_copy(copyInfo);
      set_form_data((prev) => ({
        ...prev,
        copy_id: copyInfo.copy_id,
      }));

      // Only set condition if it's a valid condition value
      const copy_condition = copyInfo.condition as string;
      if (
        copy_condition &&
        conditions.includes(copy_condition as Item_Condition)
      ) {
        set_condition(copy_condition as Item_Condition);
      } else {
        // Default to 'Good' if condition is invalid or missing
        set_condition('Good');
      }

      // Advance to step 1 to show book info and allow condition/notes entry
      set_active_step(1);
    } catch (error: Error | unknown) {
      set_error_message(
        error instanceof Error ? error.message : 'Failed to load copy details'
      );
    } finally {
      set_loading_details(false);
    }
  };

  const handle_lookup_item = () => {
    const copy_id = parseInt(item_id_input);
    if (isNaN(copy_id) || copy_id <= 0) {
      set_error_message('Please enter a valid Copy ID (Barcode)');
      return;
    }
    fetch_item_details(copy_id);
  };

  const handle_next = () => {
    // If we're on the last step (step 1 - Confirm Check-In), process the check-in
    if (active_step === steps.length - 1) {
      if (!form_data.copy_id || form_data.copy_id <= 0) {
        set_error_message('Copy ID is required');
        return;
      }

      // Clear any previous error messages
      set_error_message(null);

      return_book(
        {
          copy_id: form_data.copy_id,
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
            // Advance to success screen (step 3 - receipt)
            set_active_step(steps.length); // steps.length = 3, which shows the success screen
            // Clear error messages
            set_error_message(null);
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

    // Normal step progression (step 0 -> step 1)
    set_active_step((prevActiveStep) => prevActiveStep + 1);
  };

  const handle_back = () => {
    set_active_step((prevActiveStep) => prevActiveStep - 1);
  };

  const handle_reset = () => {
    set_active_step(0);
    set_form_data({ copy_id: null });
    set_condition('Excellent');
    set_item_id_input('');
    set_item_info(null);
    set_selected_copy(null);
    set_error_message(null);
  };

  // const handle_close_snackbar = () => {
  //   set_snackbar_open(false);
  // };

  const is_next_disabled = () => {
    if (active_step === 0 && !selected_copy) return true;
    if (active_step === 1 && !selected_copy) return true;
    // Step 2: Allow next if copy is found (condition and notes are optional)
    return false;
  };

  const handle_condition_change = (event: SelectChangeEvent) => {
    set_condition(event.target.value as Item_Condition);
  };

  const handle_notes_change = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_form_data((prev) => ({ ...prev, notes: event.target.value }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PageContainer>
        <PageTitle title="Check In Item" Icon_Component={Input} />

        <Stepper
          activeStep={active_step}
          sx={{
            mb: 3,
            flexShrink: 0,
            '& .MuiStepLabel-root': {
              '& .MuiStepLabel-label': {
                fontSize: '0.875rem',
                fontWeight: 500,
              },
            },
          }}
        >
          {steps.map((label) => {
            return (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        {active_step === steps.length ? (
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              mb: 8, // Add bottom margin to prevent content from being covered by bottom bar
            }}
          >
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
                  pt: 0,
                  gap: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  m: 2,
                }}
              >
                <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                  <AlertTitle>Check-In Successful!</AlertTitle>
                  Copy {return_data?.copy_id || form_data.copy_id} has been
                  successfully checked in.
                  {return_data?.fine_amount && return_data.fine_amount > 0 ? (
                    <>
                      {' '}
                      A fine of ${return_data.fine_amount.toFixed(2)} has been
                      applied to the patron's account.
                    </>
                  ) : (
                    <>
                      <br />
                      <strong>✓ Returned On Time</strong>
                      <br />
                      No fines have been assessed for this return.
                    </>
                  )}
                  {return_data?.reservation_fulfilled &&
                  return_data.reservation_fulfilled.patron ? (
                    <>
                      <br />
                      <strong>Reservation Fulfilled:</strong> This item has been
                      reserved for{' '}
                      {return_data.reservation_fulfilled.patron.name} (Patron
                      ID: {return_data.reservation_fulfilled.patron.id}). The
                      item is now ready for pickup.
                    </>
                  ) : null}
                </Alert>

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

                {/* Fine Message (only show if there's a fine) */}
                {return_data && return_data.fine_amount > 0 && (
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
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, pb: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button variant="outlined" onClick={handle_reset}>
                Check In Another Item
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: 0,
                mb: 8, // Add bottom margin to prevent content from being covered
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  pr: 1, // Add padding for scrollbar
                }}
              >
                {active_step === 0 && (
                  // <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                  //   <CheckedOutItemsGrid
                  //     select_item_copy={handle_copy_selected}
                  //     hidden_columns={['branch_name']}
                  //   />
                  // </Box>
                  <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                          Enter Copy ID (Barcode) to Check In
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 3 }}
                        >
                          Enter the unique Copy ID (Barcode) for the specific
                          physical copy being returned. Each copy has its own
                          unique ID.
                        </Typography>

                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <TextField
                            label="Copy ID (Barcode)"
                            value={item_id_input}
                            onChange={(e) => set_item_id_input(e.target.value)}
                            onKeyUp={(e) => {
                              if (e.key === 'Enter') handle_lookup_item();
                            }}
                            placeholder="Scan barcode or enter copy ID"
                            type="number"
                            fullWidth
                            error={!!error_message}
                            disabled={loading_details}
                          />
                          <Button
                            variant="contained"
                            onClick={handle_lookup_item}
                            disabled={!item_id_input || loading_details}
                            sx={{ minWidth: 120 }}
                            startIcon={
                              loading_details ? (
                                <CircularProgress size={20} />
                              ) : null
                            }
                          >
                            {loading_details ? 'Searching...' : 'Search'}
                          </Button>
                        </Stack>

                        {error_message && (
                          <Alert
                            severity="error"
                            sx={{ mb: 2 }}
                            icon={<ErrorOutline />}
                            onClose={() => set_error_message(null)}
                          >
                            {error_message}
                          </Alert>
                        )}

                        {item_info && selected_copy && (
                          <Alert
                            severity="success"
                            sx={{ mt: 2 }}
                            icon={<CheckCircle />}
                          >
                            <AlertTitle>Copy Found!</AlertTitle>
                            {item_info.title} (Copy ID: {selected_copy.copy_id})
                            is ready to check in. Click "Next" to continue.
                          </Alert>
                        )}
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper
                        sx={{
                          p: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 3,
                          // border: '2px solid deeppink',
                        }}
                      >
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                          Checked-Out Items
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Click an item below to check it in, or enter a Copy ID
                          above.
                        </Typography>

                        {loading_checked_out ? (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              p: 3,
                            }}
                          >
                            <CircularProgress />
                          </Box>
                        ) : checked_out_items.length === 0 ? (
                          <Alert severity="info">
                            No items are currently checked out.
                          </Alert>
                        ) : (
                          <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            <List
                              dense
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                              }}
                            >
                              {checked_out_items.map((item) => (
                                <ListItem
                                  key={item.transaction_id}
                                  disablePadding
                                >
                                  <ListItemButton
                                    onClick={() => {
                                      set_item_id_input(
                                        item.copy_id.toString()
                                      );
                                      fetch_item_details(item.copy_id);
                                    }}
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 2,
                                      '&:hover': {
                                        bgcolor: 'action.hover',
                                      },
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Typography
                                          variant="body1"
                                          fontWeight="medium"
                                        >
                                          {`${item.title} | Copy #${item.copy_id}`}
                                        </Typography>
                                      }
                                      secondaryTypographyProps={{ component: 'div' }}
                                      secondary={
                                        <>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            component="div"
                                            sx={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              gap: 2,
                                            }}
                                          >
                                            <span>{item.copy_label}</span>
                                            <span>
                                              Checked Out By: {item.patron_name}{' '}
                                              (ID: {item.patron_id})
                                            </span>
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            component="div"
                                          ></Typography>
                                          <Stack
                                            direction={'row'}
                                            sx={{
                                              alignItems: 'center',
                                              gap: 1,
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              color={
                                                item.is_overdue
                                                  ? 'error.main'
                                                  : 'text.secondary'
                                              }
                                              sx={{
                                                fontWeight: item.is_overdue
                                                  ? 600
                                                  : 400,
                                              }}
                                              component="span"
                                            >
                                              Due: {format_date(item.due_date)}
                                            </Typography>
                                            {item.days_overdue > 0 && (
                                              <Chip
                                                label={`${item.days_overdue} days overdue`}
                                                color="error"
                                                size="small"
                                              />
                                            )}
                                          </Stack>
                                        </>
                                      }
                                    />
                                  </ListItemButton>
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {/* Step 1: Enter Condition & Notes */}
                {active_step === 1 && selected_copy && item_info && (
                  <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                      <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                          Enter Condition & Notes
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 3 }}
                        >
                          Review the item information and update the condition
                          and notes.
                        </Typography>

                        {/* Book Information Display */}
                        <Paper
                          elevation={1}
                          sx={{
                            bgcolor: 'background.default',
                            p: 3,
                            mb: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            gutterBottom
                          >
                            ITEM INFORMATION
                          </Typography>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            gutterBottom
                          >
                            {item_info.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Copy ID: {selected_copy.copy_id} |{' '}
                            {selected_copy.copy_label} | Type:{' '}
                            {item_info.item_type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Checked Out By: {selected_copy.patron_name} (ID:{' '}
                            {selected_copy.patron_id})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Due Date:{' '}
                            {new Date(
                              selected_copy.due_date
                            ).toLocaleDateString()}
                            {selected_copy.is_overdue && (
                              <Chip
                                label={`Overdue ${selected_copy.days_overdue} days`}
                                color="error"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>
                          {selected_copy.is_overdue && (
                            <Typography
                              variant="body2"
                              color="error"
                              fontWeight="600"
                              sx={{ mt: 1 }}
                            >
                              Late Fee: ${selected_copy.fine_amount.toFixed(2)}
                            </Typography>
                          )}
                        </Paper>

                        {/* Condition and Notes Fields */}
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                              <InputLabel id="condition-select-label" shrink>
                                Condition
                              </InputLabel>
                              <Select
                                title="The condition of the library item"
                                labelId="condition-select-label"
                                id="condition-select"
                                value={
                                  condition && conditions.includes(condition)
                                    ? condition
                                    : ''
                                }
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
                              fullWidth
                              label="Notes"
                              multiline
                              rows={4}
                              value={form_data?.notes || ''}
                              onChange={handle_notes_change}
                              placeholder="Add any notes about the item condition or return..."
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {/* Step 2: Confirm Check-In */}
                {active_step === 2 && selected_copy && item_info && (
                  <Grid container spacing={2} sx={{ mb: 2, pt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                      <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                          Confirm Check-In
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Review the details below and confirm to complete the
                          check-in
                        </Typography>

                        <Paper
                          elevation={1}
                          sx={{
                            bgcolor: 'background.default',
                            p: 2,
                            mb: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                gutterBottom
                              >
                                ITEM INFORMATION
                              </Typography>
                              <Typography
                                variant="body1"
                                fontWeight="600"
                                gutterBottom
                              >
                                {item_info.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {selected_copy.copy_label} | Type:{' '}
                                {item_info.item_type}
                              </Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                              <Divider />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                gutterBottom
                              >
                                PATRON INFORMATION
                              </Typography>
                              <Typography variant="body1" fontWeight="600">
                                {selected_copy.patron_name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Patron ID: {selected_copy.patron_id}
                              </Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                              <Divider />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                gutterBottom
                              >
                                RETURN DETAILS
                              </Typography>
                              <Typography variant="body2" color="text.primary">
                                Due Date:{' '}
                                {new Date(
                                  selected_copy.due_date
                                ).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.primary">
                                Condition: {condition || 'Good'}
                              </Typography>
                              {form_data?.notes && (
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  sx={{ mt: 0.5 }}
                                >
                                  Notes: {form_data.notes}
                                </Typography>
                              )}
                              {form_data.new_location_id && (
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                >
                                  New Location:{' '}
                                  {
                                    branches?.find(
                                      (b) => b.id === form_data.new_location_id
                                    )?.branch_name
                                  }
                                </Typography>
                              )}
                            </Grid>

                            {selected_copy.is_overdue && (
                              <>
                                <Grid size={{ xs: 12 }}>
                                  <Divider />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <Alert
                                    severity="warning"
                                    icon={<Warning />}
                                    sx={{ py: 1 }}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight="600"
                                    >
                                      Overdue by {selected_copy.days_overdue}{' '}
                                      days
                                    </Typography>
                                    <Typography variant="body2">
                                      Late fee of $
                                      {selected_copy.fine_amount.toFixed(2)}{' '}
                                      will be added to patron's account
                                    </Typography>
                                  </Alert>
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </Paper>

                        <Alert severity="info" sx={{ mb: 1 }}>
                          After check-in, this item will be marked as "returned"
                          and must be reshelved using the "Mark Items as
                          Available" page before it can be checked out again.
                        </Alert>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Box>
            {active_step < steps.length && (
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
                          active_step === 0 ? 'item' : 'copy'
                        } to proceed`
                      : active_step === steps.length - 1
                      ? 'Finish Check-In'
                      : 'Next page'
                  }
                ></Tooltip>
              </Box>
            )}
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
      </PageContainer>
    </LocalizationProvider>
  );
};
