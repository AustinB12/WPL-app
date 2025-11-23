import { useState, useEffect, type FC } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  type Library_Item,
  type Create_Library_Item_Form_Data,
  Library_Item_Type,
} from '../../types';
import { validate_required, validate_year } from '../../utils/validators';

interface Edit_Library_Item_Props {
  open: boolean;
  item: Library_Item | null;
  on_close: () => void;
  on_confirm: (item_id: number, data: Create_Library_Item_Form_Data) => void;
  is_loading?: boolean;
}

export const EditLibraryItem: FC<Edit_Library_Item_Props> = ({
  open,
  item,
  on_close,
  on_confirm,
  is_loading = false,
}) => {
  const [form_data, set_form_data] = useState<Create_Library_Item_Form_Data>({
    title: '',
    item_type: Library_Item_Type.Book,
    description: '',
    publication_year: undefined,
    congress_code: '',
  });

  const [errors, set_errors] = useState<Record<string, string>>({});

  // Populate form when item changes
  useEffect(() => {
    if (item) {
      set_form_data({
        title: item.title,
        item_type: item.item_type,
        description: item.description || '',
        publication_year: item.publication_year,
        congress_code: item.congress_code || '',
      });
      set_errors({});
    }
  }, [item]);

  const handle_input_change =
    (field: keyof Create_Library_Item_Form_Data) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      set_form_data((prev) => ({
        ...prev,
        [field]:
          field === 'publication_year'
            ? value
              ? parseInt(value)
              : undefined
            : value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        set_errors((prev) => {
          const new_errors = { ...prev };
          delete new_errors[field];
          return new_errors;
        });
      }
    };

  const handle_select_change = (
    event: SelectChangeEvent<Library_Item_Type>
  ) => {
    set_form_data((prev) => ({
      ...prev,
      item_type: event.target.value as Library_Item_Type,
    }));
  };

  const validate_form = (): boolean => {
    const new_errors: Record<string, string> = {};

    // Title is required
    if (!validate_required(form_data.title)) {
      new_errors.title = 'Title is required';
    }

    // Validate publication year if provided
    if (
      form_data.publication_year &&
      !validate_year(form_data.publication_year)
    ) {
      new_errors.publication_year = 'Invalid year';
    }

    set_errors(new_errors);
    return Object.keys(new_errors).length === 0;
  };

  const handle_submit = () => {
    if (validate_form() && item?.id) {
      on_confirm(item.id, form_data);
    }
  };

  const handle_close = () => {
    set_errors({});
    on_close();
  };

  return (
    <Dialog open={open} onClose={handle_close} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            Edit Library Item
          </Box>
          <IconButton onClick={handle_close} disabled={is_loading} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            value={form_data.title}
            onChange={handle_input_change('title')}
            error={Boolean(errors.title)}
            helperText={errors.title}
            required
            fullWidth
            disabled={is_loading}
          />

          <FormControl fullWidth required disabled={is_loading}>
            <InputLabel>Item Type</InputLabel>
            <Select
              value={form_data.item_type}
              onChange={handle_select_change}
              label="Item Type"
            >
              {Object.values(Library_Item_Type).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Description"
            value={form_data.description}
            onChange={handle_input_change('description')}
            multiline
            rows={3}
            fullWidth
            disabled={is_loading}
          />

          <TextField
            label="Publication Year"
            type="number"
            value={form_data.publication_year || ''}
            onChange={handle_input_change('publication_year')}
            error={Boolean(errors.publication_year)}
            helperText={errors.publication_year}
            fullWidth
            disabled={is_loading}
          />

          <TextField
            label="Congress Code"
            value={form_data.congress_code}
            onChange={handle_input_change('congress_code')}
            fullWidth
            disabled={is_loading}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handle_close} disabled={is_loading}>
          Cancel
        </Button>
        <Button
          onClick={handle_submit}
          variant="contained"
          disabled={is_loading || !item}
        >
          {is_loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
