import { GlobalStyles, useTheme } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { GlobalSnackbar } from "./components/common/GlobalSnackbar";
import { Layout } from "./components/common/Layout";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import { BranchPage } from "./pages/BranchPage";
import { CheckInNew } from "./pages/CheckInNew";
import { CheckOutItem } from "./pages/CheckOutItem";
import { Library_Item_Page } from "./pages/LibraryItemPage";
import { LibraryItemsPage } from "./pages/LibraryItemsPage";
import { PatronPage } from "./pages/PatronPage";
import { Patrons } from "./pages/Patrons";
import { RenewItem } from "./pages/RenewItem";
import { SearchPage } from "./pages/SearchPage";
import { Library_Item_Copy_Page } from "./pages/LibraryItemCopyPage";
import { Full_Page_Loading } from "./components/common/Full_Page_Loading";
import { HomePage } from "./pages/HomePage";

const BranchesPage = lazy(() =>
	import("./pages/BranchesPage").then((module) => ({
		default: module.BranchesPage
	}))
);

const SettingsPage = lazy(() =>
	import("./pages/SettingsPage").then((module) => ({
		default: module.SettingsPage
	}))
);
const RenewalsPage = lazy(() =>
	import("./pages/RenewalsPage").then((module) => ({
		default: module.RenewalsPage
	}))
);
const MarkAvailablePage = lazy(() =>
	import("./pages/MarkAvailablePage").then((module) => ({
		default: module.MarkAvailablePage
	}))
);
const ReservationsPage = lazy(() =>
	import("./pages/ReservationsPage").then((module) => ({
		default: module.ReservationsPage
	}))
);
const ReshelveItemsPageNew = lazy(() =>
	import("./pages/ReshelveItemsPageNew").then((module) => ({
		default: module.ReshelveItemsPageNew
	}))
);
const LibraryItemCopiesPage = lazy(() =>
	import("./pages/LibraryItemCopiesPage").then((module) => ({
		default: module.LibraryItemCopiesPage
	}))
);
const TransactionsPage = lazy(() =>
	import("./pages/TransactionsPage").then((module) => ({
		default: module.TransactionsPage
	}))
);
const DashboardPage = lazy(() =>
	import("./pages/DashboardPage").then((module) => ({
		default: module.DashboardPage
	}))
);

const queryClient = new QueryClient();

function App() {
	const t = useTheme();
	return (
		<Suspense fallback={<Full_Page_Loading />}>
			<QueryClientProvider client={queryClient}>
				<SnackbarProvider>
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<GlobalStyles
							styles={{
								"*::-webkit-scrollbar": {
									width: "8px"
								},
								"*::-webkit-scrollbar-track": {
									background:
										t.palette.mode === "dark"
											? "#202020ff !important"
											: "#f0f0f0"
								},
								"*::-webkit-scrollbar-thumb": {
									background:
										t.palette.mode === "dark"
											? t.palette.grey[600]
											: t.palette.grey[400],
									borderRadius: "600px"
								}
							}}
						/>
						<Routes>
							<Route path="/" element={<Layout />}>
								<Route index element={<HomePage />} />
								<Route path="library-items" element={<LibraryItemsPage />} />
								<Route path="library-item">
									<Route
										path=":library_item_id"
										element={<Library_Item_Page />}
									/>
									change
								</Route>
								<Route
									path="library-item-copies"
									element={<LibraryItemCopiesPage />}
								/>
								<Route path="library-item-copy">
									<Route
										path=":library_item_copy_id"
										element={<Library_Item_Copy_Page />}
									/>
								</Route>
								<Route path="patrons" element={<Patrons />} />
								<Route path="patron">
									<Route path=":patron_id" element={<PatronPage />} />
								</Route>
								<Route path="transactions" element={<TransactionsPage />} />
								<Route path="branches" element={<BranchesPage />} />
								<Route path="branch">
									<Route path=":branch_id" element={<BranchPage />} />
								</Route>
								<Route path="reservations" element={<ReservationsPage />} />
								<Route path="dashboard" element={<DashboardPage />} />
								<Route path="search" element={<SearchPage />} />
								<Route path="renew" element={<RenewItem />} />
								<Route path="check-in" element={<CheckInNew />} />
								<Route path="check-out" element={<CheckOutItem />} />
								<Route path="reshelve-new" element={<ReshelveItemsPageNew />} />
								<Route path="renewals" element={<RenewalsPage />} />
								<Route path="settings" element={<SettingsPage />} />
								<Route path="available" element={<MarkAvailablePage />} />
								<Route path="reserve" element={<ReservationsPage />} />
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
