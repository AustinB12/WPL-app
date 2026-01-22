import { Delete, Edit, MoreVert } from '@mui/icons-material';
import {
  Card,
  CardHeader,
  Chip,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Genre_Chip } from '../components/common/GenreChip';
import { PageContainer } from '../components/common/PageBuilders';
import { useCopyById } from '../hooks/use_copies';
import { useLibraryItemById } from '../hooks/use_library_items';
import Item_Type_Chip from '../components/library_items/ItemTypeChip';
import { Library_Item_Type } from '../types/item_types';
import { useGetTransactionsByItemId } from '../hooks/use_transactions';
import Simple_Grid from '../components/common/SimpleGrid';
import { TransactionTypeChip } from '../components/transactions/TransactionTypeChip';
import { Item_Copy_Condition_Chip } from '../components/copies/ItemCopyConditionChip';

export const Library_Item_Copy_Page = () => {
  const { library_item_copy_id } = useParams();
  const { data: item_copy, isLoading: item_loading } = useCopyById(
    parseInt(library_item_copy_id!),
  );

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const { data: library_item } = useLibraryItemById(
    item_copy?.library_item_id || 0,
  );

  const { data: transactions, isLoading: transactions_loading } =
    useGetTransactionsByItemId(
      library_item_copy_id ? parseInt(library_item_copy_id) : 0,
    );

  const page_loading = !library_item_copy_id || item_loading;
  return (
    <PageContainer width='xl' sx={{ overflowY: 'auto' }}>
      <Stack spacing={2}>
        <Card sx={{ borderRadius: 3 }}>
          <CardHeader
            action={
              <>
                <IconButton onClick={handleClick}>
                  <MoreVert />
                </IconButton>
                <Menu
                  id='basic-menu'
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  slotProps={{
                    list: {
                      'aria-labelledby': 'basic-button',
                    },
                  }}
                >
                  <MenuList>
                    <MenuItem onClick={handleClose}>
                      <ListItemIcon>
                        <Edit />
                      </ListItemIcon>
                      <ListItemText>Edit</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <ListItemIcon>
                        <Delete />
                      </ListItemIcon>
                      <ListItemText>Delete</ListItemText>
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            }
            title={
              <Typography
                fontWeight={'bold'}
                variant='h6'
                sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}
              >
                {page_loading ? 'Library Item' : `${library_item?.title}`}
                <Item_Type_Chip
                  sx={{ ml: 2 }}
                  item_type={library_item?.item_type || Library_Item_Type.Book}
                />
              </Typography>
            }
            subheader={
              <Chip variant='outlined' label={item_copy?.copy_label} />
            }
          />

          <Typography sx={{ px: 2 }} variant='subtitle1' color='text.secondary'>
            {item_copy?.description}
          </Typography>
          <Stack sx={{ px: 2, py: 1 }} direction={'row'} gap={1}>
            {library_item &&
              library_item.genres.length >= 0 &&
              library_item?.genres.map((b) => <Genre_Chip genre={b} />)}
          </Stack>
        </Card>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Suspense
              fallback={
                <Skeleton variant='rectangular' width={210} height={295} />
              }
            >
              <img
                style={{ width: '97%', borderRadius: '8px' }}
                src={library_item?.cover_image_url || ''}
                alt={`Cover image of ${library_item?.title || ''}`}
              />
            </Suspense>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography fontWeight={'bold'} gutterBottom variant='h6'>
              {'Transaction History'}
            </Typography>
            <Simple_Grid
              loading={transactions_loading}
              rows={transactions}
              cols={[
                { field: 'title', headerName: 'Title', minWidth: 200, flex: 1 },
                {
                  field: 'transaction_type',
                  headerName: 'Type',
                  minWidth: 200,
                  flex: 1,
                  renderCell: (params) => (
                    <TransactionTypeChip
                      transaction_type={params.value}
                      size='small'
                    />
                  ),
                },
                { field: 'date', headerName: 'Date', minWidth: 150, flex: 1 },
                {
                  field: 'condition',
                  headerName: 'Condition',
                  minWidth: 150,
                  flex: 1,
                  renderCell: (params) => (
                    <Item_Copy_Condition_Chip
                      condition={params.value}
                      size='small'
                    />
                  ),
                },
              ]}
            />
          </Grid>
        </Grid>
      </Stack>
    </PageContainer>
  );
};
