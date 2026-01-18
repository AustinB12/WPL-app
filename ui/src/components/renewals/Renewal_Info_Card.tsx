import {
  Autorenew,
  CalendarMonth,
  Error as ErrorIcon,
  Info,
  Warning,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { ItemCopyConditionChip } from '../copies/ItemCopyConditionChip';
import { ItemCopyStatusChip } from '../copies/ItemCopyStatusChip';
import ItemTypeChip from '../library_items/ItemTypeChip';
import type { Item_Copy_Result } from '../../types/item_types';

interface Renewal_Info_Card_Props {
  selected_item: Item_Copy_Result;
  is_renewing: boolean;
  on_cancel: () => void;
  on_renew: () => void;
}

export function Renewal_Info_Card({
  selected_item,
  is_renewing,
  on_cancel,
  on_renew,
}: Renewal_Info_Card_Props) {
  const eligibility = get_renewal_eligibility(selected_item);

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
      <CardContent>
        <Stack spacing={3}>
          {/* Item Information Section */}
          <Box>
            <Typography variant='overline' color='text.secondary' gutterBottom>
              Item Information
            </Typography>
            <Typography variant='h5' fontWeight='bold' gutterBottom>
              {selected_item.title}
            </Typography>
            <Stack
              direction='row'
              spacing={1}
              alignItems='center'
              flexWrap='wrap'
            >
              <Typography variant='body2' color='text.secondary'>
                Copy ID <strong>#{selected_item.id}</strong>
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {'|'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {selected_item.copy_label ||
                  `Copy ${selected_item.copy_number}/${selected_item.total_copies}`}
              </Typography>
              <ItemTypeChip item_type={selected_item.item_type} />
              <ItemCopyConditionChip condition={selected_item.condition} />
            </Stack>
          </Box>

          <Divider />

          {/* Patron Information Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Stack direction='row' alignItems='center' gap={1} mb={1}>
                <Box
                  sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: -4,
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg, #5d9cf6 0%, #4c1485 100%)',
                    },
                  }}
                >
                  <Avatar
                    src={selected_item.patron_avatar_url}
                    sx={{
                      width: { xs: 40, sm: 64 },
                      height: { xs: 40, sm: 64 },
                    }}
                  />
                </Box>
                <Typography variant='h5' fontWeight='bold'>
                  {selected_item.patron_first_name}{' '}
                  {selected_item.patron_last_name}
                </Typography>
              </Stack>
              <Stack direction='row' spacing={4}>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Patron ID: #{selected_item.patron_id}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            {/* Due Date & Status Section */}
            <Box>
              <Stack direction='row' alignItems='center' gap={1} mb={1}>
                <CalendarMonth color='action' />
                <Typography variant='overline' color='text.secondary'>
                  Loan Status
                </Typography>
              </Stack>
              <Stack direction='row' spacing={4} alignItems='flex-start'>
                <Box>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Current Due Date
                  </Typography>
                  <Typography
                    variant='body1'
                    fontWeight={500}
                    color={
                      eligibility.is_overdue ? 'error.main' : 'text.primary'
                    }
                  >
                    {selected_item.due_date
                      ? dayjs(selected_item.due_date).format(
                          'MMMM D, YYYY h:mm A',
                        )
                      : 'Not set'}
                  </Typography>
                  {eligibility.is_overdue && (
                    <Chip
                      label='Overdue'
                      color='error'
                      size='small'
                      icon={<Warning />}
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
                <Box>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Current Status
                  </Typography>
                  <ItemCopyStatusChip
                    status={selected_item.status}
                    size='small'
                  />
                </Box>
                <Box>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Renewals Remaining
                  </Typography>
                  <Typography variant='body1' fontWeight={500}>
                    {selected_item.status === 'Renewed Twice'
                      ? '0'
                      : selected_item.status === 'Renewed Once'
                        ? '1'
                        : '2'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* Eligibility Alert */}
          {!eligibility.can_renew && (
            <Alert
              severity='warning'
              icon={<ErrorIcon />}
              sx={{ borderRadius: 2 }}
            >
              <AlertTitle>Cannot Renew</AlertTitle>
              {eligibility.reason}
            </Alert>
          )}

          {eligibility.can_renew && eligibility.is_overdue && (
            <Alert
              severity='warning'
              icon={<Warning />}
              sx={{ borderRadius: 2 }}
            >
              <AlertTitle>Overdue Item</AlertTitle>
              This item is overdue. Renewing will set a new due date from today,
              but any accrued fines may still apply.
            </Alert>
          )}

          {eligibility.can_renew && !eligibility.is_overdue && (
            <Alert severity='info' icon={<Info />} sx={{ borderRadius: 2 }}>
              <AlertTitle>Ready to Renew</AlertTitle>
              This item is eligible for renewal. The new due date will be
              calculated based on the item type.
            </Alert>
          )}

          {/* Action Buttons */}
          <Stack direction='row' spacing={2} justifyContent='flex-end'>
            <Button
              variant='outlined'
              onClick={on_cancel}
              disabled={is_renewing}
              size='large'
            >
              Cancel
            </Button>
            <Button
              variant='contained'
              color='primary'
              onClick={on_renew}
              disabled={!eligibility.can_renew}
              loading={is_renewing}
              loadingIndicator='Renewing...'
              startIcon={<Autorenew />}
              size='large'
            >
              {'Renew Item'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Check if item can be renewed
const get_renewal_eligibility = (item: Item_Copy_Result) => {
  const status_upper = (item.status || '').toUpperCase();

  // Check if already renewed twice
  if (status_upper === 'RENEWED TWICE') {
    return {
      can_renew: false,
      reason: 'This item has already been renewed twice (maximum limit)',
      is_overdue: false,
    };
  }

  // Check if item has reservations
  if (item.reservation_count && item.reservation_count > 0) {
    return {
      can_renew: false,
      reason: 'This item has active reservations and cannot be renewed',
      is_overdue: false,
    };
  }

  // Check if overdue (we can still renew but show warning)
  const is_overdue = item.due_date && new Date(item.due_date) < new Date();

  return {
    can_renew: true,
    reason: '',
    is_overdue,
    current_status: status_upper,
  };
};
