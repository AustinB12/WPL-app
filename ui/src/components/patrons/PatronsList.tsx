import { ListItem, Skeleton } from '@mui/material';
import { blueberryTwilightPalette } from '@mui/x-charts/colorPalettes';
import { type FC, useState } from 'react';
import { useAllPatrons } from '../../hooks/use_patrons';
import { ListViewCell } from '../common/ListViewCell';
import Small_List from '../common/Small_List';

const colors = blueberryTwilightPalette('dark'); // 6 colors available

const PatronsList: FC = () => {
  const { data: patrons = [], isLoading: loading } = useAllPatrons();
  const [desc_sort, set_desc_sort] = useState(false);

  if (loading) {
    return <Skeleton variant="rectangular" height={'40vh'} />;
  }

  return (
    <Small_List
      total={patrons.length}
      desc_sort={desc_sort}
      set_desc_sort={set_desc_sort}
    >
      {(desc_sort ? [...patrons].reverse() : patrons).map((patron, index) => (
        <ListItem
          key={patron.id}
          sx={(theme) => ({
            borderBottom: index < patrons.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
            bgcolor:
              index % 2 === 0
                ? theme.palette.background.paper
                : theme.alpha(theme.palette.background.paper, 0.6),
          })}
        >
          <ListViewCell
            key={patron.id}
            patron={patron}
            color={colors[index % colors.length]}
          />
        </ListItem>
      ))}
    </Small_List>
  );
};
export default PatronsList;
