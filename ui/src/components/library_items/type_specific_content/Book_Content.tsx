import { Stack } from '@mui/material';
import { LIP_Section, LIP_Field } from '../common';
import type { Library_Item } from '../../../types/item_types';

export function Book_Content({ library_item }: { library_item: Library_Item }) {
  return (
    <LIP_Section>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'row', sm: 'row' }}
          spacing={{ xs: 1, sm: 0 }}
          justifyContent={'space-between'}
        >
          <LIP_Field label='Author' value={library_item?.author || ''} />
          <LIP_Field
            label='Publisher'
            value={
              library_item?.publisher ||
              library_item?.audiobook_publisher ||
              'Unknown'
            }
          />
        </Stack>
        <Stack
          direction={'row'}
          spacing={{ xs: 1, sm: 0 }}
          justifyContent={'space-between'}
        >
          <LIP_Field
            label='Number of Pages'
            value={library_item?.number_of_pages?.toString() || 'N/A'}
          />
          <LIP_Field
            label='Publication Year'
            value={library_item?.publication_year?.toString() || 'N/A'}
          />
        </Stack>
        <LIP_Field
          label='Description'
          value={library_item?.description || 'No description available'}
        />
      </Stack>
    </LIP_Section>
  );
}
