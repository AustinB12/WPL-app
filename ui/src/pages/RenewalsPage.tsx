import { Typography } from '@mui/material';
import { CheckedOutItemsGrid } from '../components/common/CheckedOutItemsGrid';
import { PageContainer } from '../components/common/PageBuilders';

export function RenewalsPage() {
  const handle_select_copy = (copy_id: number) => {
    // Handle selection of a copy for renewal
    console.log(
      '%cSelected copy ID for renewal: ' + String(copy_id),
      'color: orange; font-weight: bold; font-size: 2rem;'
    );
  };
  return (
    <PageContainer>
      <Typography variant="subtitle1" gutterBottom>
        {'Select Item For Renewal'}
      </Typography>
      <CheckedOutItemsGrid select_item_copy={handle_select_copy} />
    </PageContainer>
  );
}
