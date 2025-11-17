import { type FC, type ReactNode } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Alert,
  AlertTitle,
  Skeleton,
  Grid,
  Container,
  Stack,
  LinearProgress,
} from '@mui/material';
import { Person, LibraryBooks } from '@mui/icons-material';
import {
  calculate_due_date,
  format_date,
  is_overdue,
} from '../../utils/dateUtils';
import { usePatronById } from '../../hooks/usePatrons';
import { useCopyById } from '../../hooks/useCopies';
import type { Item_Copy } from '../../types';
import { useLibraryItemById } from '../../hooks/useLibraryItems';
import { ItemCopyConditionChip } from '../copies/ItemCopyConditionChip';

interface ConfirmCheckoutDetailsProps {
  patron_id: number;
  copy: Item_Copy;
  was_successful: boolean | null;
  loading: boolean;
}

// Helper component for info rows
interface InfoRowProps {
  label: string;
  value: string | ReactNode;
  highlight?: boolean;
}

const InfoRow: FC<InfoRowProps> = ({ label, value, highlight }) => (
  <Box
    sx={(theme) => ({
      flex: 1,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      p: 1.5,
      bgcolor: highlight ? 'background.default' : 'background.default',
      borderRadius: 1.5,
      ...(highlight && {
        border: '1.5px solid',
        borderColor: theme.palette.secondary.main,
      }),
    })}
  >
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ fontWeight: highlight ? 600 : 400 }}
    >
      {label}
    </Typography>
    {typeof value === 'string' ? (
      <Typography variant="body2" sx={{ fontWeight: highlight ? 700 : 600 }}>
        {value}
      </Typography>
    ) : (
      value
    )}
  </Box>
);

// Helper component for card headers
interface CardHeaderSectionProps {
  icon: ReactNode;
  overline: string;
  title: string;
  avatar_src?: string;
  bgcolor: string;
}

const CardHeaderSection: FC<CardHeaderSectionProps> = ({
  icon,
  overline,
  title,
  avatar_src,
  bgcolor,
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
    <Avatar
      sx={{
        bgcolor: bgcolor,
        width: 56,
        height: 56,
        mr: 2,
      }}
      src={avatar_src}
    >
      {icon}
    </Avatar>
    <Box>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
      >
        {overline}
      </Typography>
      <Typography
        variant="h6"
        component="h3"
        sx={{ fontWeight: 600, lineHeight: 1.2 }}
      >
        {title}
      </Typography>
    </Box>
  </Box>
);

export const ConfirmCheckoutDetails: FC<ConfirmCheckoutDetailsProps> = ({
  patron_id,
  copy,
  loading,
}) => {
  const { data: patron, isLoading: loading_patron } = usePatronById(patron_id);
  const { data: item_copy, isLoading: loading_copy } = useCopyById(copy.id);
  const { data: library_item, isLoading: loading_library_item } =
    useLibraryItemById(copy.library_item_id);

  const hasOutstandingBalance = patron ? patron.balance > 0 : false;
  const isCardExpired = patron
    ? patron.card_expiration_date &&
      is_overdue(new Date(patron.card_expiration_date))
    : false;

  const is_any_loading = loading_patron || loading_copy || loading_library_item;

  // If still loading essential data, show loading skeleton
  if (is_any_loading) {
    return (
      <Container sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Confirm Checkout Details
        </Typography>

        <Grid container spacing={3}>
          {/* Patron Loading Skeleton */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton
                    variant="circular"
                    width={40}
                    height={40}
                    sx={{ mr: 2 }}
                  />
                  <Skeleton variant="text" width={200} height={32} />
                </Box>
                <Box sx={{ ml: 7 }}>
                  <Skeleton
                    variant="text"
                    width={150}
                    height={24}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    width={100}
                    height={20}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={80}
                    height={24}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="rectangular" width={120} height={24} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Item Loading Skeleton */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton
                    variant="circular"
                    width={40}
                    height={40}
                    sx={{ mr: 2 }}
                  />
                  <Skeleton variant="text" width={180} height={32} />
                </Box>
                <Box sx={{ ml: 7 }}>
                  <Skeleton
                    variant="text"
                    width={250}
                    height={24}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="rectangular" width={50} height={24} />
                  </Box>
                  <Skeleton
                    variant="text"
                    width={120}
                    height={20}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="text" width={100} height={20} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // If data couldn't be loaded
  if (!patron || !item_copy || !library_item) {
    return (
      <Container sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
          Confirm Checkout Details
        </Typography>
        <Alert severity="error" onClick={() => console.log(patron, item_copy)}>
          <AlertTitle>Error Loading Data</AlertTitle>
          Unable to load the required information for this checkout. Please try
          again.
        </Alert>
      </Container>
    );
  }
  return (
    <Container maxWidth="xl" sx={{ p: 2 }}>
      {/* Warnings */}
      {(hasOutstandingBalance || isCardExpired) && (
        <Box sx={{ mb: 3 }}>
          {hasOutstandingBalance && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              <AlertTitle>Outstanding Balance</AlertTitle>
              This patron has an outstanding balance of $
              {patron.balance.toFixed(2)}.
            </Alert>
          )}
          {isCardExpired && (
            <Alert severity="error" sx={{ mb: 1 }}>
              <AlertTitle>Expired Library Card</AlertTitle>
              This patron's library card expired on{' '}
              {format_date(patron.card_expiration_date)}.
            </Alert>
          )}
        </Box>
      )}

      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ mb: 3, fontWeight: 600 }}
      >
        Confirm Checkout Details
      </Typography>

      <Grid container spacing={3}>
        {/* Patron Information */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <CardHeaderSection
                icon={<Person sx={{ fontSize: 32 }} />}
                overline="Patron"
                title={`${patron.first_name} ${patron.last_name}`}
                avatar_src={patron.image_url}
                bgcolor="primary.main"
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Stack direction={'row'} spacing={2} sx={{ width: 1 }}>
                  <InfoRow label="Patron ID" value={`#${patron.id}`} />
                  <InfoRow
                    label="Balance"
                    value={
                      <Chip
                        label={`$${patron.balance.toFixed(2)}`}
                        size="small"
                        color={patron.balance > 0 ? 'warning' : 'success'}
                        sx={{ fontWeight: 600 }}
                      />
                    }
                  />
                </Stack>
                <InfoRow label="Email" value={patron.email} />
                <Stack direction={'row'} spacing={2} sx={{ width: 1 }}>
                  <InfoRow label="Phone" value={patron.phone} />
                  {patron.card_expiration_date && (
                    <InfoRow
                      label="Card Expires"
                      value={
                        <Chip
                          label={format_date(patron.card_expiration_date)}
                          size="small"
                          color={isCardExpired ? 'error' : 'default'}
                          sx={{ fontWeight: 600 }}
                        />
                      }
                    />
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Item Information */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <CardHeaderSection
                icon={<LibraryBooks sx={{ fontSize: 32 }} />}
                overline="Library Item"
                title={library_item.title}
                bgcolor="secondary.main"
              />

              {library_item.description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mb: 2,
                    fontStyle: 'italic',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {library_item.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Stack direction={'row'} spacing={2} sx={{ width: 1 }}>
                  <InfoRow label="Copy ID" value={`#${item_copy.id}`} />
                  <InfoRow
                    label="Condition"
                    value={
                      <ItemCopyConditionChip
                        condition={item_copy?.condition || 'Good'}
                      />
                    }
                  />
                </Stack>
                <Stack direction={'row'} spacing={2} sx={{ width: 1 }}>
                  <InfoRow
                    label="Published"
                    value={library_item.publication_year || 'N/A'}
                  />
                  {copy?.branch_name && (
                    <InfoRow label="Location" value={copy.branch_name} />
                  )}
                </Stack>
                <InfoRow
                  label="Due Date"
                  value={format_date(
                    calculate_due_date(
                      library_item.item_type,
                      library_item?.publication_year || 0
                    )
                  )}
                  highlight
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {loading && (
          <Grid size={12}>
            <LinearProgress sx={{ width: 1, height: '0.5rem' }} />
          </Grid>
        )}
      </Grid>
    </Container>
  );
};
