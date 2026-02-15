import { data_service } from '../services/data_service';
import type { Image_Entity_Type } from '../types/others';

/**
 * Get the URL for an entity's image with optional cache buster
 * @param entity_type - The type of entity (PATRON, LIBRARY_ITEM, BRANCH)
 * @param entity_id - The ID of the entity
 * @param image_id - The image ID from the IMAGES table (if undefined, returns undefined)
 * @param cache_buster - Optional timestamp to force browser to refetch the image
 * @returns The image URL or undefined if no image exists
 */
export const get_entity_image_url = (
  entity_type: Image_Entity_Type,
  entity_id: number,
  image_id?: number | null,
  cache_buster?: number,
): string | undefined => {
  if (!image_id) return undefined;

  const base_url = data_service.get_image_url(entity_type, entity_id);
  return cache_buster ? `${base_url}?v=${cache_buster}` : base_url;
};
