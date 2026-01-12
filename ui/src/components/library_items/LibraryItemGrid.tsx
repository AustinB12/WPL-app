import { Delete, Edit, ReadMore } from '@mui/icons-material';
import { Box } from '@mui/material';
import {
  GridActionsCellItem,
  type GridColDef,
  type GridRowId,
} from '@mui/x-data-grid';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteLibraryItem,
  useLibraryItems,
  useUpdateLibraryItem,
} from '../../hooks/use_library_items';
import { useSnackbar } from '../../hooks/use_snackbar';
import {
  type Create_Library_Item_Form_Data,
  type Library_Item,
} from '../../types/item_types';
import { BaseDataGrid } from '../common/BaseDataGrid';
import { DeleteLibraryItem } from './DeleteLibraryItem';
import { EditLibraryItem } from './EditLibraryItem';
import ItemTypeChip from './ItemTypeChip';
import { LibraryItemDetails } from './LibraryItemDetails';

export const LibraryItemDataGrid = () => {
  const { show_snackbar } = useSnackbar();
  const [details_open, set_details_open] = useState(false);
  const [delete_dialog_open, set_delete_dialog_open] = useState(false);
  const [edit_dialog_open, set_edit_dialog_open] = useState(false);
  const [selected_item, set_selected_item] = useState<Library_Item | null>(
    null
  );
  const [item_to_delete, set_item_to_delete] = useState<Library_Item | null>(
    null
  );
  const [item_to_edit, set_item_to_edit] = useState<Library_Item | null>(null);
  const { data: rows, isLoading: loading, error } = useLibraryItems();
  const navigate = useNavigate();

  const delete_mutation = useDeleteLibraryItem({
    onSuccess: () => {
      set_delete_dialog_open(false);
      set_item_to_delete(null);
      show_snackbar({
        message: 'Library item deleted successfully',
        severity: 'success',
        title: 'Success',
      });
    },
    onError: (error) => {
      set_delete_dialog_open(false);
      show_snackbar({
        message: error.message,
        severity: 'error',
        title: 'Error',
      });
    },
  });

  const update_mutation = useUpdateLibraryItem({
    onSuccess: () => {
      set_edit_dialog_open(false);
      set_item_to_edit(null);
      show_snackbar({
        message: 'Library item updated successfully',
        severity: 'success',
        title: 'Success',
      });
    },
    onError: (error) => {
      show_snackbar({
        message: error.message,
        severity: 'error',
        title: 'Error',
      });
    },
  });

  // Show error snackbar for query errors
  if (error) {
    show_snackbar({
      message: error.message,
      severity: 'error',
      title: error.name || 'Error',
    });
  }

  const handle_item_selected = useCallback(
    (id: GridRowId) => {
      const item = rows?.find((row) => row.id === id);
      if (item) {
        set_selected_item(item);
        set_details_open(true);
      }
    },
    [rows]
  );

  const handle_delete_click = useCallback(
    (id: GridRowId) => {
      const item = rows?.find((row) => row.id === id);
      if (item) {
        set_item_to_delete(item);
        set_delete_dialog_open(true);
      }
    },
    [rows]
  );

  const handle_edit_click = useCallback(
    (id: GridRowId) => {
      const item = rows?.find((row) => row.id === id);
      if (item) {
        set_item_to_edit(item);
        set_edit_dialog_open(true);
      }
    },
    [rows]
  );

  const handle_delete_confirm = useCallback(
    (item_id: number) => {
      delete_mutation.mutate(item_id);
    },
    [delete_mutation]
  );

  const handle_edit_confirm = useCallback(
    (item_id: number, data: Create_Library_Item_Form_Data) => {
      update_mutation.mutate({ item_id, data });
    },
    [update_mutation]
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        width: 90,
        valueGetter: (value) => Number(value),
      },
      {
        field: 'title',
        headerName: 'Title',
        width: 150,
        editable: false,
        flex: 1,
      },
      {
        field: 'item_type',
        headerName: 'Type',
        width: 150,
        editable: false,
        renderCell: (params) => {
          return <ItemTypeChip item_type={params.value} />;
        },
      },
      {
        field: 'description',
        headerName: 'Description',
        width: 200,
        editable: false,
        flex: 1,
      },
      { field: 'total_copies', headerName: 'Copies', width: 90 },
      {
        field: 'publication_year',
        headerName: 'Publication Year',
        width: 130,
        editable: false,
      },
      {
        field: 'actions',
        type: 'actions',
        width: 150,
        getActions: (params) => [
          <GridActionsCellItem
            key='details'
            icon={<ReadMore />}
            label='Details'
            onClick={() => handle_item_selected(params.id)}
          />,
          <GridActionsCellItem
            key='edit'
            icon={<Edit />}
            label='Edit'
            onClick={() => handle_edit_click(params.id)}
          />,
          <GridActionsCellItem
            key='delete'
            icon={<Delete />}
            label='Delete'
            onClick={() => handle_delete_click(params.id)}
          />,
        ],
      },
    ],
    [handle_delete_click, handle_edit_click, handle_item_selected]
  );

  return (
    <>
      <Box sx={{ overflow: 'hidden', maxHeight: 1 }}>
        <BaseDataGrid
          label='Library Items'
          sx={{ height: 1 }}
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          onRowDoubleClick={(params) => {
            navigate(`/library-item/${params.id}`);
          }}
        />
      </Box>
      <LibraryItemDetails
        is_open={details_open}
        item={selected_item}
        onClose={() => set_details_open(false)}
      />
      <EditLibraryItem
        open={edit_dialog_open}
        item={item_to_edit}
        on_close={() => {
          set_edit_dialog_open(false);
          set_item_to_edit(null);
        }}
        on_confirm={handle_edit_confirm}
        is_loading={update_mutation.isPending}
      />
      <DeleteLibraryItem
        open={delete_dialog_open}
        item={item_to_delete}
        on_close={() => {
          set_delete_dialog_open(false);
          set_item_to_delete(null);
        }}
        on_confirm={handle_delete_confirm}
        is_loading={delete_mutation.isPending}
      />
    </>
  );
};
