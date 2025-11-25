import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  Stack,
  Chip,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import { useState, type FC } from 'react';
import {
  ArrowBack,
  Refresh,
  CalendarToday,
  Autorenew,
} from '@mui/icons-material';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface PatronInfo {
  id: number;
  first_name: string;
  last_name: string;
  card_expiration_date: string;
  balance: number;
  active_checkout_count?: number;
}

interface CheckedOutItem {
  transaction_id: number;
  copy_id: number;
  library_item_id: number;
  title: string;
  item_type: string;
  author?: string;
  director?: string;
  due_date: string;
  renewal_status: string;
  has_reservations: boolean;
}

type Screen = 'search' | 'patron_items' | 'item_details' | 'confirmation';

export const RenewItem: FC = () => {
  const [current_screen, set_current_screen] = useState<Screen>('search');
  const [patron_query, set_patron_query] = useState('');
  const [patron_info, set_patron_info] = useState<PatronInfo | null>(null);
  const [checked_out_items, set_checked_out_items] = useState<CheckedOutItem[]>(
    []
  );
  const [selected_item, set_selected_item] = useState<CheckedOutItem | null>(
    null
  );
  const [loading, set_loading] = useState(false);
  const [renewing, set_renewing] = useState(false);
  const [error_message, set_error_message] = useState<string | null>(null);
  const [success_message, set_success_message] = useState<string | null>(null);
  const [renewal_result, set_renewal_result] = useState<{
    new_due_date: string;
    renewal_status: string;
    item_title: string;
  } | null>(null);

  const search_patron = async () => {
    if (!patron_query.trim()) {
      set_error_message('Please enter a Patron ID or Name');
      return;
    }

    set_loading(true);
    set_error_message(null);
    set_success_message(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/patrons/search-for-renewal?query=${encodeURIComponent(
          patron_query
        )}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find patron');
      }

      set_patron_info(data.data.patron);
      set_checked_out_items(data.data.checked_out_items);
      set_current_screen('patron_items');
    } catch (error) {
      set_error_message(
        error instanceof Error ? error.message : 'Failed to find patron'
      );
    } finally {
      set_loading(false);
    }
  };

  const select_item = (item: CheckedOutItem) => {
    set_selected_item(item);
    set_current_screen('item_details');
    set_error_message(null);
    set_success_message(null);
  };

  const back_to_list = () => {
    set_current_screen('patron_items');
    set_selected_item(null);
    set_error_message(null);
    set_success_message(null);
  };

  const new_search = () => {
    set_current_screen('search');
    set_patron_query('');
    set_patron_info(null);
    set_checked_out_items([]);
    set_selected_item(null);
    set_error_message(null);
    set_success_message(null);
    set_renewal_result(null);
  };

  const renew_item = async () => {
    if (!selected_item) return;

    set_renewing(true);
    set_error_message(null);
    set_success_message(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions/${selected_item.transaction_id}/renew`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to renew item');
      }

      // Update the renewal status and due date
      const new_due_date = data.data.new_due_date;
      const new_renewal_status = data.data.renewal_status;

      // Update the checked out items list
      const updated_items = checked_out_items.map((item) =>
        item.transaction_id === selected_item.transaction_id
          ? {
              ...item,
              due_date: new_due_date,
              renewal_status: new_renewal_status,
            }
          : item
      );
      set_checked_out_items(updated_items);

      // Update selected item
      set_selected_item({
        ...selected_item,
        due_date: new_due_date,
        renewal_status: new_renewal_status,
      });

      // Store renewal result for confirmation screen
      set_renewal_result({
        new_due_date,
        renewal_status: new_renewal_status,
        item_title: selected_item.title,
      });

      // Show confirmation screen
      set_current_screen('confirmation');
    } catch (error) {
      set_error_message(
        error instanceof Error ? error.message : 'Failed to renew item'
      );
    } finally {
      set_renewing(false);
    }
  };

  const get_renewal_status_color = (
    status: string
  ): 'default' | 'primary' | 'warning' | 'error' | 'info' | 'success' => {
    if (status === 'Checked Out') return 'primary';
    if (status === 'Renewed Once') return 'warning';
    if (status === 'Renewed Twice') return 'error';
    return 'default';
  };

  const get_times_renewed = (status: string): number => {
    if (status === 'Checked Out') return 0;
    if (status === 'Renewed Once') return 1;
    if (status === 'Renewed Twice') return 2;
    return 0;
  };

  const can_renew = (item: CheckedOutItem): boolean => {
    if (!patron_info) return false;

    // Check renewal status - can only renew max 2 times
    if (item.renewal_status === 'Renewed Twice') {
      return false;
    }

    // Check if item is reserved
    if (item.has_reservations) {
      return false;
    }

    // Check if patron's card is expired
    const current_date = new Date().toLocaleString().split('T')[0];
    if (patron_info.card_expiration_date < current_date) {
      return false;
    }

    // Check if patron has ANY fines
    if (patron_info.balance > 0) {
      return false;
    }

    // Check if patron has more than 20 books checked out
    if (
      patron_info.active_checkout_count !== undefined &&
      patron_info.active_checkout_count >= 20
    ) {
      return false;
    }

    return true;
  };

  const get_cannot_renew_reason = (item: CheckedOutItem): string | null => {
    if (!patron_info) return null;

    // Check renewal status - can only renew max 2 times
    if (item.renewal_status === 'Renewed Twice') {
      return 'Item has already been renewed twice (maximum renewals reached)';
    }

    // Check if item is reserved
    if (item.has_reservations) {
      return 'Item is reserved by another patron';
    }

    // Check if patron's card is expired
    const current_date = new Date().toLocaleString().split('T')[0];
    if (patron_info.card_expiration_date < current_date) {
      return "Patron's library card is expired";
    }

    // Check if patron has ANY fines
    if (patron_info.balance > 0) {
      return `Patron has outstanding fines of $${patron_info.balance.toFixed(
        2
      )}`;
    }

    // Check if patron has more than 20 books checked out
    if (
      patron_info.active_checkout_count !== undefined &&
      patron_info.active_checkout_count >= 20
    ) {
      return `Patron has ${patron_info.active_checkout_count} books checked out (maximum is 20)`;
    }

    return null;
  };

  // Screen 1: Search Screen
  if (current_screen === 'search') {
    return (
      <PageContainer>
        <PageTitle title={'Renew Item'} Icon_Component={Autorenew} />
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Enter Patron ID or Name
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              placeholder="e.g., P12345 or John Smith"
              value={patron_query}
              onChange={(e) => set_patron_query(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  search_patron();
                }
              }}
              disabled={loading}
            />
            <Button
              variant="contained"
              onClick={search_patron}
              disabled={loading || !patron_query.trim()}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : '🔍 Search'}
            </Button>
          </Stack>

          {error_message && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              onClose={() => set_error_message(null)}
            >
              {error_message}
            </Alert>
          )}

          <Alert severity="info" sx={{ mt: 3 }}>
            Demo credentials: Use "1" or "John Doe" to test the system
          </Alert>
        </Paper>
      </PageContainer>
    );
  }

  // Screen 2 & 5: Patron Items List
  if (current_screen === 'patron_items') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            📚 Library Renewal System
          </Typography>
          <Button variant="outlined" color="inherit" onClick={new_search}>
            New Search
          </Button>
        </Box>

        {success_message && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => set_success_message(null)}
            icon={<span>✓</span>}
          >
            {success_message}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Patron Information
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="body2" color="text.secondary">
                Patron ID
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {patron_info?.id}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="body2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {patron_info?.first_name} {patron_info?.last_name}
              </Typography>
            </Box>
            {patron_info?.active_checkout_count !== undefined && (
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <Typography variant="body2" color="text.secondary">
                  Active Checkouts
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {patron_info.active_checkout_count} / 20
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        <Typography variant="h6" gutterBottom>
          Checked-Out Items
        </Typography>

        {checked_out_items.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            This patron has no checked-out items.
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
            {checked_out_items.map((item) => (
              <Card key={item.transaction_id} elevation={2}>
                <CardActionArea onClick={() => select_item(item)}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="div">
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.author || item.director}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', ml: 2 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          <CalendarToday
                            sx={{
                              fontSize: 14,
                              mr: 0.5,
                              verticalAlign: 'middle',
                            }}
                          />
                          Due: {item.due_date}
                        </Typography>
                        <Chip
                          label={item.renewal_status}
                          color={get_renewal_status_color(item.renewal_status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    );
  }

  // Screen 3 & 4 & 6 & 8: Item Details
  if (current_screen === 'item_details' && selected_item) {
    const cannot_renew_reason = get_cannot_renew_reason(selected_item);
    const is_renewable = can_renew(selected_item);

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            📚 Library Renewal System
          </Typography>
          <Button variant="outlined" color="inherit" onClick={new_search}>
            New Search
          </Button>
        </Box>

        {error_message && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => set_error_message(null)}
            icon={<span>⚠</span>}
          >
            Renewal not allowed: {error_message}
          </Alert>
        )}

        {success_message && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => set_success_message(null)}
            icon={<span>✓</span>}
          >
            {success_message}
          </Alert>
        )}

        <Button startIcon={<ArrowBack />} onClick={back_to_list} sx={{ mb: 2 }}>
          Back to List
        </Button>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Item Details
          </Typography>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Title
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {selected_item.title}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                {selected_item.author ? 'Author' : 'Director'}
              </Typography>
              <Typography variant="body1">
                {selected_item.author || selected_item.director}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Due Date
                </Typography>
                <Typography variant="body1">
                  {selected_item.due_date}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">
                  {selected_item.renewal_status}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Times Renewed
                </Typography>
                <Typography variant="body1">
                  {get_times_renewed(selected_item.renewal_status)} / 2
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Reserved Status
                </Typography>
                <Typography variant="body1">
                  {selected_item.has_reservations ? 'Yes' : 'No'}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Paper>

        {!is_renewable && cannot_renew_reason && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Renewal not allowed: {cannot_renew_reason}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<Refresh />}
          onClick={renew_item}
          disabled={!is_renewable || renewing}
        >
          {renewing ? <CircularProgress size={24} /> : '🔄 Renew Item'}
        </Button>
      </Container>
    );
  }

  // Screen 4: Renewal Confirmation
  if (current_screen === 'confirmation' && renewal_result && selected_item) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            📚 Renewal Confirmation
          </Typography>
          <Button variant="outlined" color="inherit" onClick={new_search}>
            New Search
          </Button>
        </Box>

        <Alert severity="success" sx={{ mb: 3 }} icon={<span>✓</span>}>
          <AlertTitle>Renewal Successful!</AlertTitle>
          The item has been renewed successfully.
        </Alert>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Renewal Details
          </Typography>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Item Title
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {renewal_result.item_title}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Previous Due Date
                </Typography>
                <Typography variant="body1">
                  {selected_item.due_date}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  New Due Date
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={500}
                  color="success.main"
                >
                  {renewal_result.new_due_date}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Previous Status
                </Typography>
                <Typography variant="body1">
                  {selected_item.renewal_status}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  New Status
                </Typography>
                <Chip
                  label={renewal_result.renewal_status}
                  color={get_renewal_status_color(
                    renewal_result.renewal_status
                  )}
                  size="small"
                />
              </Box>
            </Stack>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Times Renewed
              </Typography>
              <Typography variant="body1">
                {get_times_renewed(renewal_result.renewal_status)} / 2
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Patron Information
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="body2" color="text.secondary">
                Patron ID
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {patron_info?.id}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography variant="body2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {patron_info?.first_name} {patron_info?.last_name}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={back_to_list} sx={{ flex: 1 }}>
            Back to Items List
          </Button>
          <Button variant="contained" onClick={new_search} sx={{ flex: 1 }}>
            New Renewal
          </Button>
        </Stack>
      </Container>
    );
  }

  return null;
};
