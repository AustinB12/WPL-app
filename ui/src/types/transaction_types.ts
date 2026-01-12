import type {
  Check_Out_Copy,
  Item_Condition,
  Item_Copy,
  Library_Copy_Status,
  Library_Item,
  Library_Item_Type,
} from './item_types';
import type { Patron } from './patron_types';

export type Transaction_Type =
  | 'CHECKOUT'
  | 'CHECKIN'
  | 'RESHELVE'
  | 'RESERVATION'
  | 'BALANCE'
  | 'RENEWAL'
  | 'DAMAGED'
  | 'LOST';

export interface Transaction {
  id: number;
  transaction_type: Transaction_Type;
  date: string;
  patron_id: number;
  item_copy_id: number;
  library_item_id: number;
  location_id: number;
  notes: string;
  first_name: string | null;
  last_name: string | null;
  title: string;
  item_type: Library_Item_Type;
  condition: Item_Condition;
  current_branch_id: number;
  owning_branch_id: number;
  current_branch_name: string;
  owning_branch_name: string;
  created_at: string;
}

export type Reservation_Status =
  | 'pending'
  | 'fulfilled'
  | 'cancelled'
  | 'ready'
  | 'expired'
  | 'waiting';

export interface Reservation {
  id: number;
  item_copy_id: number;
  patron_id: number;
  reservation_date: string;
  expiry_date: string;
  status: Reservation_Status;
  queue_position: number;
  notification_sent: string;
  fulfillment_date: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  patron_image?: string;
  title: string;
  item_type: Library_Item_Type;
  description: string;
  copy_status: Library_Copy_Status;
  copy_condition: Item_Condition;
}

export type Create_Reservation_Data = {
  item_copy_id: number;
  reservation_details: {
    reservation_id: number;
    reservation_date: string;
    expiry_date: string;
    status: Reservation_Status;
    queue_position: number;
  };
  patron_details: {
    first_name: string;
    last_name: string;
    email: string | null;
  };
};

export interface Fine {
  id: number;
  transaction_id: number;
  amount: number;
  reason: string;
  is_paid: boolean;
  created_at: string;
  transaction?: Transaction;
}

type Reservation_Info = {
  reservation_id: number;
  queue_position: number;
  status: string;
  was_reserved: boolean;
};

export interface Checkin_Receipt {
  reservation_fulfilled?: {
    reservation_id: number;
    patron_id: number;
    queue_position: number;
    patron?: {
      id: number;
      name: string;
      email: string;
    };
  } | null;
  id: number;
  copy_id: number;
  patron_id: number;
  location_id: number;
  transaction_type: Transaction_Type;
  checkout_date: string;
  due_date: string;
  return_date: string;
  fine_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title: string;
  item_type: Library_Item_Type;
  branch_name: string;
}

export interface ReshelveResponse {
  success: boolean;
  message: string;
  data: ReshelveResponseData;
}

export interface ReshelveResponseData {
  copy_id: number;
  status: 'Available' | 'Reserved';
  branch_id: number;
  reservation_promoted: boolean;
}

export interface ReshelveResult {
  copy_id: number;
  status: 'Available' | 'Reserved';
  branch_id: number;
  reservation_promoted: boolean;
}

export interface ReshelveError {
  copy_id: number;
  error: string;
  message?: string;
}

export interface ReshelveAllResponse {
  success: boolean;
  message: string;
  data: ReshelveAllResult;
}

export interface ReshelveAllResult {
  total: number;
  success: number;
  errors: number;
  reservations_promoted: number;
  results: ReshelveResult[];
  failed: ReshelveError[];
}

export type Checkin_Lookup_Result = {
  item: Library_Item;
  copy: Item_Copy;
  patron: Patron;
  transaction: Checkin_Receipt;
};

interface Check_Out_Transaction extends Transaction {
  is_overdue: boolean;
  days_overdue: number;
  fine_amount: number;
}

export type Item_Transaction_DB_Type = {
  id: number;
  transaction_type: Transaction_Type;
  date: string;
  patron_id: number;
  item_copy_id: number;
  location_id: number;
  notes: string;
  created_at: string;
};

export type Reservation_DB_Type = {
  id: number;
  item_copy_id: number;
  patron_id: number;
  reservation_date: string;
  expiry_date: string;
  status: Reservation_Status;
  queue_position: number;
  fullfillment_date: string | null;
  created_at: string;
  updated_at: string;
};

export interface Check_In_Form_Data {
  copy_id: number | null;
  new_condition?: Item_Condition;
  new_location_id?: number;
  notes?: string;
}

export type Check_Out_Details = Check_Out_Transaction &
  Patron &
  Check_Out_Copy &
  Library_Item & {
    reservation: Reservation_Info;
  };
