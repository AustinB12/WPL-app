import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalStyles, useTheme } from '@mui/material';

import { Layout } from './components/common/Layout';
import { HomePage } from './pages/HomePage';
import { LibraryItemsPage } from './pages/LibraryItemsPage';
import { DashboardPage } from './pages/DashboardPage';
import { Patrons } from './pages/Patrons';
import { CheckInItem } from './pages/CheckInItem';
import { CheckOutItem } from './pages/CheckOutItem';
import { BookPage } from './pages/Book';
import { PatronPage } from './pages/PatronPage';
import { lazy } from 'react';

const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  }))
);
const RenewalsPage = lazy(() =>
  import('./pages/RenewalsPage').then((module) => ({
    default: module.RenewalsPage,
  }))
);
const MarkAvailablePage = lazy(() =>
  import('./pages/MarkAvailablePage').then((module) => ({
    default: module.MarkAvailablePage,
  }))
);
const ReshelveItemPage = lazy(() =>
  import('./pages/ReshelveItemPage').then((module) => ({
    default: module.ReshelveItemPage,
  }))
);
const ReservationsPage = lazy(() =>
  import('./pages/ReservationsPage').then((module) => ({
    default: module.ReservationsPage,
  }))
);
const ReshelveItemsPageNew = lazy(() =>
  import('./pages/ReshelveItemsPageNew').then((module) => ({
    default: module.ReshelveItemsPageNew,
  }))
);
const LibraryItemCopiesPage = lazy(() =>
  import('./pages/LibraryItemCopiesPage').then((module) => ({
    default: module.LibraryItemCopiesPage,
  }))
);
const TransactionsPage = lazy(() =>
  import('./pages/TransactionsPage').then((module) => ({
    default: module.TransactionsPage,
  }))
);

const queryClient = new QueryClient();

function App() {
  const t = useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyles
        styles={{
          '*::-webkit-scrollbar': {
            width: '8px',
          },
          '*::-webkit-scrollbar-track': {
            background:
              t.palette.mode === 'dark' ? '#202020ff !important' : '#f0f0f0',
          },
          '*::-webkit-scrollbar-thumb': {
            background:
              t.palette.mode === 'dark'
                ? t.palette.grey[600]
                : t.palette.grey[400],
            borderRadius: '6px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="library-items" element={<LibraryItemsPage />} />
          <Route
            path="library-item-copies"
            element={<LibraryItemCopiesPage />}
          />
          <Route path="patrons" element={<Patrons />} />
          <Route path="patron">
            <Route path=":patron_id" element={<PatronPage />} />
          </Route>
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="check-in" element={<CheckInItem />} />
          <Route path="check-out" element={<CheckOutItem />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="reshelve" element={<ReshelveItemPage />} />
          <Route path="reshelve-new" element={<ReshelveItemsPageNew />} />
          <Route path="renewals" element={<RenewalsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="available" element={<MarkAvailablePage />} />
          <Route path="books">
            <Route path=":book_id" element={<BookPage />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
