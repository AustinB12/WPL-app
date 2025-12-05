import { CheckCircle, Warning } from '@mui/icons-material';
import {
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { type FC } from 'react';

dayjs.extend(relativeTime);

interface RecentCheckIn {
  copy_id: number;
  title: string;
  timestamp: Date;
  had_fine: boolean;
  fine_amount?: number;
}

interface RecentCheckInsListProps {
  check_ins: RecentCheckIn[];
}

export const RecentCheckInsList: FC<RecentCheckInsListProps> = ({
  check_ins,
}) => {
  if (check_ins.length === 0) return null;

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Recent Check-Ins (This Session)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Last {check_ins.length} item{check_ins.length > 1 ? 's' : ''} checked in
      </Typography>

      <List sx={{ py: 0 }}>
        {check_ins.map((check_in, index) => (
          <ListItem
            key={`${check_in.copy_id}-${check_in.timestamp.getTime()}`}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              mb: index < check_ins.length - 1 ? 1 : 0,
              bgcolor: 'background.default',
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ minWidth: 40 }}
            >
              <CheckCircle color="success" fontSize="small" />
            </Stack>
            <ListItemText
              primary={
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Typography variant="body1" fontWeight="medium">
                    {check_in.title}
                  </Typography>
                  {check_in.had_fine && (
                    <Chip
                      label={`Fine: $${check_in.fine_amount?.toFixed(2)}`}
                      size="small"
                      color="warning"
                      icon={<Warning />}
                    />
                  )}
                </Stack>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  Copy #{check_in.copy_id} •{' '}
                  {dayjs(check_in.timestamp).fromNow()}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
