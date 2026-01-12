import { Close, Delete, Search, Warning } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useReservationsByItemCopy } from '../../hooks/use_reservations';
import type { Item_Copy_Result } from '../../types/item_types';
import { ItemCopyConditionChip } from '../copies/ItemCopyConditionChip';
import ItemTypeChip from '../library_items/ItemTypeChip';

interface ItemReservationCardProps {
  item?: Item_Copy_Result | null;
}

export const ItemReservationCard = ({ item }: ItemReservationCardProps) => {
  const [drawer_open, set_drawer_open] = useState(false);

  const is_checked_out = item ? item.status === 'Checked Out' : false;
  const has_reservation =
    item && item.reservation_count ? item.reservation_count > 0 : false;
  const is_overdue =
    item && item.due_date ? new Date(item.due_date) < new Date() : false;

  return (
    <>
      <Card
        sx={{
          height: '100%',
          borderRadius: 28,
          cornerShape: 'squircle',
          p: 2,
          minWidth: { xs: 250, sm: 350 },
          boxShadow: 6,
        }}
      >
        <CardHeader
          action={
            item &&
            has_reservation && (
              <IconButton
                title='View reservations'
                onClick={() => set_drawer_open(true)}
              >
                <Search />
              </IconButton>
            )
          }
          component='div'
          title={
            item ? (
              <Typography variant='h5' fontWeight='bold' component='div'>
                {item.title}
              </Typography>
            ) : (
              <Typography variant='h4' fontWeight='bold' component='div'>
                <Skeleton animation={false} width={180} />
              </Typography>
            )
          }
          subheader={
            item ? (
              <Typography variant='body2' color='text.secondary'>
                <ItemTypeChip
                  sx={{ mr: 1 }}
                  item_type={item.item_type}
                  size='small'
                />
                ID: {item.id}
              </Typography>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                <Skeleton animation={false} width={100} />
              </Typography>
            )
          }
        ></CardHeader>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: 2,
              rowGap: 1.5,
            }}
          >
            <Box>
              {item && (
                <Box
                  component='img'
                  src={
                    item?.cover_image ||
                    'https://unrulyguides.com/wp-content/uploads/2011/12/generic-cover.jpg'
                  }
                  alt={item.title}
                  sx={{
                    width: 120,
                    height: ['VINYL', 'CD'].includes(item.item_type)
                      ? 120
                      : 160,
                    objectFit: 'cover',
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                />
              )}
              {!item && (
                <Skeleton
                  sx={{
                    borderRadius: 2,
                  }}
                  variant='rectangular'
                  width={120}
                  height={160}
                  animation={false}
                />
              )}
            </Box>

            <Stack justifyContent={'space-between'}>
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Copy Label
                </Typography>
                {item ? (
                  <Typography variant='body2'>{item.copy_label}</Typography>
                ) : (
                  <Typography variant='body2'>
                    <Skeleton animation={false} width={150} />
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Current Location
                </Typography>
                {item ? (
                  <Typography variant='body2'>
                    {item.current_branch_name}
                  </Typography>
                ) : (
                  <Typography variant='body2'>
                    <Skeleton animation={false} width={120} />
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Reservations
                </Typography>
                {item ? (
                  <Typography variant='body2'>
                    {item.reservation_count}
                  </Typography>
                ) : (
                  <Skeleton animation={false} width={60} />
                )}
              </Box>
            </Stack>

            {item && is_checked_out && (
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Checked Out To
                </Typography>
                <Typography variant='body2'>
                  {item.patron_first_name} {item.patron_last_name}
                </Typography>
              </Box>
            )}

            {item && item.due_date && (
              <Box>
                <Typography variant='caption' color='text.secondary'>
                  Due Date
                </Typography>
                <Typography
                  variant='body2'
                  color={is_overdue ? 'warning.main' : 'text.primary'}
                  fontWeight={is_overdue ? 500 : 400}
                >
                  {new Date(item.due_date).toLocaleDateString()}
                  {is_overdue && ' (Overdue)'}
                </Typography>
              </Box>
            )}
          </Box>

          <Stack
            direction={'row'}
            justifyContent={'center'}
            sx={{ gap: 1, mt: 2, flexWrap: 'wrap' }}
          >
            {item && is_overdue && (
              <Chip icon={<Warning />} label='Overdue' color='warning' />
            )}
            {item && item.status === 'Available' && !has_reservation && (
              <Chip label='Available' color='success' />
            )}
            {item && item.condition && (
              <ItemCopyConditionChip condition={item.condition} />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Drawer
        anchor='right'
        open={drawer_open}
        onClose={() => set_drawer_open(false)}
      >
        <Box sx={{ width: 400, p: 2, mt: '64px' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant='h6'>Reservations</Typography>
            <IconButton onClick={() => set_drawer_open(false)}>
              <Close />
            </IconButton>
          </Box>
          {item && <Reservations_List item_copy_id={item.id} />}
        </Box>
      </Drawer>
    </>
  );
};

const Reservations_List = ({ item_copy_id }: { item_copy_id: number }) => {
  const { data: reservations, isLoading: loading } =
    useReservationsByItemCopy(item_copy_id);
  return (
    <List>
      {loading &&
        [1, 2, 3].map((n) => (
          <Skeleton animation='wave' key={n} width={'100%'} height={60} />
        ))}
      {!loading && reservations && reservations.length === 0 && (
        <Typography variant='body2'>No reservations found.</Typography>
      )}
      {!loading &&
        reservations &&
        reservations.map((reservation) => (
          <ListItem
            key={reservation.id}
            secondaryAction={
              <IconButton
                edge='end'
                title='Delete Reservation'
                aria-label='delete'
              >
                <Delete />
              </IconButton>
            }
          >
            <ListItemAvatar>
              <Avatar src={reservation.patron_image || undefined}>
                {reservation.first_name.charAt(0)}
                {reservation.last_name.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={reservation.first_name + ' ' + reservation.last_name}
              secondary={'#' + reservation.queue_position.toString()}
            ></ListItemText>
          </ListItem>
        ))}
    </List>
  );
};
