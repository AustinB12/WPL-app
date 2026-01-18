export type Library_Item_DB_Type = {
  id: number;
  item_type: Library_Item_Type;
  title: string;
  description: string;
  publication_year: number;
  created_at: string;
  updated_at: string;
};

export interface Library_Item_Copy_DB_Type {
  id: number;
  library_item_id: number;
  owning_branch_id: number;
  current_branch_id: number;
  checked_out_by: number | null;
  condition: Item_Condition;
  status: Library_Copy_Status;
  cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  date_acquired: string;
  due_date: string | null;
  barcode: string;
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
  Pop = 'Pop',
  Rock = 'Rock',
  Musical_Theater = 'Musical Theater',
  PsychThriller = 'Psychological Thriller',
  Reference = 'Reference',
  Romance = 'Romance',
  ScienceFiction = 'Science Fiction',
  SelfHelp = 'Self-Help',
  Soundtrack = 'Soundtrack',
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
  audiobook_format?: string;
  audiobook_rating?: string;
  audiobook_cover_image?: string;
  audiobook_publisher?: string;
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

export interface Item_Copy extends Library_Item_Copy_DB_Type {
  id: number;
  library_item_id: number;
  cost: number;
  reservation_count?: number;
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
  cover_image?: string;
  patron_avatar_url?: string;
}

export interface Checked_Out_Copy_Simple {
  id: number;
  title: string;
  current_branch_id: number;
  condition: Item_Condition;
  item_type: Library_Item_Type;
  is_overdue: boolean;
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

export interface Check_Out_Copy extends Item_Copy {
  copy_label: string;
  copy_number: number;
  total_copies: number;
}

export interface Never_Checked_Out {
  item_id: number;
  title: string;
  item_type: Library_Item_Type;
  copy_id: number;
  date_acquired: string;
  days_in_collection: number;
  branch_name: string;
}

export interface Overdue_Items {
  copy_id: number;
  title: string;
  item_type: Library_Item_Type;
  due_date: string;
  days_overdue: number;
  fine_amount: number;
  branch_name: string;
  branch_id: number;
  first_name: string;
  last_name: string;
  patron_id: number;
}
