import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data_service } from '../services/data_service';
import type {
  Image_Entity_Type,
  Create_Image_Data,
  Update_Image_Data,
} from '../types/others';

// Query key factory for images
const imageKeys = {
  all: ['images'] as const,
  lists: () => [...imageKeys.all, 'list'] as const,
  list: (entity_type?: Image_Entity_Type) =>
    [...imageKeys.lists(), entity_type] as const,
  details: () => [...imageKeys.all, 'detail'] as const,
  detail: (entity_type: Image_Entity_Type, entity_id: number) =>
    [...imageKeys.details(), entity_type, entity_id] as const,
};

/**
 * Hook to fetch all images metadata (optionally filtered by entity type)
 */
export const useAllImages = (entity_type?: Image_Entity_Type) => {
  return useQuery({
    queryKey: imageKeys.list(entity_type),
    queryFn: () => data_service.get_all_images(entity_type),
  });
};

/**
 * Hook to fetch a single image by entity type and ID
 */
export const useImage = (
  entity_type: Image_Entity_Type,
  entity_id: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: imageKeys.detail(entity_type, entity_id),
    queryFn: () => data_service.get_image(entity_type, entity_id),
    enabled: options?.enabled !== false && entity_id > 0,
  });
};

/**
 * Hook to get image URL for use in <img> tags
 */
export const useImageUrl = (
  entity_type: Image_Entity_Type,
  entity_id: number,
) => {
  return data_service.get_image_url(entity_type, entity_id);
};

/**
 * Hook to create a new image
 */
export const useCreateImage = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: (image_data: Create_Image_Data) =>
      data_service.create_image(image_data),
    onSuccess: (_data, variables) => {
      // Invalidate the specific entity's image cache
      query_client.invalidateQueries({
        queryKey: imageKeys.detail(variables.entity_type, variables.entity_id),
      });
      // Invalidate the list caches
      query_client.invalidateQueries({ queryKey: imageKeys.lists() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * Hook to update an existing image
 */
export const useUpdateImage = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: ({
      entity_type,
      entity_id,
      image_data,
    }: {
      entity_type: Image_Entity_Type;
      entity_id: number;
      image_data: Update_Image_Data;
    }) => data_service.update_image(entity_type, entity_id, image_data),
    onSuccess: (_data, variables) => {
      // Invalidate the specific entity's image cache
      query_client.invalidateQueries({
        queryKey: imageKeys.detail(variables.entity_type, variables.entity_id),
      });
      // Invalidate the list caches
      query_client.invalidateQueries({ queryKey: imageKeys.lists() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * Hook to delete an image
 */
export const useDeleteImage = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: ({
      entity_type,
      entity_id,
    }: {
      entity_type: Image_Entity_Type;
      entity_id: number;
    }) => data_service.delete_image(entity_type, entity_id),
    onSuccess: (_data, variables) => {
      // Remove the specific entity's image from cache
      query_client.removeQueries({
        queryKey: imageKeys.detail(variables.entity_type, variables.entity_id),
      });
      // Invalidate the list caches
      query_client.invalidateQueries({ queryKey: imageKeys.lists() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};

/**
 * Hook to create or update an image (upsert)
 * Tries to create first, falls back to update if image already exists
 */
export const useUpsertImage = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const query_client = useQueryClient();

  return useMutation({
    mutationFn: async (image_data: Create_Image_Data) => {
      try {
        return await data_service.create_image(image_data);
      } catch (error: unknown) {
        // If image already exists (409 conflict), update instead
        if (error instanceof Error && error.message.includes('existing')) {
          return await data_service.update_image(
            image_data.entity_type,
            image_data.entity_id,
            {
              image_data: image_data.image_data,
              mime_type: image_data.mime_type,
              file_name: image_data.file_name,
            },
          );
        }
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      // Invalidate the specific entity's image cache
      query_client.invalidateQueries({
        queryKey: imageKeys.detail(variables.entity_type, variables.entity_id),
      });
      // Invalidate image list caches
      query_client.invalidateQueries({ queryKey: imageKeys.lists() });
      // If uploading a BRANCH image, also invalidate branch queries so the list refreshes
      if (variables.entity_type === 'BRANCH') {
        query_client.invalidateQueries({ queryKey: ['branch'] });
        query_client.invalidateQueries({ queryKey: ['branches'] });
      }
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
