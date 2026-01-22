import { Stack, Box } from '@mui/material';
import type { Library_Item } from '../../../types/item_types';
import { LIP_Field, LIP_Section } from '../common';

export function Video_Content({
  library_item,
}: {
  library_item: Library_Item;
}) {
  return (
    <LIP_Section>
      <Stack direction={'row'} justifyContent={'space-between'}>
        <Box>
          <LIP_Field label='Director' value={library_item.director || 'N/A'} />
          <LIP_Field label='Studio' value={library_item.studio || 'N/A'} />
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <LIP_Field
            label='Duration (minutes)'
            value={String(library_item.duration_minutes) || 'N/A'}
          />
          <LIP_Field label='Format' value={library_item.format || 'N/A'} />
        </Box>
      </Stack>
      <LIP_Field
        label='Duration (minutes)'
        value={String(library_item.duration_minutes) || 'N/A'}
      />
    </LIP_Section>
  );
}
