import { Warning } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import type { Patron } from '../../types/patron_types';

interface Patron_Reservation_Card_Props {
  patron?: Patron | null;
}

export const Patron_Reservation_Card = ({
  patron,
}: Patron_Reservation_Card_Props) => {
  const has_balance = patron ? patron.balance > 0 : false;
  const is_inactive = patron ? patron.is_active === false : false;
  const max_checked_out =
    patron && patron.active_checkouts ? patron.active_checkouts > 19 : false;
  const has_issues = has_balance || is_inactive || max_checked_out;

  const get_initials = () => {
    if (!patron) return 'AZ';
    return `${patron.first_name[0]}${patron.last_name[0]}`.toUpperCase();
  };

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 28,
        cornerShape: 'squircle',
        width: { xs: '100%', sm: 'auto' },
        p: 2,
        minWidth: { xs: 250, sm: 350 },
        boxShadow: 6,
      }}
    >
      <CardHeader
        title={
          patron ? (
            <Typography variant='h5' fontWeight='bold' component='div'>
              {patron.first_name} {patron.last_name}
            </Typography>
          ) : (
            <Typography variant='h4' fontWeight='bold' component='div'>
              <Skeleton animation={false} width={180} />
            </Typography>
          )
        }
        subheader={
          patron ? (
            <Typography variant='caption' fontWeight='bold'>
              ID: {patron.id}
            </Typography>
          ) : (
            <Typography variant='caption' fontWeight='bold'>
              <Skeleton animation={false} width={100} />
            </Typography>
          )
        }
      ></CardHeader>
      <CardContent sx={{ position: 'relative' }}>
        <Stack spacing={1.5}>
          {patron && (
            <Avatar
              src={patron.image_url}
              alt={`${patron.first_name} ${patron.last_name}`}
              sx={{
                bgcolor: 'primary.main',
                position: 'absolute',
                fontSize: 60,
                width: 120,
                height: 120,
                top: -40,
                right: 6,
              }}
            >
              {!patron.image_url && get_initials()}
            </Avatar>
          )}
          {!patron && (
            <Skeleton
              sx={{ position: 'absolute', top: -40, right: 6 }}
              variant='circular'
              width={120}
              height={120}
              animation={false}
            ></Skeleton>
          )}

          {patron && patron.phone && (
            <Box sx={{ mt: '0 !important' }}>
              <Typography variant='caption' color='text.secondary'>
                Phone
              </Typography>
              <Typography variant='body2'>{patron.phone}</Typography>
            </Box>
          )}
          {patron && patron.email && (
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Email
              </Typography>
              <Typography variant='body2'>{patron.email}</Typography>
            </Box>
          )}

          {!patron && (
            <>
              <Box sx={{ mt: '0 !important' }}>
                <Typography variant='caption' color='text.secondary'>
                  Phone
                </Typography>
                <Typography variant='body2'>
                  <Skeleton animation={false} width={120} />
                </Typography>
              </Box>
              <Box sx={{ mt: '0 !important' }}>
                <Typography variant='caption' color='text.secondary'>
                  Email
                </Typography>
                <Typography variant='body2'>
                  <Skeleton animation={false} width={150} />
                </Typography>
              </Box>
            </>
          )}

          <Stack direction={'row'} justifyContent={'space-between'}>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Card Expiration
              </Typography>
              {patron && (
                <Typography variant='body2'>
                  {new Date(patron.card_expiration_date).toLocaleDateString()}
                </Typography>
              )}
              {!patron && (
                <Typography variant='body2'>
                  {<Skeleton animation={false} width={120} />}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant='caption' color='text.secondary'>
                Active Checkouts
              </Typography>
              {patron && (
                <Typography
                  variant='body2'
                  color={
                    patron.active_checkouts > 15
                      ? patron.active_checkouts > 19
                        ? 'error.main'
                        : 'warning.main'
                      : 'text.primary'
                  }
                  fontWeight={500}
                >
                  {patron.active_checkouts || 0}
                </Typography>
              )}
              {!patron && (
                <Typography variant='body2'>
                  {<Skeleton animation={false} width={50} />}
                </Typography>
              )}
            </Box>
          </Stack>

          {patron && (
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Outstanding Balance
              </Typography>
              {patron && (
                <Typography
                  variant='body2'
                  color={
                    patron.balance > 0
                      ? patron.balance > 10
                        ? 'error.main'
                        : 'warning.main'
                      : 'success.main'
                  }
                  fontWeight={500}
                >
                  ${patron.balance.toFixed(2)}
                </Typography>
              )}
            </Box>
          )}

          <Stack
            direction={'row'}
            justifyContent={'center'}
            sx={{ gap: 1, mt: 1, flexWrap: 'wrap' }}
          >
            {patron && is_inactive && (
              <Chip
                icon={<Warning />}
                label='Inactive Account'
                color='error'
                size='small'
              />
            )}
            {patron && has_balance && (
              <Chip
                icon={<Warning />}
                label='Outstanding Fines'
                color='warning'
                size='small'
              />
            )}
            {patron && !has_issues && (
              <Chip label='Good Standing' color='success' size='small' />
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
