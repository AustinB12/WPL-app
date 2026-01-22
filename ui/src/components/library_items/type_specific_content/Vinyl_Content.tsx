import { Box, Stack } from '@mui/material';
import type { Library_Item } from '../../../types/item_types';
import { LIP_Field, LIP_Section } from '../common';

export function Vinyl_Content({
  library_item,
}: {
  library_item: Library_Item;
}) {
  return (
    <LIP_Section>
      <Stack direction={'row'} justifyContent={'space-between'}>
        <Box>
          <LIP_Field label='Color' value={library_item.vinyl_color || 'N/A'} />
          <LIP_Field
            label='Tracks'
            value={String(library_item.vinyl_tracks) || 'N/A'}
          />
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <LIP_Field label='Artist' value={library_item.artist || 'N/A'} />
          <LIP_Field
            label='Record Label'
            value={library_item.record_label || 'N/A'}
          />
        </Box>
      </Stack>
      <LIP_Field
        label='Duration (seconds)'
        value={String(library_item.duration_seconds) || 'N/A'}
      />
    </LIP_Section>
  );
}
