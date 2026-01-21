import { Close } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useUpdateLibraryItem } from '../../hooks/use_library_items';
import { useSnackbar } from '../../hooks/use_snackbar';
import { Genre, type Library_Item } from '../../types/item_types';
import { Genre_Chip } from '../common/GenreChip';

interface Edit_Library_Item_Dialog_Props {
  open: boolean;
  on_close: () => void;
  library_item: Library_Item | null;
  on_success?: () => void;
}

const GENRE_OPTIONS = Object.values(Genre);

export function Edit_Library_Item_Dialog({
  open,
  on_close,
  library_item,
  on_success,
}: Edit_Library_Item_Dialog_Props) {
  const { show_snackbar } = useSnackbar();

  const [title, set_title] = useState('');
  const [description, set_description] = useState('');
  const [publication_year, set_publication_year] = useState<number | ''>('');
  const [author, set_author] = useState('');
  const [publisher, set_publisher] = useState('');
  const [genres, set_genres] = useState<Genre[]>([]);
  const [cover_image_url, set_cover_image_url] = useState('');
  const [number_of_pages, set_number_of_pages] = useState<number | ''>('');

  // Video fields
  const [director, set_director] = useState('');
  const [studio, set_studio] = useState('');
  const [video_format, set_video_format] = useState('');
  const [duration_minutes, set_duration_minutes] = useState<number | ''>('');
  const [video_rating, set_video_rating] = useState('');

  // Audiobook fields
  const [narrator, set_narrator] = useState('');
  const [audiobook_duration, set_audiobook_duration] = useState<number | ''>(
    '',
  );

  const { mutate: update_item, isPending } = useUpdateLibraryItem({
    onSuccess: () => {
      show_snackbar({
        message: 'Library item updated successfully',
        severity: 'success',
      });
      on_success?.();
      on_close();
    },
    onError: (error) => {
      show_snackbar({
        message: `Failed to update item: ${error.message}`,
        severity: 'error',
      });
    },
  });

  // Populate form when library_item changes
  useEffect(() => {
    if (library_item) {
      set_title(library_item.title || '');
      set_description(library_item.description || '');
      set_publication_year(library_item.publication_year || '');
      set_author(library_item.author || '');
      set_publisher(
        library_item.publisher || library_item.audiobook_publisher || '',
      );
      set_genres(library_item.genres || []);
      set_cover_image_url(
        library_item.cover_image_url ||
          library_item.audiobook_cover_image ||
          '',
      );
      set_number_of_pages(
        library_item.number_of_pages
          ? parseInt(library_item.number_of_pages)
          : '',
      );
      set_director(library_item.director || '');
      set_studio(library_item.studio || '');
      set_video_format(library_item.video_format || '');
      set_duration_minutes(
        library_item.duration_minutes
          ? parseInt(library_item.duration_minutes)
          : '',
      );
      set_video_rating(library_item.video_rating || '');
      set_narrator(library_item.narrator || '');
      set_audiobook_duration(
        library_item.audiobook_duration
          ? parseInt(library_item.audiobook_duration)
          : '',
      );
    }
  }, [library_item]);

  const handle_submit = () => {
    if (!library_item) return;

    const update_data: Record<string, unknown> = {
      title,
      description,
      publication_year: publication_year || undefined,
      item_type: library_item.item_type,
    };

    // Add type-specific fields
    const item_type = library_item.item_type;

    if (item_type === 'BOOK') {
      Object.assign(update_data, {
        author,
        publisher,
        genres: genres,
        cover_image_url,
        number_of_pages: number_of_pages || undefined,
      });
    } else if (item_type === 'VIDEO') {
      Object.assign(update_data, {
        director,
        studio,
        video_format,
        duration_minutes: duration_minutes || undefined,
        video_rating,
      });
    } else if (item_type === 'AUDIOBOOK') {
      Object.assign(update_data, {
        author,
        narrator,
        audiobook_duration: audiobook_duration || undefined,
        audiobook_publisher: publisher,
        audiobook_cover_image: cover_image_url,
      });
    }

    update_item({
      item_id: library_item.id,
      // biome-ignore lint/suspicious/noExplicitAny: dynamic form data
      data: update_data as any,
    });
  };

  const handle_close = () => {
    if (!isPending) {
      on_close();
    }
    if (library_item) {
      set_title(library_item.title || '');
      set_description(library_item.description || '');
      set_publication_year(library_item.publication_year || '');
      set_author(library_item.author || '');
      set_publisher(
        library_item.publisher || library_item.audiobook_publisher || '',
      );
      set_genres(library_item.genres || []);
      set_cover_image_url(
        library_item.cover_image_url ||
          library_item.audiobook_cover_image ||
          '',
      );
      set_number_of_pages(
        library_item.number_of_pages
          ? parseInt(library_item.number_of_pages)
          : '',
      );
      set_director(library_item.director || '');
      set_studio(library_item.studio || '');
      set_video_format(library_item.video_format || '');
      set_duration_minutes(
        library_item.duration_minutes
          ? parseInt(library_item.duration_minutes)
          : '',
      );
      set_video_rating(library_item.video_rating || '');
      set_narrator(library_item.narrator || '');
      set_audiobook_duration(
        library_item.audiobook_duration
          ? parseInt(library_item.audiobook_duration)
          : '',
      );
    }
  };

  const is_book = library_item?.item_type === 'BOOK';
  const is_video = library_item?.item_type === 'VIDEO';
  const is_audiobook = library_item?.item_type === 'AUDIOBOOK';

  return (
    <Dialog
      open={open}
      onClose={handle_close}
      maxWidth='sm'
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle>
        <Stack
          direction='row'
          justifyContent='space-between'
          alignItems='center'
        >
          Edit Library Item
          <IconButton onClick={handle_close} disabled={isPending} size='small'>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Common Fields */}
          <TextField
            label='Title'
            value={title}
            onChange={(e) => set_title(e.target.value)}
            fullWidth
            required
            disabled={isPending}
          />

          <TextField
            label='Description'
            value={description}
            onChange={(e) => set_description(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={isPending}
          />

          <TextField
            label='Publication Year'
            type='number'
            value={publication_year}
            onChange={(e) =>
              set_publication_year(
                e.target.value ? parseInt(e.target.value) : '',
              )
            }
            fullWidth
            disabled={isPending}
          />

          {/* Book-specific fields */}
          {is_book && (
            <>
              <TextField
                label='Author'
                value={author}
                onChange={(e) => set_author(e.target.value)}
                fullWidth
                disabled={isPending}
              />

              <TextField
                label='Publisher'
                value={publisher}
                onChange={(e) => set_publisher(e.target.value)}
                fullWidth
                disabled={isPending}
              />

              <TextField
                label='Number of Pages'
                type='number'
                value={number_of_pages}
                onChange={(e) =>
                  set_number_of_pages(
                    e.target.value ? parseInt(e.target.value) : '',
                  )
                }
                fullWidth
                disabled={isPending}
              />

              <Autocomplete
                multiple
                options={GENRE_OPTIONS}
                value={genres}
                onChange={(_, new_value) => set_genres(new_value)}
                disabled={isPending}
                renderInput={(params) => (
                  <TextField {...params} label='Genre' />
                )}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li key={key} {...optionProps}>
                      {selected && '✅'}
                      <Genre_Chip size='small' key={option} genre={option} />
                    </li>
                  );
                }}
                renderValue={(values) =>
                  values.map((genre) => (
                    <Genre_Chip key={genre} genre={genre} sx={{ mr: 1 }} />
                  ))
                }
              />

              <TextField
                label='Cover Image URL'
                value={cover_image_url}
                onChange={(e) => set_cover_image_url(e.target.value)}
                fullWidth
                disabled={isPending}
              />

              {cover_image_url && (
                <Box sx={{ textAlign: 'center' }}>
                  <img
                    src={cover_image_url}
                    alt='Cover preview'
                    style={{
                      maxHeight: 150,
                      borderRadius: 8,
                      objectFit: 'contain',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </Box>
              )}
            </>
          )}

          {/* Video-specific fields */}
          {is_video && (
            <>
              <TextField
                label='Director'
                value={director}
                onChange={(e) => set_director(e.target.value)}
                fullWidth
                disabled={isPending}
              />

              <TextField
                label='Studio'
                value={studio}
                onChange={(e) => set_studio(e.target.value)}
                fullWidth
                disabled={isPending}
              />

              <TextField
                label='Video Format'
                value={video_format}
                onChange={(e) => set_video_format(e.target.value)}
                fullWidth
                disabled={isPending}
                placeholder='e.g., DVD, Blu-ray, VHS'
              />

              <TextField
                label='Duration (minutes)'
                type='number'
                value={duration_minutes}
                onChange={(e) =>
                  set_duration_minutes(
                    e.target.value ? parseInt(e.target.value) : '',
                  )
                }
                fullWidth
                disabled={isPending}
              />

              <TextField
                label='Rating'
                value={video_rating}
                onChange={(e) => set_video_rating(e.target.value)}
                fullWidth
                disabled={isPending}
                placeholder='e.g., PG, PG-13, R'
              />
            </>
          )}

          {/* Audiobook-specific fields */}
          {is_audiobook && (
            <>
              <TextField
                label='Author'
                value={author}
                onChange={(e) => set_author(e.target.value)}
                fullWidth
                disabled={isPending}
              />

              <TextField
                label='Narrator'
                value={narrator}
                onChange={(e) => set_narrator(e.target.value)}
                fullWidth
                disabled={isPending}
              />

              <TextField
                label='Publisher'
                value={publisher}
                onChange={(e) => set_publisher(e.target.value)}
                fullWidth
                disabled={isPending}
              />

              <TextField
                label='Duration (seconds)'
                type='number'
                value={audiobook_duration}
                onChange={(e) =>
                  set_audiobook_duration(
                    e.target.value ? parseInt(e.target.value) : '',
                  )
                }
                fullWidth
                disabled={isPending}
              />

              <TextField
                label='Cover Image URL'
                value={cover_image_url}
                onChange={(e) => set_cover_image_url(e.target.value)}
                fullWidth
                disabled={isPending}
              />
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handle_close} disabled={isPending} variant='outlined'>
          Cancel
        </Button>
        <Button
          onClick={handle_submit}
          disabled={isPending || !title.trim()}
          variant='contained'
          loading={isPending}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
