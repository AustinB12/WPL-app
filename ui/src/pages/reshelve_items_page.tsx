import { Fab } from '@mui/material';
import { type GridColDef } from '@mui/x-data-grid';
import { BaseDataGrid } from '../components/common/BaseDataGrid';
import { PageContainer, Page_Title } from '../components/common/PageBuilders';
import { Item_Copy_Condition_Chip } from '../components/copies/ItemCopyConditionChip';
import { ItemCopyStatusChip } from '../components/copies/ItemCopyStatusChip';
import Item_Type_Chip from '../components/library_items/ItemTypeChip';
import { useBranchContext } from '../contexts/Branch_Context';
import { useReshelveItems } from '../hooks/use_reshelve_items';
import { CheckCircle } from '@mui/icons-material';

// Constants
const HIDDEN_COLUMNS = ['owning_branch_id'];
const RESHELVE_BUTTON_BOTTOM_OFFSET = 72;
const RESHELVE_ALL_BUTTON_BOTTOM_OFFSET = 16;
const BUTTON_RIGHT_OFFSET = 16;

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    valueGetter: (value) => Number(value),
  },
  {
    field: 'title',
    headerName: 'Title',
    width: 250,
    editable: false,
  },
  {
    field: 'owning_branch_id',
    headerName: 'Branch ID',
    width: 100,
    editable: false,
  },
  {
    field: 'item_type',
    headerName: 'Type',
    width: 150,
    editable: false,
    renderCell: (params) => <Item_Type_Chip item_type={params.value} />,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 125,
    editable: false,
    renderCell: (params) => <ItemCopyStatusChip status={params.value} />,
  },
  {
    field: 'condition',
    headerName: 'Condition',
    width: 125,
    editable: false,
    renderCell: (params) => (
      <Item_Copy_Condition_Chip condition={params.value} />
    ),
  },
  { field: 'notes', headerName: 'Notes', width: 250, editable: false },
];

export const Reshelve_Items_Page = () => {
  const { selected_branch } = useBranchContext();
  const {
    data,
    selected_row,
    something_loading,
    refetch,
    handle_row_selection_change,
    handle_reshelve_single,
    handle_reshelve_all,
  } = useReshelveItems(selected_branch?.id || 1);

  const has_selected_item = selected_row.ids.size > 0;
  const has_items = data.length > 0;
  const can_reshelve_single = has_selected_item && !something_loading;
  const can_reshelve_all = has_items && !something_loading;
  const grid_label = 'Unshelved Items';

  return (
    <PageContainer>
      <Page_Title title={'Reshelve Items'} Icon_Component={CheckCircle} />
      <BaseDataGrid
        rows={data}
        getRowId={(row) => row.id}
        columns={columns}
        hidden_columns={HIDDEN_COLUMNS}
        loading={something_loading}
        refetch={refetch}
        onRowSelectionModelChange={handle_row_selection_change}
        rowSelectionModel={selected_row}
        label={grid_label}
      />

      <Fab
        color='primary'
        aria-label='Reshelve Selected Item'
        disabled={!can_reshelve_single}
        onClick={handle_reshelve_single}
        variant='extended'
        sx={{
          position: 'absolute',
          bottom: RESHELVE_BUTTON_BOTTOM_OFFSET,
          right: BUTTON_RIGHT_OFFSET,
        }}
      >
        RESHELVE
      </Fab>
      <Fab
        color='secondary'
        aria-label='Reshelve All Unshelved Items'
        disabled={!can_reshelve_all}
        onClick={handle_reshelve_all}
        variant='extended'
        sx={{
          position: 'absolute',
          bottom: RESHELVE_ALL_BUTTON_BOTTOM_OFFSET,
          right: BUTTON_RIGHT_OFFSET,
        }}
      >
        RESHELVE ALL
      </Fab>
    </PageContainer>
  );
};
