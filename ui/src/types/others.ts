import type { Library_Item_Type } from './item_types';

export interface Branch {
  id: number;
  branch_name: string;
  address: string;
  phone: string;
  is_main: boolean;
  cover_image?: string;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
  image_id?: number;
}

export interface Branch_Result extends Branch {
  patron_count: number;
  item_copy_count_total: number;
  item_copy_count_active: number;
  item_copy_count_checked_out: number;
  item_copy_count_reserved: number;
  item_copy_count_unshelved: number;
  item_copy_count_overdue: number;
}

//! == SNACKBAR TYPES == //

export interface Snackbar_Options {
  message: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
  variant?: 'filled' | 'outlined' | 'standard';
  title?: string;
  duration?: number;
}

export interface Snackbar_State extends Snackbar_Options {
  open: boolean;
}

export interface Loan_Duration {
  id: number;
  name: Library_Item_Type;
  duration: number;
}

//! == IMAGE TYPES == //
// Image types
export type Image_Entity_Type = 'PATRON' | 'LIBRARY_ITEM' | 'BRANCH';
export type Image_Mime_Type =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

export interface Image_Metadata {
  id: number;
  entity_type: Image_Entity_Type;
  entity_id: number;
  mime_type: Image_Mime_Type;
  file_name: string | null;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface Image_Data extends Image_Metadata {
  image_data: string; // base64 encoded
}

export interface Create_Image_Data {
  entity_type: Image_Entity_Type;
  entity_id: number;
  image_data: string; // base64 encoded
  mime_type: Image_Mime_Type;
  file_name?: string;
}

export interface Update_Image_Data {
  image_data: string; // base64 encoded
  mime_type: Image_Mime_Type;
  file_name?: string;
}
