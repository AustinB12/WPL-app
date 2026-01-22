import { Delete, Edit, MoreVert } from '@mui/icons-material';
import {
  Card,
  CardHeader,
  CircularProgress,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { type GridColDef } from '@mui/x-data-grid';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Genre_Chip } from '../components/common/GenreChip';
import { PageContainer } from '../components/common/PageBuilders';
import Simple_Grid from '../components/common/SimpleGrid';
import { Item_Copy_Condition_Chip } from '../components/copies/ItemCopyConditionChip';
import { ItemCopyStatusChip } from '../components/copies/ItemCopyStatusChip';
import { Edit_Library_Item_Dialog } from '../components/library_items/Edit_Library_Item_Dialog';
import { useCopiesOfLibraryItem } from '../hooks/use_copies';
import { useLibraryItemById } from '../hooks/use_library_items';
import { Library_Item_Type } from '../types/item_types';
import { Book_Content } from '../components/library_items/type_specific_content/Book_Content';
import { Audiobook_Content } from '../components/library_items/type_specific_content/Audiobook_Content';
import { Magazine_Content } from '../components/library_items/type_specific_content/Magazine_Content';
import { Periodical_Content } from '../components/library_items/type_specific_content/Periodical_Content';
import { LIP_Section } from '../components/library_items/common';
import { Video_Content } from '../components/library_items/type_specific_content/Video_Content';
import { Vinyl_Content } from '../components/library_items/type_specific_content/Vinyl_Content';
import { Cd_Content } from '../components/library_items/type_specific_content/cd_content';

const copy_columns: GridColDef[] = [
  {
    field: 'copy_label',
    headerName: 'Copy',
    width: 120,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    renderCell: (params) => (
      <ItemCopyStatusChip size='small' status={params.value} />
    ),
  },
  {
    field: 'condition',
    headerName: 'Condition',
    width: 120,
    renderCell: (params) => (
      <Item_Copy_Condition_Chip size='small' condition={params.value} />
    ),
  },
  {
    field: 'current_branch_name',
    headerName: 'Current Location',
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'patron_first_name',
    headerName: 'Checked Out By',
    width: 150,
    valueGetter: (_value, row) => {
      if (row.patron_first_name && row.patron_last_name) {
        return `${row.patron_first_name} ${row.patron_last_name}`;
      }
      return '-';
    },
  },
];

// Simplified columns for mobile view
const mobile_copy_columns: GridColDef[] = [
  {
    field: 'copy_number',
    headerName: 'Copy',
    width: 70,
    valueFormatter: (value) => `#${value}`,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    flex: 1,
    renderCell: (params) => (
      <ItemCopyStatusChip size='small' status={params.value} />
    ),
  },
  {
    field: 'condition',
    headerName: 'Condition',
    width: 100,
    flex: 1,
    renderCell: (params) => (
      <Item_Copy_Condition_Chip size='small' condition={params.value} />
    ),
  },
];

export const Library_Item_Page = () => {
  const theme = useTheme();
  const is_mobile = useMediaQuery(theme.breakpoints.down('md'));
  const { library_item_id } = useParams();
  const {
    data,
    isLoading: item_loading,
    refetch,
  } = useLibraryItemById(parseInt(library_item_id!));

  const { data: copies, isLoading: copies_loading } = useCopiesOfLibraryItem(
    parseInt(library_item_id!),
  );

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [edit_dialog_open, set_edit_dialog_open] = useState(false);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handle_close = () => {
    setAnchorEl(null);
  };

  const handle_edit_click = () => {
    handle_close();
    set_edit_dialog_open(true);
  };

  const handle_edit_dialog_close = () => {
    set_edit_dialog_open(false);
  };

  const handle_edit_success = () => {
    refetch();
  };

  const nav = useNavigate();

  const get_copies_grid = () => {
    return (
      <LIP_Section sx={{ mt: 2, width: '100%' }}>
        <Typography variant='h6' gutterBottom>
          Item Copies
        </Typography>
        <Simple_Grid
          rows={copies || []}
          cols={is_mobile ? mobile_copy_columns : copy_columns}
          loading={copies_loading}
          on_row_double_click={(e) => nav(`/library-item-copy/${e.id}`)}
        />
      </LIP_Section>
    );
  };

  const render_main_content = (item_type: Library_Item_Type | undefined) => {
    if (!data)
      return (
        <Grid size={{ xs: 12 }}>
          <CircularProgress
            sx={{
              width: { xs: 40, sm: 60, md: 80 },
              height: { xs: 40, sm: 60, md: 80 },
            }}
          />
        </Grid>
      );
    switch (item_type) {
      case Library_Item_Type.Book:
        return <Book_Content library_item={data}></Book_Content>;
      case Library_Item_Type.Video:
        return <Video_Content library_item={data} />;
      case Library_Item_Type.Audiobook:
        return <Audiobook_Content library_item={data} />;
      case Library_Item_Type.Magazine:
        return <Magazine_Content library_item={data} />;
      case Library_Item_Type.Periodical:
        return <Periodical_Content library_item={data} />;
      case Library_Item_Type.Vinyl:
        return <Vinyl_Content library_item={data} />;
      case Library_Item_Type.CD:
        return <Cd_Content library_item={data} />;
      default:
        return <div>Unsupported item type</div>;
    }
  };

  const page_loading = !library_item_id || item_loading;
  return (
    <PageContainer width='xl' sx={{ overflowY: 'auto' }}>
      <Edit_Library_Item_Dialog
        open={edit_dialog_open}
        on_close={handle_edit_dialog_close}
        library_item={data || null}
        on_success={handle_edit_success}
      />
      <Card sx={{ borderRadius: 3, minHeight: 'min-content' }}>
        <CardHeader
          sx={{ pb: 0 }}
          action={
            <>
              <IconButton onClick={handleClick}>
                <MoreVert />
              </IconButton>
              <Menu
                id='basic-menu'
                anchorEl={anchorEl}
                open={open}
                onClose={handle_close}
                slotProps={{
                  list: {
                    'aria-labelledby': 'basic-button',
                  },
                }}
              >
                <MenuList>
                  <MenuItem onClick={handle_edit_click}>
                    <ListItemIcon>
                      <Edit />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handle_close}>
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
            <Typography fontWeight={'bold'} variant='h6'>
              {page_loading ? 'Library Item' : `${data?.title}`}
            </Typography>
          }
        />

        <Typography sx={{ px: 2 }} variant='subtitle2' color='text.secondary'>
          {data?.description}
        </Typography>
        {data && data.genres.length > 0 && (
          <Stack
            sx={{ px: 2, py: 1 }}
            direction={'row'}
            gap={1}
            flexWrap={'wrap'}
          >
            {data?.genres.map((b) => (
              <Genre_Chip genre={b} />
            ))}
          </Stack>
        )}
      </Card>

      <Grid container spacing={2} sx={{ width: '100%' }}>
        <Grid
          size={{ xs: 12, md: 8 }}
          order={{ xs: 2, sm: 1 }}
          sx={{ width: '100%' }}
        >
          {render_main_content(data?.item_type)}
          {get_copies_grid()}
        </Grid>
        <Grid
          size={{ xs: 12, md: 4 }}
          order={{ xs: 1, sm: 2 }}
          sx={{ width: '100%' }}
        >
          <img
            style={{
              width: '100%',
              maxWidth: is_mobile ? 350 : '100%',
              display: 'block',
              margin: is_mobile ? '0 auto' : undefined,
              borderRadius: '8px',
            }}
            src={data?.cover_image_url || undefined}
            alt={`Cover image of ${data?.title || ''}`}
          />
        </Grid>
      </Grid>
    </PageContainer>
  );
};
