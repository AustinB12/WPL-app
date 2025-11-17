import { Container, Typography } from '@mui/material';
import { CheckedOutItemsGrid } from '../components/common/CheckedOutItemsGrid';

export function RenewalsPage() {
  const handle_select_copy = (copy_id: number) => {
    // Handle selection of a copy for renewal
    console.log(
      '%cSelected copy ID for renewal: ' + String(copy_id),
      'color: orange; font-weight: bold; font-size: 2rem;'
    );
  };
  return (
    <Container
      maxWidth="xl"
      sx={{
        height: 1,
        display: 'flex',
        flexDirection: 'column',
        py: 3,
        gap: 1,
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        {'Select Item For Renewal'}
      </Typography>
      <CheckedOutItemsGrid select_item_copy={handle_select_copy} />
    </Container>
  );
}
