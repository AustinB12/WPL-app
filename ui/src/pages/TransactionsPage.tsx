import { Container } from '@mui/material';
import { TransactionsDataGrid } from '../components/transactions/TransactionsDataGrid';

export const TransactionsPage = () => {
  return (
    <Container maxWidth="xl" sx={{ p: 3 }}>
      <TransactionsDataGrid />
    </Container>
  );
};
