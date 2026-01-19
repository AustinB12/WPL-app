import {
  Stack,
  Card,
  CardActionArea,
  CardMedia,
  CardHeader,
  CardContent,
  LinearProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { useState, type FC } from 'react';
import { PageTitle } from '../components/common/PageBuilders';
import { Explore, Refresh } from '@mui/icons-material';
import { Library_Item_Type, type Library_Item } from '../types/item_types';
import { useLibraryItems } from '../hooks/use_library_items';
import ItemTypeChip from '../components/library_items/ItemTypeChip';
import { GenreChip } from '../components/common/GenreChip';
import Masonry from '@mui/lab/Masonry';
import { useNavigate } from 'react-router-dom';

export const Explore_Page: FC = () => {
  const {
    data: library_items,
    isLoading: loading,
    refetch,
    isRefetching: refetching,
  } = useLibraryItems();

  const [selected_types, set_selected_types] = useState<
    (Library_Item_Type | 'all')[]
  >(['all']);

  let filtered_items: Library_Item[] = [];

  if (!selected_types.includes('all')) {
    filtered_items =
      library_items?.filter((item) =>
        selected_types.includes(item.item_type),
      ) || [];
  } else {
    filtered_items = library_items || [];
  }

  return (
    <Stack gap={2} sx={{ p: 2 }}>
      <PageTitle
        title='Explore'
        Icon_Component={Explore}
        container_sx={{ mb: 4 }}
      />

      <Stack
        direction={'row'}
        alignItems='center'
        gap={2}
        justifyContent={'space-between'}
      >
        <FormControl sx={{ minWidth: 200, alignSelf: 'flex-start' }}>
          <InputLabel id='item-type-select-label'>Item Type</InputLabel>
          <Select
            labelId='item-type-select-label'
            id='item-type-select'
            multiple
            value={selected_types}
            label='Item Type'
            onChange={(e) => {
              const value = e.target.value as (Library_Item_Type | 'all')[];
              // If 'all' is newly selected, reset to just 'all'
              if (value.includes('all') && !selected_types.includes('all')) {
                set_selected_types(['all']);
              } else if (value.includes('all') && value.length > 1) {
                // If selecting a specific type while 'all' is selected, remove 'all'
                set_selected_types(value.filter((v) => v !== 'all'));
              } else if (value.length === 0) {
                // Don't allow empty selection, default to 'all'
                set_selected_types(['all']);
              } else {
                set_selected_types(value);
              }
            }}
          >
            <MenuItem value='all'>All</MenuItem>
            {Object.values(Library_Item_Type).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton title='Refresh Items' loading={refetching || loading}>
          <Refresh fontSize='large' onClick={() => refetch()} />
        </IconButton>
      </Stack>

      <Stack
        flexWrap={'wrap'}
        direction={'row'}
        gap={2}
        alignItems='center'
        justifyContent='center'
        sx={{
          minHeight: '100%',
          width: '100%',
        }}
      >
        {loading ||
          (refetching && (
            <LinearProgress variant='indeterminate' sx={{ width: '90%' }} />
          ))}
        {!loading && !refetching && library_items && (
          <Masonry columns={{ xs: 2, sm: 3, md: 4, lg: 6 }} spacing={2}>
            {filtered_items.map((item) => (
              <Tall_Item_Card key={item.id} library_item={item} />
            ))}
          </Masonry>
        )}
      </Stack>
    </Stack>
  );
};

const Tall_Item_Card = ({ library_item }: { library_item: Library_Item }) => {
  const nav = useNavigate();

  return (
    <Card component={'div'} sx={{ width: '100%' }}>
      <CardActionArea onClick={() => nav(`/library-item/${library_item.id}`)}>
        <CardMedia
          component={'img'}
          image={
            library_item.cover_image_url ??
            'https://prodimage.images-bn.com/pimages/9781454959571_p0_v9_s1200x630.jpg'
          }
          sx={{ maxHeight: 350, minHeight: 200 }}
        ></CardMedia>
        <CardHeader
          title={<Typography variant='body2'>{library_item.title}</Typography>}
          subheader={
            <Typography variant='caption' color='text.secondary'>
              {`by ${get_by_string(library_item)}`}
            </Typography>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <ItemTypeChip
            item_type={library_item.item_type}
            sx={{ mb: 1 }}
            size='small'
          />
          <br />
          <Stack direction='row' flexWrap='wrap' gap={1}>
            {library_item.genre.map((g) => (
              <GenreChip key={g} genre={g} size={'small'} />
            ))}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const get_by_string = (item: Library_Item) => {
  switch (item.item_type) {
    case Library_Item_Type.Book:
      return item.author;
    case Library_Item_Type.Audiobook:
      return item.narrator;
    case Library_Item_Type.CD:
      return item.artist;
    case Library_Item_Type.Vinyl:
      return item.artist;
    case Library_Item_Type.Video:
      return item.director;
    default:
      return 'Unknown';
  }
};
