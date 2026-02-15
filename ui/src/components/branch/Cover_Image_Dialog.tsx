import { CloudUpload } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { type FC, useRef, useState } from 'react';
import { useUpsertImage } from '../../hooks/use_images';
import { useSnackbar } from '../../hooks/use_snackbar';
import type { Image_Mime_Type } from '../../types/others';

export interface Cover_Image_Dialog_Props {
  open: boolean;
  branch_id: number;
  current_image_url?: string;
  on_close: () => void;
  on_success: () => void;
}

export const Cover_Image_Dialog: FC<Cover_Image_Dialog_Props> = ({
  open,
  branch_id,
  current_image_url,
  on_close,
  on_success,
}) => {
  const { show_snackbar } = useSnackbar();
  const file_input_ref = useRef<HTMLInputElement>(null);
  const [preview_url, set_preview_url] = useState<string | null>(null);
  const [selected_file, set_selected_file] = useState<File | null>(null);

  const { mutate: upsert_image, isPending: is_uploading } = useUpsertImage({
    onSuccess: () => {
      show_snackbar({
        message: 'Cover image updated successfully!',
        severity: 'success',
        title: 'Success!',
      });
      handle_close();
      on_success();
    },
    onError: (error) => {
      show_snackbar({
        title: 'Failed to upload image',
        message: error.message,
        severity: 'error',
      });
    },
  });

  const handle_close = () => {
    set_preview_url(null);
    set_selected_file(null);
    on_close();
  };

  const handle_file_select = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const valid_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!valid_types.includes(file.type)) {
      show_snackbar({
        title: 'Invalid file type',
        message: 'Please select a JPEG, PNG, GIF, or WebP image.',
        severity: 'error',
      });
      return;
    }

    // Validate file size (max 5MB)
    const max_size = 5 * 1024 * 1024;
    if (file.size > max_size) {
      console.log('File size:', file.size, max_size);

      show_snackbar({
        title: 'File too large',
        message: 'Please select an image smaller than 5MB.',
        severity: 'error',
      });
      return;
    }

    set_selected_file(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      set_preview_url(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handle_upload = async () => {
    if (!selected_file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64_data = (e.target?.result as string).split(',')[1]; // Remove data:image/...;base64, prefix

      upsert_image({
        entity_type: 'BRANCH',
        entity_id: branch_id,
        image_data: base64_data,
        mime_type: selected_file.type as Image_Mime_Type,
        file_name: selected_file.name,
      });
    };
    reader.readAsDataURL(selected_file);
  };

  const display_image = preview_url || current_image_url;

  return (
    <Dialog open={open} onClose={handle_close} maxWidth='sm' fullWidth>
      <DialogTitle>Update Branch Cover Image</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Image Preview */}
          <Box
            sx={{
              width: '100%',
              height: 200,
              bgcolor: 'grey.100',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px dashed',
              borderColor: 'grey.300',
            }}
          >
            {display_image ? (
              <Box
                component='img'
                src={display_image}
                alt='Cover preview'
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Stack alignItems='center' spacing={1}>
                <CloudUpload sx={{ fontSize: 48, color: 'grey.400' }} />
                <Typography variant='body2' color='text.secondary'>
                  No image selected
                </Typography>
              </Stack>
            )}
          </Box>

          {/* File Input */}
          <input
            ref={file_input_ref}
            type='file'
            accept='image/jpeg,image/png,image/gif,image/webp'
            style={{ display: 'none' }}
            onChange={handle_file_select}
          />

          <Button
            variant='outlined'
            startIcon={<CloudUpload />}
            onClick={() => file_input_ref.current?.click()}
            disabled={is_uploading}
            fullWidth
          >
            {selected_file ? 'Choose Different Image' : 'Select Image'}
          </Button>

          {selected_file && (
            <Typography variant='caption' color='text.secondary'>
              Selected: {selected_file.name} (
              {(selected_file.size / 1024).toFixed(1)} KB /{' '}
              {(selected_file.size / (1024 * 1024)).toFixed(1)} MB)
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handle_close} disabled={is_uploading}>
          Cancel
        </Button>
        <Button
          onClick={handle_upload}
          variant='contained'
          disabled={is_uploading || !selected_file}
          startIcon={
            is_uploading ? <CircularProgress size={20} /> : <CloudUpload />
          }
        >
          {is_uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
