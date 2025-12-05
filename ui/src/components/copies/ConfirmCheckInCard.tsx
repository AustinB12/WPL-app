import { Warning } from '@mui/icons-material';
import { Alert, Divider, Grid, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import type {
  Branch,
  Check_Out_Details,
  CheckInFormData,
  Item_Copy_Result,
} from '../../types';

export const ConfirmCheckInCard = ({
  item_info,
  form_data,
  checkout_details,
  branches,
}: {
  item_info: Item_Copy_Result;
  checkout_details: Check_Out_Details;
  form_data: CheckInFormData;
  branches: Branch[];
}) => {
  const [info_note_open, set_info_note_open] = useState(true);
  return (
    <Grid container spacing={2} sx={{ mb: 2, pt: 1 }}>
      <Grid size={{ xs: 12 }}>
        <Paper elevation={3} sx={{ p: 2, position: 'relative' }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Confirm Check-In
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review the details below and confirm to complete the check-in
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
                <Typography variant="body1" fontWeight="600" gutterBottom>
                  {item_info.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item_info.copy_label} | Type: {item_info.item_type}
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
                  {`${checkout_details.first_name} ${checkout_details.last_name}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patron ID: {checkout_details.id}
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
                  Due Date:
                  {checkout_details.due_date
                    ? new Date(checkout_details.due_date).toLocaleDateString()
                    : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Condition: {form_data?.new_condition || 'Good'}
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
                  <Typography variant="body2" color="text.primary">
                    New Location:{' '}
                    {
                      branches?.find((b) => b.id === form_data.new_location_id)
                        ?.branch_name
                    }
                  </Typography>
                )}
              </Grid>

              {checkout_details.is_overdue && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="warning" icon={<Warning />} sx={{ py: 1 }}>
                      <Typography variant="body2" fontWeight="600">
                        Overdue by {checkout_details.days_overdue} days
                      </Typography>
                      <Typography variant="body2">
                        {`Late fee of $${checkout_details.fine_amount.toFixed(
                          2
                        )} will be added to patron's account`}
                      </Typography>
                    </Alert>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
          {info_note_open && (
            <Alert
              severity="info"
              onClose={() => set_info_note_open(false)}
              sx={{
                position: 'absolute',
                maxWidth: 600,
                top: 16,
                right: 16,
              }}
            >
              This item will be marked as "Unshelved" To reshelved, use the
              "Reshelve" page. Once reshelved the item can be checked out again.
            </Alert>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};
