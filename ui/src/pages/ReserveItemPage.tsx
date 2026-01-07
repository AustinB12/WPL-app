import { EventNote } from "@mui/icons-material";
import { PageContainer, PageTitle } from "../components/common/PageBuilders";
import { BaseDataGrid } from "../components/common/BaseDataGrid";
import type { GridColDef } from "@mui/x-data-grid";
import { useReservations } from "../hooks/useReservations";
import { Button } from "@mui/material";

export const ReserveItemPage = () => {
	return (
		<PageContainer width="xl">
			<PageTitle title="Reserve Item" Icon_Component={EventNote} />
			<ReserveItemGrid />
		</PageContainer>
	);
};

const cols: GridColDef[] = [
	{
		field: "id",
		headerName: "ID"
	},
	{
		field: "patron_id",
		headerName: "P-ID"
	}
];

const ReserveItemGrid = () => {
	const { data } = useReservations(); // change to checked out  items
	return (
		<>
			<Button
				onClick={() => console.log(data)}
				variant="contained"
				color="primary"
				sx={{ mb: 2 }}
			>
				log
			</Button>
			<BaseDataGrid
				columns={cols}
				rows={data || []}
				label="Checked Out Items"
			></BaseDataGrid>
		</>
	);
};
