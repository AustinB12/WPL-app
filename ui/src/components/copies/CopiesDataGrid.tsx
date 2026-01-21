import { Delete, Edit } from '@mui/icons-material';
import { Stack } from '@mui/material';
import {
  GridActionsCellItem,
  type GridColDef,
  type GridRowId,
  type GridRowParams,
} from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useBranchesContext,
  useSelectedBranch,
} from '../../hooks/use_branch_hooks';
import {
  useCopies,
  useDeleteCopy,
  useUpdateCopy,
} from '../../hooks/use_copies';
import { useSnackbar } from '../../hooks/use_snackbar';
import type { Item_Copy, Item_Copy_Result } from '../../types/item_types';
import { BaseDataGrid } from '../common/BaseDataGrid';
import { Genre_Chip } from '../common/GenreChip';
import ItemTypeChip from '../library_items/ItemTypeChip';
import { DeleteCopyModal } from './DeleteCopyModal';
import { type Edit_Copy_Form_Data, EditCopyModal } from './EditCopyModal';
import { ItemCopyConditionChip } from './ItemCopyConditionChip';
import { ItemCopyStatusChip } from './ItemCopyStatusChip';

export const CopiesDataGrid = ({
  on_copy_selected,
  just_available = false,
  hidden_columns = [
    'created_at',
    'updated_at',
    'branch_id',
    'description',
    'publication_year',
    'owning_branch_id',
    'owning_branch_name',
    'current_branch_id',
    'current_branch_name',
  ],
  filter,
}: {
  on_copy_selected?: (copy_id: Item_Copy) => void;
  just_available?: boolean;
  hidden_columns?: string[];
  filter?: string;
}) => {
  const { branches } = useBranchesContext();
  const { selected_branch } = useSelectedBranch();
  const {
    data: copies,
    isLoading: loading,
    refetch,
    isRefetching: refetching,
  } = useCopies(selected_branch?.id || 1);
  const nav = useNavigate();
  const { show_snackbar } = useSnackbar();

  const update_copy_mutation = useUpdateCopy({
    onSuccess: () => {
      set_edit_dialog_open(false);
      set_copy_to_edit(null);
      show_snackbar({
        message: 'Copy updated successfully!',
        severity: 'success',
      });
    },
    onError: (error) => {
      console.error('Failed to update copy:', error);
      show_snackbar({
        title: 'Failed to update copy',
        message: error.message,
        severity: 'error',
      });
    },
  });

  const delete_copy_mutation = useDeleteCopy({
    onSuccess: () => {
      set_delete_dialog_open(false);
      set_copy_to_delete(null);
      show_snackbar({
        title: 'Success!',
        message: 'Copy deleted successfully!',
        severity: 'success',
      });
    },
    onError: (error) => {
      console.error('Failed to delete copy:', error);
      show_snackbar({
        title: 'Failed to delete copy',
        message: error.message,
        severity: 'error',
      });
    },
  });

  // Delete dialog state
  const [delete_dialog_open, set_delete_dialog_open] = useState(false);
  const [copy_to_delete, set_copy_to_delete] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Edit dialog state
  const [edit_dialog_open, set_edit_dialog_open] = useState(false);
  const [copy_to_edit, set_copy_to_edit] = useState<Item_Copy_Result | null>(
    null,
  );

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
      flex: 1,
      minWidth: 200,
      editable: false,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      editable: false,
    },
    {
      field: 'item_type',
      headerName: 'Type',
      width: 150,
      editable: false,
      renderCell: (params) => <ItemTypeChip item_type={params.value} />,
    },
    {
      field: 'publication_year',
      headerName: 'Pub. Year',
      width: 100,
      editable: false,
    },
    {
      field: 'genre',
      headerName: 'Genre',
      width: 120,
      editable: false,
      valueGetter: (_, row) => {
        if (row.item_type === 'BOOK') {
          return row.book_genre;
        }
        if (row.item_type === 'VIDEO') {
          return row.video_genre;
        }
        if (row.item_type === 'AUDIOBOOK') {
          return row.audiobook_genre;
        }
        if (row.item_type === 'VINYL_ALBUM') {
          return row.vinyl_genre;
        }
        if (row.item_type === 'CD') {
          return row.cd_genre;
        }
        if (row.item_type === 'PERIODICAL') {
          return row.periodical_genre;
        }
        if (row.item_type === 'MAGAZINE') {
          return row.magazine_genre;
        }
        return null;
      },
      flex: 1,
      renderCell: (params) => {
        if (params.value) {
          const x = JSON.parse(params.value);
          return (
            <Stack
              spacing={1}
              direction={'row'}
              alignItems={'center'}
              height='100%'
            >
              {x.map((genre: string) => (
                <Genre_Chip key={genre} genre={genre} />
              ))}
            </Stack>
          );
        }
        return null;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 125,
      editable: false,
      renderCell: (params) => <ItemCopyStatusChip status={params.value} />,
      filterable: true,
    },
    {
      field: 'condition',
      headerName: 'Condition',
      width: 125,
      editable: false,
      renderCell: (params) => (
        <ItemCopyConditionChip condition={params.value} />
      ),
    },
    {
      field: 'cost',
      headerName: 'Price',
      width: 100,
      editable: false,
      type: 'number',
      valueFormatter: (value) =>
        '$' + (value as number).toFixed(2).toString() || 'N/A',
    },
    {
      field: 'owning_branch_name',
      headerName: 'Owning Branch',
      width: 250,
      editable: false,
    },
    {
      field: 'owning_branch_id',
      headerName: 'Owning Branch ID',
      width: 90,
      editable: false,
      type: 'number',
    },
    {
      field: 'current_branch_id',
      headerName: 'Current Branch ID',
      width: 90,
      editable: false,
      type: 'number',
    },
    {
      field: 'current_branch_name',
      headerName: 'Current Location',
      width: 250,
      editable: false,
      type: 'string',
    },
    {
      field: 'actions',
      type: 'actions',
      width: 60,
      getActions: (params) => [
        <GridActionsCellItem
          key='delete'
          icon={<Delete />}
          label='Delete'
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            delete_copy(params.id);
          }}
          showInMenu
        />,
        <GridActionsCellItem
          key='edit'
          icon={<Edit />}
          label='Edit'
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            edit_copy(params.id);
          }}
          showInMenu
        />,
      ],
    },
    {
      field: 'updated_at',
      headerName: 'Last Updated',
      width: 180,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleString() : '-',
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleString() : '-',
    },
  ];

  const delete_copy = (id: GridRowId) => {
    const copy = copies?.find((c) => c.id === id);
    if (copy) {
      set_copy_to_delete(copy as unknown as Record<string, unknown>);
      set_delete_dialog_open(true);
    }
  };

  const confirm_delete = () => {
    if (copy_to_delete) {
      delete_copy_mutation.mutate(copy_to_delete.id as number);
    }
  };

  const edit_copy = (id: GridRowId) => {
    const copy = copies?.find((c) => c.id === id);
    if (copy) {
      set_copy_to_edit(copy);
      set_edit_dialog_open(true);
    }
  };

  const handle_save_copy = (copy_data: Edit_Copy_Form_Data) => {
    if (copy_to_edit) {
      update_copy_mutation.mutate({
        copy_id: copy_to_edit.id as number,
        copy_data,
      });
    }
  };

  const filtered_copies = useMemo(() => {
    if (!filter) return copies;
    return copies?.filter((copy) =>
      Object.values(copy).some((value) =>
        String(value).toLowerCase().includes(filter.toLowerCase()),
      ),
    );
  }, [copies, filter]);
  return (
    <>
      <BaseDataGrid
        rows={filtered_copies}
        columns={columns}
        loading={loading || refetching}
        hidden_columns={hidden_columns}
        initialState={{
          filter: {
            filterModel: {
              items: just_available
                ? [
                    {
                      field: 'status',
                      operator: 'contains',
                      value: 'Available',
                      id: 1,
                    },
                  ]
                : [],
            },
          },
        }}
        label='Copies'
        isRowSelectable={(params: GridRowParams) =>
          params.row.status === 'Available'
        }
        onRowSelectionModelChange={(newSelection) => {
          const selected_copy = Array.from(newSelection.ids)[0] || 0;
          if (selected_copy && copies && on_copy_selected) {
            on_copy_selected(
              copies.find((c) => c.id === selected_copy) as Item_Copy,
            );
          }
        }}
        onRowClick={(params: GridRowParams) => {
          nav(`/library-item-copy/${params.row.id}`);
        }}
        refetch={refetch}
      />
      {/* Delete Copy Modal */}
      <DeleteCopyModal
        open={delete_dialog_open}
        copy={copy_to_delete}
        on_close={() => set_delete_dialog_open(false)}
        on_confirm={confirm_delete}
        is_loading={delete_copy_mutation.isPending}
      />

      {/* Edit Copy Modal */}
      <EditCopyModal
        open={edit_dialog_open}
        copy={copy_to_edit}
        branches={branches}
        on_close={() => set_edit_dialog_open(false)}
        on_save={handle_save_copy}
        is_loading={update_copy_mutation.isPending}
      />
    </>
  );
};
