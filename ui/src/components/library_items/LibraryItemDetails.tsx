import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useCopiesOfLibraryItem } from '../../hooks/use_copies';
import { Library_Item_Type, type Library_Item } from '../../types/item_types';
import { Details_Drawer } from '../common/DetailsDrawer';
import Item_Type_Chip from './ItemTypeChip';
import { LIP_Section } from './common';
import Simple_Grid from '../common/SimpleGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { ItemCopyStatusChip } from '../copies/ItemCopyStatusChip';
import { Item_Copy_Condition_Chip } from '../copies/ItemCopyConditionChip';
import { Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Item_Details_Props {
  is_open: boolean;
  item: Library_Item | null;
  onClose: () => void;
}

interface ItemInfoField {
  label: string;
  value: string | number | undefined;
}

interface LayoutConfig {
  title: string;
  fields: ItemInfoField[];
  descriptionTitle: string;
  icon?: React.ReactNode;
}

const getLayoutConfig = (item: Library_Item): LayoutConfig => {
  switch (item.item_type) {
    case Library_Item_Type.Book:
      return {
        title: 'Book Information',
        descriptionTitle: 'Synopsis',
        fields: [
          { label: 'ISBN', value: item.id },
          { label: 'Publication Year', value: item.publication_year },
          { label: 'Genre', value: 'TODO CHANGE THIS' },
          { label: 'Pages', value: item.pages },
        ],
        icon: <Item_Type_Chip item_type={Library_Item_Type.Book} />,
      };
    case Library_Item_Type.Periodical:
      return {
        title: 'Periodical Details',
        descriptionTitle: 'Contents Overview',
        fields: [
          { label: 'Issue ID', value: item.id },
          { label: 'Publication Date', value: item.publication_year },
          { label: 'Frequency', value: 'Monthly' },
          { label: 'Publisher', value: 'Academic Press' },
        ],
        icon: <Item_Type_Chip item_type={Library_Item_Type.Periodical} />,
      };
    case Library_Item_Type.Recording:
      return {
        title: 'Album Information',
        descriptionTitle: 'Album Description',
        fields: [
          { label: 'Catalog Number', value: item.id },
          { label: 'Release Year', value: item.publication_year },
          { label: 'Duration', value: 'Approx. 45-60 minutes' },
          { label: 'Format', value: 'CD/Vinyl' },
        ],
        icon: <Item_Type_Chip item_type={Library_Item_Type.Recording} />,
      };
    case Library_Item_Type.Video:
      return {
        title: 'Video Details',
        descriptionTitle: 'Plot Summary',
        fields: [
          { label: 'Video ID', value: item.id },
          { label: 'Release Year', value: item.publication_year },
          { label: 'Runtime', value: 'Feature Length' },
          { label: 'Format', value: 'DVD/Blu-ray' },
        ],
        icon: <Item_Type_Chip item_type={Library_Item_Type.Video} />,
      };
    case Library_Item_Type.Magazine:
      return {
        title: 'Magazine Information',
        descriptionTitle: 'Featured Articles',
        fields: [
          { label: 'Issue Number', value: item.id },
          { label: 'Publication Date', value: item.publication_year },
          { label: 'Volume', value: 'Current Issue' },
          { label: 'Category', value: 'General Interest' },
        ],
        icon: <Item_Type_Chip item_type={Library_Item_Type.Magazine} />,
      };
    case Library_Item_Type.Audiobook:
      return {
        title: 'Audiobook Details',
        descriptionTitle: 'Story Overview',
        fields: [
          { label: 'Audiobook ID', value: item.id },
          { label: 'Publication Year', value: item.publication_year },
          { label: 'Duration', value: '8-12 hours' },
          { label: 'Narrator', value: 'Professional Voice Actor' },
        ],
        icon: <Item_Type_Chip item_type={Library_Item_Type.Audiobook} />,
      };
    default:
      return {
        title: 'Item Information',
        descriptionTitle: 'Description',
        fields: [
          { label: 'Item ID', value: item.id },
          { label: 'Publication Year', value: item.publication_year },
        ],
        icon: <Item_Type_Chip item_type={Library_Item_Type.Audiobook} />,
      };
  }
};

const Item_Layout = ({ item }: { item: Library_Item }) => {
  const config = getLayoutConfig(item);

  return (
    <Stack spacing={2}>
      <ItemInfoSection title={config.title} fields={config.fields} />
      <Description_Section
        title={config.descriptionTitle}
        description={item.description}
      />
      <Copies_Section item={item} />
    </Stack>
  );
};

const ItemInfoSection = ({
  title,
  fields,
}: {
  title: string;
  fields: ItemInfoField[];
}) => (
  <Paper elevation={1} sx={{ p: 2 }}>
    <Typography variant='subtitle2' color='text.secondary' gutterBottom>
      {title}
    </Typography>
    <Stack spacing={1}>
      {fields.map(
        (field, index) =>
          field.value && (
            <Typography key={index} variant='body2'>
              <strong>{field.label}:</strong> {field.value}
            </Typography>
          ),
      )}
    </Stack>
  </Paper>
);

const Description_Section = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  if (!description) return null;
  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant='subtitle2' color='text.secondary' gutterBottom>
        {title}
      </Typography>
      <Typography variant='body1'>{description}</Typography>
    </Paper>
  );
};

const Copies_Section = ({ item }: { item: Library_Item }) => {
  const { data: copies, isLoading: loading } = useCopiesOfLibraryItem(item.id);
  const theme = useTheme();
  const is_mobile = useMediaQuery(theme.breakpoints.down('md'));
  const nav = useNavigate();
  return (
    <LIP_Section sx={{ mt: 2, width: '100%' }}>
      <Typography variant='h6' gutterBottom>
        Item Copies
      </Typography>
      <Simple_Grid
        rows={copies || []}
        cols={is_mobile ? mobile_copy_columns : copy_columns}
        loading={loading}
        on_row_double_click={(e) => nav(`/library-item-copy/${e.id}`)}
      />
    </LIP_Section>
  );
};

export const Library_Item_Details = ({
  is_open,
  item,
  onClose,
}: Item_Details_Props) => {
  if (!item) {
    return (
      <Details_Drawer open={is_open} handle_close={onClose}>
        <Box p={3}>
          <Typography variant='h6' color='text.secondary'>
            No item selected
          </Typography>
        </Box>
      </Details_Drawer>
    );
  }

  const config = getLayoutConfig(item);

  return (
    <Details_Drawer open={is_open} handle_close={onClose}>
      <Card
        sx={{
          p: 1,
          mt: '64px',
          boxShadow: 'none',
          height: 1,
          borderRadius: 0,
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardHeader
          sx={{ p: 0.5 }}
          title={
            <Typography
              variant='h4'
              component='h1'
              fontWeight={'bold'}
              sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}
            >
              {item.title}
            </Typography>
          }
          subheader={config?.icon && config.icon}
          action={
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          }
        />
        <CardContent sx={{ p: 0, overflowY: 'auto', flex: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Item_Layout item={item} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                component={'img'}
                src={item.cover_image_url}
                sx={{ width: '100%', mt: 1, borderRadius: 2 }}
              ></Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Details_Drawer>
  );
};

const copy_columns: GridColDef[] = [
  {
    field: 'copy_label',
    headerName: 'Copy',
    width: 100,
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
