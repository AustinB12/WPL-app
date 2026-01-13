import { GlobalStyles, useTheme } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Global_Snackbar } from './components/common/GlobalSnackbar';
import { Layout } from './components/common/Layout';
import { SnackbarProvider } from './contexts/Snackbar_Context';
import { Full_Page_Loading } from './pages/Full_Page_Loading/Full_Page_Loading';

const Home_Page = lazy(() =>
  import('./pages/home_page').then((module) => ({
    default: module.HomePage,
  }))
);

const Library_Items_Page = lazy(() =>
  import('./pages/library_items_page').then((module) => ({
    default: module.LibraryItemsPage,
  }))
);

const Library_Item_Page = lazy(() =>
  import('./pages/library_item_page').then((module) => ({
    default: module.Library_Item_Page,
  }))
);

const Library_Item_Copy_Page = lazy(() =>
  import('./pages/library_item_copy_page').then((module) => ({
    default: module.Library_Item_Copy_Page,
  }))
);

const Patrons = lazy(() =>
  import('./pages/patrons_page').then((module) => ({
    default: module.Patrons,
  }))
);

const Patron_Page = lazy(() =>
  import('./pages/patron_page').then((module) => ({
    default: module.PatronPage,
  }))
);

const Branch_Page = lazy(() =>
  import('./pages/branch_page').then((module) => ({
    default: module.BranchPage,
  }))
);

const Search_Page = lazy(() =>
  import('./pages/search_page').then((module) => ({
    default: module.SearchPage,
  }))
);

const Renew_Item = lazy(() =>
  import('./pages/renew_item').then((module) => ({
    default: module.RenewItem,
  }))
);

const Check_In_Item = lazy(() =>
  import('./pages/check_in_item').then((module) => ({
    default: module.Check_In_Item,
  }))
);

const Check_Out_Item_Page = lazy(() =>
  import('./pages/check_out_item_page').then((module) => ({
    default: module.Check_Out_Item_Page,
  }))
);

const Reserve_Item_Page = lazy(() =>
  import('./pages/reserve_item_page').then((module) => ({
    default: module.ReserveItemPage,
  }))
);

const Branches_Page = lazy(() =>
  import('./pages/branches_page').then((module) => ({
    default: module.BranchesPage,
  }))
);

const Settings_Page = lazy(() =>
  import('./pages/settings_page').then((module) => ({
    default: module.SettingsPage,
  }))
);
const Renewals_Page = lazy(() =>
  import('./pages/renewals_page').then((module) => ({
    default: module.RenewalsPage,
  }))
);
const Reservations_Page = lazy(() =>
  import('./pages/reservations_page').then((module) => ({
    default: module.ReservationsPage,
  }))
);
const Library_Item_Copies_Page = lazy(() =>
  import('./pages/library_item_copies_page').then((module) => ({
    default: module.LibraryItemCopiesPage,
  }))
);
const Transactions_Page = lazy(() =>
  import('./pages/transactions_page').then((module) => ({
    default: module.TransactionsPage,
  }))
);
const Dashboard_Page = lazy(() =>
  import('./pages/dashboard_page').then((module) => ({
    default: module.DashboardPage,
  }))
);
const Reshelve_Items_Page = lazy(() =>
  import('./pages/reshelve_items_page').then((module) => ({
    default: module.Reshelve_Items_Page,
  }))
);

const Explore_Page = lazy(() =>
  import('./pages/explore_page').then((module) => ({
    default: module.Explore_Page,
  }))
);

const query_client = new QueryClient({
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
      <QueryClientProvider client={query_client}>
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
                <Route index element={<Home_Page />} />
                <Route path='library-items' element={<Library_Items_Page />} />
                <Route path='library-item'>
                  <Route
                    path=':library_item_id'
                    element={<Library_Item_Page />}
                  />
                  change
                </Route>
                <Route
                  path='library-item-copies'
                  element={<Library_Item_Copies_Page />}
                />
                <Route path='library-item-copy'>
                  <Route
                    path=':library_item_copy_id'
                    element={<Library_Item_Copy_Page />}
                  />
                </Route>
                <Route path='patrons' element={<Patrons />} />
                <Route path='patron'>
                  <Route path=':patron_id' element={<Patron_Page />} />
                </Route>
                <Route path='transactions' element={<Transactions_Page />} />
                <Route path='branches' element={<Branches_Page />} />
                <Route path='branch'>
                  <Route path=':branch_id' element={<Branch_Page />} />
                </Route>
                <Route path='reservations' element={<Reservations_Page />} />
                <Route path='dashboard' element={<Dashboard_Page />} />
                <Route path='search' element={<Search_Page />} />
                <Route path='renew' element={<Renew_Item />} />
                <Route path='check-in' element={<Check_In_Item />} />
                <Route path='check-out' element={<Check_Out_Item_Page />} />
                <Route path='reshelve' element={<Reshelve_Items_Page />} />
                <Route path='renewals' element={<Renewals_Page />} />
                <Route path='settings' element={<Settings_Page />} />
                <Route path='reserve' element={<Reserve_Item_Page />} />
                <Route path='dev' element={<Explore_Page />} />
              </Route>
            </Routes>
            <Global_Snackbar />
          </LocalizationProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
