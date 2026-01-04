import { SsidChart } from "@mui/icons-material";
import { PageContainer, PageTitle } from "../components/common/PageBuilders";
import { TransactionsDataGrid } from "../components/transactions/TransactionsDataGrid";

export const TransactionsPage = () => {
	return (
		<PageContainer width="xl">
			<PageTitle title="Check In/Out Transactions" Icon_Component={SsidChart} />
			<TransactionsDataGrid hidden_columns={["notes"]} />
		</PageContainer>
	);
};
