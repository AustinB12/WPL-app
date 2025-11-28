export type Transaction_Type =
  | 'CHECKOUT'
  | 'CHECKIN'
  | 'RESHELVE'
  | 'BALANCE'
  | 'RENEWAL'
  | 'DAMAGED'
  | 'LOST';

export type Transaction_Status =
  | 'Active'
  | 'Returned'
  | 'Overdue'
  | 'Lost'
  | 'Completed';

export interface Transaction {
  id: number;
  copy_id: number;
  patron_id: number;
  transaction_type: Transaction_Type;
  created_at: Date;
  updated_at: Date;
  due_date?: string;
  return_date?: string;
  fine_amount?: number;
  status: Transaction_Status;
  notes: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  item_type?: Library_Item_Type;
  branch_id: number;
}

export type ReservationStatus =
  | 'pending'
  | 'fulfilled'
  | 'cancelled'
  | 'ready'
  | 'expired'
  | 'waiting';

export interface Reservation {
  id: number;
  library_item_id: number;
  patron_id: number;
  reservation_date: string;
  expiry_date: string;
  status: ReservationStatus;
  queue_position?: number;
  title: string;
  item_type: Library_Item_Type;
  first_name?: string;
  last_name?: string;
}

export interface Fine {
  id: number;
  transaction_id: number;
  amount: number;
  reason: string;
  is_paid: boolean;
  created_at: string;
  transaction?: Transaction;
}

export interface BookFilters {
  search?: string;
  genre?: Genre;
  author?: string;
  availability?: 'all' | 'available' | 'unavailable';
}

export enum Genre {
  Academic = 'Academic',
  Adventure = 'Adventure',
  Art = 'Art',
  Biography = 'Biography',
  Business = 'Business',
  Children = 'Children',
  Coming_Of_Age = 'Coming-of-Age',
  Cooking = 'Cooking',
  Drama = 'Drama',
  Dystopian = 'Dystopian',
  Fantasy = 'Fantasy',
  Fiction = 'Fiction',
  Health = 'Health',
  History = 'History',
  Horror = 'Horror',
  Memoir = 'Memoir',
  Mystery = 'Mystery',
  NonFiction = 'Non-Fiction',
  Poetry = 'Poetry',
  Political = 'Political',
  PsychThriller = 'Psychological Thriller',
  Reference = 'Reference',
  Romance = 'Romance',
  ScienceFiction = 'Science Fiction',
  SelfHelp = 'Self-Help',
  Technology = 'Technology',
  Thriller = 'Thriller',
  Travel = 'Travel',
  YoungAdult = 'Young Adult',
}

export interface Book_Form_Data {
  title: string;
  author: string;
  publisher: string;
  cost: number;
  congress_code?: string;
  publication_year?: number;
  genre?: Genre[];
  description?: string;
  cover_image_url?: string;
}

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
  active_checkouts?: number;
  active_checkout_count?: number; // Number of books currently checked out
}

export type Update_Patron_Data = Partial<Omit<Patron, 'id'>>;

export type Create_Patron_Data = Omit<Patron, 'id'>;

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

export interface CheckInFormData {
  copy_id: number | null;
  new_condition?: Item_Condition;
  new_location_id?: number;
  notes?: string;
}

export type Checked_Out_Copy = {
  transaction_id: number;
  copy_id: number;
  patron_id: number;
  due_date: string;
  checkout_date: string;
  copy_status: string;
  condition: string;
  library_item_id: number;
  owning_branch_id: number;
  current_branch_id: number;
  title: string;
  item_type: string;
  first_name: string;
  last_name: string;
  email: string;
  is_overdue: number;
  days_overdue: number;
  copy_label: string;
  copy_number: number;
  total_copies: number;
  patron_name: string;
};

export enum Library_Item_Type {
  Audiobook = 'AUDIOBOOK',
  Book = 'BOOK',
  CD = 'CD',
  Magazine = 'MAGAZINE',
  Periodical = 'PERIODICAL',
  Recording = 'RECORDING',
  Video = 'VIDEO',
  Vinyl = 'VINYL',
}

export interface Create_Library_Item_Form_Data {
  title: string;
  item_type: Library_Item_Type;
  description?: string;
  publication_year?: number;
  congress_code?: string;
}

export interface Library_Item {
  id: number;
  title: string;
  item_type: Library_Item_Type;
  description: string;
  publication_year: number;
  congress_code: string;
  created_at: string;
  updated_at: string;
  author: string;
  publisher: string;
  genre: Genre[];
  number_of_pages: string;
  director: string;
  studio: string;
  video_format: string;
  duration_minutes: string;
  video_rating: string;
  narrator: string;
  audiobook_duration: string;
  artist: string;
  vinyl_color: string;
  vinyl_tracks: string;
  cd_artist: string;
  record_label: string;
  cd_tracks: string;
  cover_image_url?: string;
  subscription_cost: string;
  magazine_publisher: string;
  issue_number: string;
  publication_month: string;
  publication_date: string;
  pages: string;
  total_copies: string;
  available_copies: string;
  checked_out_copies: string;
}

export type Audiobook = Omit<
  Library_Item,
  | 'cd_artist'
  | 'record_label'
  | 'cd_tracks'
  | 'video_format'
  | 'duration_minutes'
  | 'video_rating'
  | 'director'
  | 'studio'
  | 'number_of_pages'
  | 'book_genre'
  | 'artist'
  | 'vinyl_color'
  | 'vinyl_tracks'
>;

export type Book = Omit<
  Library_Item,
  | 'narrator'
  | 'audiobook_duration'
  | 'cd_artist'
  | 'record_label'
  | 'cd_tracks'
  | 'video_format'
  | 'duration_minutes'
  | 'video_rating'
  | 'director'
  | 'studio'
  | 'vinyl_color'
  | 'vinyl_tracks'
>;

export type Video = Omit<
  Library_Item,
  | 'narrator'
  | 'audiobook_duration'
  | 'cd_artist'
  | 'record_label'
  | 'cd_tracks'
  | 'number_of_pages'
  | 'book_genre'
  | 'artist'
  | 'vinyl_color'
  | 'vinyl_tracks'
>;

export type Periodical = Omit<
  Library_Item,
  | 'narrator'
  | 'audiobook_duration'
  | 'cd_artist'
  | 'record_label'
  | 'cd_tracks'
  | 'video_format'
  | 'duration_minutes'
  | 'video_rating'
  | 'director'
  | 'studio'
  | 'number_of_pages'
>;

export type CD = Omit<
  Library_Item,
  | 'narrator'
  | 'audiobook_duration'
  | 'video_format'
  | 'duration_minutes'
  | 'video_rating'
  | 'director'
  | 'studio'
  | 'number_of_pages'
  | 'book_genre'
  | 'artist'
  | 'vinyl_color'
  | 'vinyl_tracks'
>;

export type Vinyl = Omit<
  Library_Item,
  | 'narrator'
  | 'audiobook_duration'
  | 'cd_artist'
  | 'record_label'
  | 'cd_tracks'
  | 'video_format'
  | 'duration_minutes'
  | 'video_rating'
  | 'director'
  | 'studio'
  | 'number_of_pages'
  | 'book_genre'
>;

export type Recording = Omit<
  Library_Item,
  | 'narrator'
  | 'audiobook_duration'
  | 'video_format'
  | 'duration_minutes'
  | 'video_rating'
  | 'director'
  | 'studio'
  | 'number_of_pages'
  | 'book_genre'
  | 'artist'
  | 'vinyl_color'
  | 'vinyl_tracks'
>;

export type Magazine = Omit<
  Library_Item,
  | 'narrator'
  | 'audiobook_duration'
  | 'cd_artist'
  | 'record_label'
  | 'cd_tracks'
  | 'video_format'
  | 'duration_minutes'
  | 'video_rating'
  | 'director'
  | 'studio'
  | 'number_of_pages'
  | 'book_genre'
  | 'artist'
  | 'vinyl_color'
  | 'vinyl_tracks'
>;

export type Create_Library_Item_Data = Omit<Library_Item, 'id'>;

export type Item_Condition =
  | 'New'
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Digital';
export type Library_Copy_Status =
  | 'Available'
  | 'Checked Out'
  | 'Renewed Once'
  | 'Renewed Twice'
  | 'Reserved'
  | 'Processing'
  | 'Unshelved'
  | 'Ready For Pickup'
  | 'Damaged'
  | 'Lost'
  | 'Unshelved';

export interface Item_Copy {
  id: number;
  library_item_id: number;
  branch_id: number;
  status: Library_Copy_Status;
  condition?: Item_Condition;
  cost: number;
  notes?: string;
  branch_name?: string;
  reservation?: {
    id: number;
    patron_id: number;
    patron_name: string | null;
    status: string;
    queue_position: number;
  };
}

export interface Item_Copy_Result extends Item_Copy {
  title: string;
  item_type: Library_Item_Type;
  description: string;
  publication_year: number;
  owning_branch_name: string;
  current_branch_name: string;
  owning_branch_id: number;
  current_branch_id: number;
  patron_id: number;
  patron_first_name: string;
  patron_last_name: string;
  copy_label: string;
  copy_number: number;
  total_copies: number;
  transaction_time?: string;
  due_date?: string;
}

interface Check_Out_Transaction extends Transaction {
  is_overdue: boolean;
  days_overdue: number;
  fine_amount: number;
}
interface Check_Out_Copy extends Item_Copy {
  copy_label: string;
  copy_number: number;
  total_copies: number;
}

export type Check_Out_Details = {
  transaction: Check_Out_Transaction;
  patron: Patron;
  item_copy: Check_Out_Copy;
  library_item: Library_Item;
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
  status: Transaction_Status;
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
  name: Library_Item_Type | 'NEW_VIDEO';
  duration: number;
}
