import {
  CheckCircle,
  ExpandLess,
  ExpandMore,
  Info,
  // Warning,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
// import dayjs from 'dayjs';
import { type FC, useState } from 'react';
import type {
  Item_Condition,
  Item_Copy_Result,
} from '../../types';
import { get_condition_color } from '../../utils/colors';
import ItemTypeChip from '../library_items/ItemTypeChip';

interface QuickCheckInCardProps {
  item_info: Item_Copy_Result;
  on_confirm: (new_condition?: Item_Condition, notes?: string) => void;
  on_cancel: () => void;
  is_processing: boolean;
}

const conditions: Item_Condition[] = [
  'New',
  'Excellent',
  'Good',
  'Fair',
  'Poor',
];

export const QuickCheckInCard: FC<QuickCheckInCardProps> = ({
  item_info,
  on_confirm,
  on_cancel,
  is_processing,
}) => {
  const [expanded, set_expanded] = useState(false);
  const [new_condition, set_new_condition] = useState<
    Item_Condition | undefined
  >(item_info.condition);
  const [notes, set_notes] = useState('');

  const has_reservation = !!item_info.reservation;

  const handle_confirm = () => {
    on_confirm(new_condition, notes || undefined);
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 3,
        border: '2px solid',
        borderColor: 'success.main',
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Success Header */}
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ borderRadius: 2 }}
          >
            <AlertTitle>Ready to Check In</AlertTitle>
            Item found and ready to be checked in.
          </Alert>

          {/* Item Information */}
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {item_info.title}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography variant="body2" color="text.secondary">
                Copy #{item_info.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item_info.copy_label}
              </Typography>
              <ItemTypeChip
                item_type={item_info.item_type}
                size="small"
              />
            </Stack>
          </Box>

          <Divider />

          {/* Patron Information */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Checked Out By
            </Typography>
            <Typography variant="body1">
              {`${item_info.patron_first_name} ${item_info.patron_last_name} ID: ${item_info.patron_id}`}
            </Typography>
          </Box>

          {/* Due Date & Overdue Status */}
          {/* <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Due Date
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="body1"
                color={
                  item_info.is_overdue ? 'error.main' : 'text.primary'
                }
                fontWeight={item_info.is_overdue ? 600 : 400}
              >
                {dayjs(item_info.due_date).format('MMM D, YYYY')}
              </Typography>
              {checkout_details.is_overdue && (
                <Chip
                  label={`${checkout_details.days_overdue} day${checkout_details.days_overdue > 1 ? 's' : ''} overdue`}
                  color="error"
                  size="small"
                  icon={<Warning />}
                />
              )}
            </Stack>
          </Box> */}

          {/* Fine Alert */}
          {/* {checkout_details.fine_amount > 0 && (
            <Alert
              severity="warning"
              icon={<Warning />}
              sx={{ borderRadius: 2 }}
            >
              <AlertTitle>Overdue Fine</AlertTitle>A fine of{' '}
              <strong>${checkout_details.fine_amount.toFixed(2)}</strong> will
              be applied to the patron's account.
            </Alert>
          )} */}

          {/* Reservation Alert */}
          {has_reservation && (
            <Alert severity="info" icon={<Info />} sx={{ borderRadius: 2 }}>
              <AlertTitle>Reservation Pending</AlertTitle>
              This item has a reservation. It will be marked as "Ready for
              Pickup" for{' '}
              {item_info.reservation?.patron_name || 'the next patron in queue'}
              .
            </Alert>
          )}

          <Divider />

          {/* Current Condition */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Current Condition
            </Typography>
            <Chip
              label={item_info.condition}
              sx={{
                bgcolor: get_condition_color(item_info.condition || 'Good'),
                color: 'white',
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Expandable Condition & Notes Section */}
          <Box>
            <Button
              onClick={() => set_expanded(!expanded)}
              endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              sx={{ justifyContent: 'space-between', width: '100%' }}
            >
              Update Condition & Notes (Optional)
            </Button>
            <Collapse in={expanded}>
              <Stack
                spacing={2}
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 2,
                }}
              >
                <FormControl fullWidth>
                  <InputLabel>New Condition</InputLabel>
                  <Select
                    value={new_condition || ''}
                    onChange={(e) =>
                      set_new_condition(e.target.value as Item_Condition)
                    }
                    label="New Condition"
                  >
                    {conditions.map((condition) => (
                      <MenuItem key={condition} value={condition}>
                        <Chip
                          label={condition}
                          size="small"
                          sx={{
                            bgcolor: get_condition_color(condition),
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Notes (Optional)"
                  value={notes}
                  onChange={(e) => set_notes(e.target.value)}
                  multiline
                  rows={3}
                  placeholder="Add any notes about the item's condition or check-in..."
                  fullWidth
                />
              </Stack>
            </Collapse>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button
              variant="outlined"
              onClick={on_cancel}
              disabled={is_processing}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handle_confirm}
              disabled={is_processing}
              size="large"
              fullWidth
              sx={{ fontWeight: 600 }}
            >
              {is_processing ? 'Processing...' : 'Confirm Check-In'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
