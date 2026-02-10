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
