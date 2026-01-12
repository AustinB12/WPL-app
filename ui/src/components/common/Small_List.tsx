import { ExpandMore } from '@mui/icons-material';
import { AppBar, Toolbar, Typography, IconButton, List } from '@mui/material';
import type { PropsWithChildren, Dispatch, JSX } from 'react';

function Small_List({
  total,
  desc_sort,
  set_desc_sort,
  children,
}: PropsWithChildren<{
  total: number;
  desc_sort: boolean;
  set_desc_sort: Dispatch<React.SetStateAction<boolean>>;
}>): JSX.Element {
  return (
    <>
      <AppBar position='relative' sx={{ borderRadius: '8px 8px 0 0 ' }}>
        <Toolbar>
          <Typography
            variant='body1'
            component='div'
            fontWeight={'bold'}
            sx={{ flexGrow: 1 }}
          >
            Total: {total}
          </Typography>
          <IconButton onClick={() => set_desc_sort(!desc_sort)}>
            <ExpandMore
              sx={{
                transform: desc_sort ? 'rotate(-180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease-out',
              }}
            />
          </IconButton>
        </Toolbar>
      </AppBar>
      <List sx={{ overflow: 'auto', maxHeight: '100%', pt: 0 }}>
        {children}
      </List>
    </>
  );
}
export default Small_List;
