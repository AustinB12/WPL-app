import { LocalLibrary } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { useState } from 'react';
import { PageContainer, Page_Title } from '../components/common/PageBuilders';
import { SearchWithNameOrId } from '../components/common/SearchWithNameOrId';
import { CopiesDataGrid } from '../components/copies/CopiesDataGrid';

export function SearchPage() {
  const [search_term, set_search_term] = useState<string>('');
  return (
    <PageContainer width='xl'>
      <Page_Title
        title='Welcome to Wayback Public Library System'
        Icon_Component={LocalLibrary}
      />
      <Typography
        variant='body1'
        sx={{
          color: 'text.secondary',
          fontWeight: 400,
          mb: 1,
        }}
      >
        Search for library items to check out, reserve, or manage.
      </Typography>
      <SearchWithNameOrId
        sx={{ width: { xs: '100%', sm: 'clamp(300px, 50%, 600px)' } }}
        search_term={search_term}
        set_search_term={set_search_term}
      />
      <CopiesDataGrid filter={search_term} />
    </PageContainer>
  );
}
