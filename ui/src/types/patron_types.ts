export type Patron_DB_Type = {
  id: number;
  first_name: string;
  last_name: string;
  balance: number;
  birthday: string | null;
  email: string | null;
  phone: string | null;
  card_expiration_date: string;
  image_url: string | null;
  is_active: boolean;
  local_branch_id: number;
  created_at: string;
  updated_at: string;
};

export interface Patron {
  id: number;
  first_name: string;
  last_name: string;
  balance: number;
  birthday?: string;
  email?: string;
  phone?: string;
  card_expiration_date: string;
  image_url?: string;
  is_active?: boolean;
  local_branch_id: number;
  active_checkouts: number;
}

export type Update_Patron_Data = Partial<Omit<Patron, 'id'>>;

export type Create_Patron_Data = Omit<Patron, 'id' | 'active_checkouts'>;
