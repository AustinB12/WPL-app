import { GlobalStyles, useTheme } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { GlobalSnackbar } from './components/common/GlobalSnackbar';
import { Layout } from './components/common/Layout';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { Full_Page_Loading } from './pages/Full_Page_Loading/Full_Page_Loading';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({
    default: module.HomePage,
  }))
);

const LibraryItemsPage = lazy(() =>
  import('./pages/LibraryItemsPage').then((module) => ({
    default: module.LibraryItemsPage,
  }))
);

const Library_Item_Page = lazy(() =>
  import('./pages/LibraryItemPage').then((module) => ({
    default: module.Library_Item_Page,
  }))
);

const Library_Item_Copy_Page = lazy(() =>
  import('./pages/LibraryItemCopyPage').then((module) => ({
    default: module.Library_Item_Copy_Page,
  }))
);

const Patrons = lazy(() =>
  import('./pages/Patrons').then((module) => ({
    default: module.Patrons,
  }))
);

const PatronPage = lazy(() =>
  import('./pages/PatronPage').then((module) => ({
    default: module.PatronPage,
  }))
);

const BranchPage = lazy(() =>
  import('./pages/BranchPage').then((module) => ({
    default: module.BranchPage,
  }))
);

const SearchPage = lazy(() =>
  import('./pages/SearchPage').then((module) => ({
    default: module.SearchPage,
  }))
);

const RenewItem = lazy(() =>
  import('./pages/RenewItem').then((module) => ({
    default: module.RenewItem,
  }))
);

const CheckInNew = lazy(() =>
  import('./pages/CheckInItem').then((module) => ({
    default: module.CheckInNew,
  }))
);

const CheckOutItem = lazy(() =>
  import('./pages/CheckOutItem').then((module) => ({
    default: module.CheckOutItem,
  }))
);

const ReserveItemPage = lazy(() =>
  import('./pages/ReserveItemPage').then((module) => ({
    default: module.ReserveItemPage,
  }))
);

const BranchesPage = lazy(() =>
  import('./pages/BranchesPage').then((module) => ({
    default: module.BranchesPage,
  }))
);

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
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
);
const CheckOutNewPage = lazy(() =>
  import('./pages/Check_Out_New_Page').then((module) => ({
    default: module.Check_Out_New_Page,
  }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const t = useTheme();
  return (
    <Suspense fallback={<Full_Page_Loading />}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <GlobalStyles
              styles={{
                '*::-webkit-scrollbar': {
                  width: '8px',
                },
                '*::-webkit-scrollbar-track': {
                  background:
                    t.palette.mode === 'dark'
                      ? '#202020ff !important'
                      : '#f0f0f0',
                },
                '*::-webkit-scrollbar-thumb': {
                  background:
                    t.palette.mode === 'dark'
                      ? t.palette.grey[600]
                      : t.palette.grey[400],
                  borderRadius: '600px',
                },
              }}
            />
            <Routes>
              <Route path='/' element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path='library-items' element={<LibraryItemsPage />} />
                <Route path='library-item'>
                  <Route
                    path=':library_item_id'
                    element={<Library_Item_Page />}
                  />
                  change
                </Route>
                <Route
                  path='library-item-copies'
                  element={<LibraryItemCopiesPage />}
                />
                <Route path='library-item-copy'>
                  <Route
                    path=':library_item_copy_id'
                    element={<Library_Item_Copy_Page />}
                  />
                </Route>
                <Route path='patrons' element={<Patrons />} />
                <Route path='patron'>
                  <Route path=':patron_id' element={<PatronPage />} />
                </Route>
                <Route path='transactions' element={<TransactionsPage />} />
                <Route path='branches' element={<BranchesPage />} />
                <Route path='branch'>
                  <Route path=':branch_id' element={<BranchPage />} />
                </Route>
                <Route path='reservations' element={<ReservationsPage />} />
                <Route path='dashboard' element={<DashboardPage />} />
                <Route path='search' element={<SearchPage />} />
                <Route path='renew' element={<RenewItem />} />
                <Route path='check-in' element={<CheckInNew />} />
                <Route path='check-out' element={<CheckOutItem />} />
                <Route path='check-out-new' element={<CheckOutNewPage />} />
                <Route path='reshelve-new' element={<ReshelveItemsPageNew />} />
                <Route path='renewals' element={<RenewalsPage />} />
                <Route path='settings' element={<SettingsPage />} />
                <Route path='available' element={<MarkAvailablePage />} />
                <Route path='reserve' element={<ReserveItemPage />} />
              </Route>
            </Routes>
            <GlobalSnackbar />
          </LocalizationProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
