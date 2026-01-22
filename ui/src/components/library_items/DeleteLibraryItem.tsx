import { Delete } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from '@mui/material';
import type { FC } from 'react';
import type { Library_Item } from '../../types/item_types';
import Item_Type_Chip from './ItemTypeChip';

interface Delete_Library_Item_Props {
  open: boolean;
  item: Library_Item | null;
  on_close: () => void;
  on_confirm: (item_id: number) => void;
  is_loading?: boolean;
}

export const DeleteLibraryItem: FC<Delete_Library_Item_Props> = ({
  open,
  item,
  on_close,
  on_confirm,
  is_loading = false,
}) => {
  const handle_confirm = () => {
    if (item?.id) {
      on_confirm(item.id);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={on_close}
      maxWidth='sm'
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 3 },
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete />
          Delete Library Item
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity='warning' sx={{ mb: 2, borderRadius: 2 }}>
          This action cannot be undone. All copies and records will also be
          deleted.
        </Alert>

        {item && (
          <Box>
            <Typography variant='body1' gutterBottom>
              Are you sure you want to delete the following item?
            </Typography>

            <Paper
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
              }}
            >
              <Typography variant='subtitle2' color='text.secondary'>
                Title
              </Typography>
              <Typography variant='body1' gutterBottom>
                {item.title}
              </Typography>

              <Typography
                variant='subtitle2'
                color='text.secondary'
                sx={{ mt: 1 }}
              >
                Type
              </Typography>
              <Typography variant='body1' gutterBottom>
                <Item_Type_Chip item_type={item.item_type} />
              </Typography>

              {item.description && (
                <>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    Description
                  </Typography>
                  <Typography variant='body1'>{item.description}</Typography>
                </>
              )}
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={on_close} disabled={is_loading} color='inherit'>
          Cancel
        </Button>
        <Button
          onClick={handle_confirm}
          variant='contained'
          color='error'
          disabled={is_loading || !item}
        >
          {is_loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
