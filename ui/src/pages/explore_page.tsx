import {
  Stack,
  Card,
  CardActionArea,
  CardMedia,
  CardHeader,
  CardContent,
  LinearProgress,
  IconButton,
} from '@mui/material';
import type { FC } from 'react';
import { PageTitle } from '../components/common/PageBuilders';
import { Explore, Refresh } from '@mui/icons-material';
import type { Library_Item } from '../types/item_types';
import { useLibraryItems } from '../hooks/use_library_items';
import ItemTypeChip from '../components/library_items/ItemTypeChip';
import { GenreChip } from '../components/common/GenreChip';
import Masonry from '@mui/lab/Masonry';

export const Explore_Page: FC = () => {
  const {
    data: library_items,
    isLoading: loading,
    refetch,
    isRefetching: refetching,
  } = useLibraryItems();
  return (
    <Stack gap={2} sx={{ border: '2px dashed deeppink', p: 2 }}>
      <PageTitle
        title='Explore'
        Icon_Component={Explore}
        container_sx={{ mb: 4 }}
      />

      <Stack
        flexWrap={'wrap'}
        direction={'row'}
        gap={2}
        alignItems='center'
        justifyContent='center'
        sx={{
          minHeight: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        <IconButton sx={{ position: 'absolute', top: -10, right: -10 }}>
          <Refresh fontSize='large' onClick={() => refetch()} />
        </IconButton>
        {loading ||
          (refetching && (
            <LinearProgress variant='indeterminate' sx={{ width: '90%' }} />
          ))}
        {!loading && !refetching && library_items && (
          <Masonry columns={4} spacing={2}>
            {library_items.map((item) => (
              <Tall_Item_Card key={item.id} library_item={item} />
            ))}
          </Masonry>
        )}
      </Stack>
    </Stack>
  );
};

const Tall_Item_Card = ({ library_item }: { library_item: Library_Item }) => {
  return (
    <Card component={'div'} sx={{ width: '100%' }}>
      <CardActionArea>
        <CardMedia
          component={'img'}
          image={
            library_item.cover_image_url ??
            'https://prodimage.images-bn.com/pimages/9781454959571_p0_v9_s1200x630.jpg'
          }
        ></CardMedia>
        <CardHeader
          title={library_item.title}
          subheader={`by ${library_item.author}`}
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
