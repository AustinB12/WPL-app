import { Delete } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import type {
  Item_Condition,
  Library_Copy_Status,
  Library_Item_Type,
} from '../../types';
import ItemTypeChip from '../library_items/ItemTypeChip';
import { ItemCopyConditionChip } from './ItemCopyConditionChip';
import { ItemCopyStatusChip } from './ItemCopyStatusChip';

interface Delete_Copy_Modal_Props {
  open: boolean;
  copy: Record<string, unknown> | null;
  on_close: () => void;
  on_confirm: () => void;
  is_loading?: boolean;
}

export const DeleteCopyModal = ({
  open,
  copy,
  on_close,
  on_confirm,
  is_loading = false,
}: Delete_Copy_Modal_Props) => {
  return (
    <Dialog
      open={open}
      onClose={on_close}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction={'row'} alignItems={'center'} gap={1.5}>
          <Stack
            direction={'row'}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
            }}
          >
            <Delete fontSize="large" />
          </Stack>
          <Typography variant="h6" component="div">
            Delete Copy
          </Typography>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Are you sure you want to delete this copy? This action cannot be
          undone.
        </Alert>

        {copy && (
          <Box
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 2,
              p: 2.5,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Title
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {String(copy.title || copy.title || 'N/A')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Copy ID
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  #{String(copy.id)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Price
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  ${String((copy.cost as number)?.toFixed(2) || 'N/A')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Branch
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {String(copy?.branch_name || 'N/A')}
                </Typography>
              </Grid>

              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Item Type
                </Typography>
                <ItemTypeChip item_type={copy.item_type as Library_Item_Type} />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Status
                </Typography>
                <ItemCopyStatusChip
                  status={copy.status as Library_Copy_Status}
                />
              </Grid>

              <Grid size={{ xs: 4 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
                  Condition
                </Typography>
                <ItemCopyConditionChip
                  condition={(copy.condition as Item_Condition) || 'Good'}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          color="inherit"
          onClick={on_close}
          disabled={is_loading}
          size="large"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={on_confirm}
          color="error"
          variant="contained"
          disabled={is_loading}
          size="large"
          sx={{ minWidth: 100 }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
