import { ReceiptLong } from '@mui/icons-material';
import {
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Activity, type JSX, useState } from 'react';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';
import { TransactionsDataGrid } from '../components/transactions/TransactionsDataGrid';

export const TransactionsPage = () => {
  const theme = useTheme();
  const is_mobile_query = theme.breakpoints.down('md');
  const is_mobile = useMediaQuery(is_mobile_query);

  return (
    <PageContainer width="xl" scroll={true}>
      <PageTitle
        title="Library Item Transactions"
        Icon_Component={ReceiptLong}
      />
      <Activity mode={is_mobile ? 'hidden' : 'visible'}>
        <TransactionsDataGrid hidden_columns={['notes']} />
      </Activity>
      <Activity mode={is_mobile ? 'visible' : 'hidden'}>
        <List>
          <Transactions_List />
        </List>
      </Activity>
    </PageContainer>
  );
};

import Small_List from '../components/common/Small_List';
import { TransactionTypeChip } from '../components/transactions/TransactionTypeChip';
import { useAllCopyTransactions } from '../hooks/use_copies';

function Transactions_List() {
  const { data, isLoading: loading } = useAllCopyTransactions();

  const theme = useTheme();
  const is_dark = theme.palette.mode === 'dark';

  const [desc_sort, set_desc_sort] = useState(false);

  if (loading) {
    return (
      <List>
        {[1, 2, 3, 4, 5].map((s) => (
          <Skeleton key={s} variant="rectangular" height={80} sx={{ mb: 2 }} />
        ))}
      </List>
    );
  }

  if (!data || data.length === 0) {
    return <div>No transactions found.</div>;
  }

  const list_items: JSX.Element[] = data.map((t, index) => {
    const styles =
      index % 2 !== 0 ? { bgcolor: is_dark ? '#ffffff10' : '#00000010' } : {};
    return (
      <ListItem
        key={t.id}
        sx={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          mb: 2,
          borderRadius: 3,
          py: 1,
          px: 2,
          boxShadow: 2,
          ...styles,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          justifyContent={'space-between'}
          sx={{ mt: 1, width: '100%' }}
        >
          <ListItemText>
            {<TransactionTypeChip transaction_type={t.transaction_type} />}
          </ListItemText>
          <ListItemText sx={{ textAlign: 'right' }}>
            {new Date(t.date).toLocaleString()}
          </ListItemText>
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          justifyContent={'space-between'}
          sx={{ mt: 1, width: '100%' }}
        >
          <ListItemText secondary="Patron ID">{t.patron_id}</ListItemText>
          <ListItemText sx={{ textAlign: 'right' }} secondary="Item ID">
            {t.item_copy_id}
          </ListItemText>
        </Stack>
        {t.notes && <ListItemText secondary="Notes">{t.notes}</ListItemText>}
      </ListItem>
    );
  });

  if (desc_sort) list_items.reverse();

  return (
    <Small_List
      total={data.length}
      desc_sort={desc_sort}
      set_desc_sort={set_desc_sort}
    >
      {list_items}
    </Small_List>
  );
}
