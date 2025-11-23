import { SsidChart } from '@mui/icons-material';
import { TransactionsDataGrid } from '../components/transactions/TransactionsDataGrid';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';

export const TransactionsPage = () => {
  return (
    <PageContainer>
      <PageTitle title="Transactions" Icon_Component={SsidChart} />
      <TransactionsDataGrid hidden_columns={['notes']} />
    </PageContainer>
  );
};
