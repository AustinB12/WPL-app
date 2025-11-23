import type {
  Book,
  Transaction,
  Reservation,
  BookFilters,
  Library_Item,
  Item_Copy,
  Branch,
  Patron,
  Book_Form_Data,
  Create_Library_Item_Form_Data,
  Item_Condition,
  Item_Copy_Result,
  Checkin_Receipt,
  Update_Patron_Data,
  Create_Patron_Data,
  Library_Copy_Status,
  Check_Out_Details,
  Checked_Out_Copy,
  ReshelveAllResult,
  Loan_Duration,
  ReshelveResponseData,
} from '../types';
import { Genre } from '../types';

const is_dev = import.meta.env.MODE === 'development';
// API configuration
const API_BASE_URL = is_dev
  ? 'http://localhost:3000/api/v1'
  : import.meta.env.VITE_API_BASE_URL;

// Generic HTTP request function
const api_request = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Get response as text first to check if it's JSON
    const text = await response.text();

    // Check if response is HTML (error page)
    if (
      text.trim().startsWith('<!DOCTYPE') ||
      text.trim().startsWith('<html')
    ) {
      throw new Error(
        `Server returned HTML instead of JSON. HTTP ${response.status}: ${response.statusText}`
      );
    }

    // Try to parse as JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Invalid JSON response from server. HTTP ${response.status}: ${
          response.statusText
        }. Response: ${text.substring(0, 200)}`
      );
    }

    // Check if response indicates an error
    if (!response.ok) {
      const error_message =
        data.message ||
        data.error ||
        `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(error_message) as Error & { queue?: unknown };
      // Attach additional error data (like queue information) to the error object
      if (data.queue) {
        error.queue = data.queue;
      }
      throw error;
    }

    return data.data || data;
  } catch (error: Error | unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed');
  }
};

export const data_service = {
  //! Book operations

  async get_books(filters?: BookFilters): Promise<Book[]> {
    const search_params = new URLSearchParams();

    if (filters?.search) {
      search_params.append('search', filters.search);
    }

    if (filters?.genre) {
      search_params.append('genre', filters.genre);
    }

    if (filters?.author) {
      search_params.append('author', filters.author);
    }

    if (filters?.availability) {
      search_params.append('availability', filters.availability);
    }

    search_params.append('item_type', 'Book');

    const query_string = search_params.toString()
      ? `?${search_params.toString()}`
      : '';
    const books = await api_request<Book[]>(`/library-items${query_string}`);

    // Filter only books from library items
    return books.filter((item) => item.item_type === 'BOOK');
  },

  async getBookById(id: string): Promise<Book | null> {
    try {
      // First get the library item
      const library_item = await api_request<Library_Item>(
        `/library-items/${id}`
      );

      if (!library_item || library_item.item_type !== 'BOOK') {
        return null;
      }

      // Then get book-specific details if they exist
      // For now, we'll construct a basic book from library item
      const book: Book = {
        id: library_item.id,
        title: library_item.title,
        item_type: library_item.item_type,
        description: library_item.description,
        publication_year: library_item.publication_year,
        congress_code: library_item.congress_code,
        author: '', // These would come from books table
        genre: [],
        publisher: '',
        cover_image_url: '',
        library_item_id: library_item.id,
      };

      return book;
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async create_book(book: Book_Form_Data): Promise<Book> {
    const library_item_data = {
      title: book.title,
      item_type: 'Book',
      description: book.description,
      publication_year: book.publication_year,
      congress_code: book.congress_code,
    };

    const created_item = await api_request<Library_Item>('/library-items', {
      method: 'POST',
      body: JSON.stringify(library_item_data),
    });

    // Convert library item back to book format
    return {
      ...created_item,
      author: book.author || '',
      genre: book?.genre || [],
      publisher: book?.publisher || '',
      cover_image_url: book?.cover_image_url || '',
      library_item_id: created_item.id,
    };
  },

  async updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
    try {
      const library_item_updates = {
        title: updates.title,
        description: updates.description,
        publication_year: updates.publication_year,
      };

      await api_request(`/library-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(library_item_updates),
      });

      // Return updated book
      return await this.getBookById(id);
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async deleteBook(id: string): Promise<boolean> {
    await api_request(`/library-items/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  async getGenres(): Promise<Genre[]> {
    // Since we don't have a dedicated books table with genres in the new API,
    // we'll return a static list of common genres for now
    // TODO: Implement genre extraction from library items or create separate endpoint
    const common_genres = [
      'Fiction',
      'Non-Fiction',
      'Mystery',
      'Romance',
      'Science Fiction',
      'Fantasy',
      'Biography',
      'History',
      'Children',
      'Young Adult',
      'Poetry',
      'Drama',
    ] as Genre[];

    return common_genres.sort();
  },

  // Transaction operations
  async check_out_item(
    patron_id: number,
    copy_id: number,
    clear_fines: boolean = false
  ): Promise<Transaction & Patron & Item_Copy & Library_Item> {
    const checkout_data = {
      copy_id,
      patron_id,
      clear_fines,
    };

    const receipt = await api_request<
      Transaction & Patron & Item_Copy & Library_Item
    >('/transactions/checkout', {
      method: 'POST',
      body: JSON.stringify(checkout_data),
    });

    return receipt;
  },

  async check_in_item(
    copy_id: number,
    new_location_id: number,
    new_condition?: Item_Condition,
    notes?: string
  ): Promise<Checkin_Receipt | null> {
    try {
      const checkin_data = {
        copy_id,
        new_location_id,
        new_condition,
        notes,
      };

      return await api_request('/transactions/checkin', {
        method: 'POST',
        body: JSON.stringify(checkin_data),
      });
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async getAllTransactions(order_by?: string): Promise<Transaction[]> {
    const query = order_by
      ? `/transactions?order_by=${order_by}`
      : '/transactions';
    return await api_request<Transaction[]>(query);
  },

  async getTransactionsByPatronId(patron_id: number): Promise<Transaction[]> {
    return await api_request<Transaction[]>(
      `/transactions?patron_id=${patron_id}`
    );
  },

  async getOverdueTransactions(): Promise<Transaction[]> {
    // Get all active transactions and filter overdue on client side
    // TODO: Add server-side filtering for overdue transactions
    const all_transactions = await api_request<Transaction[]>(
      '/transactions?status=Active'
    );
    const now = new Date();

    return all_transactions.filter((transaction) => {
      return transaction.due_date && new Date(transaction.due_date) < now;
    });
  },

  async getActiveTransactions(): Promise<Transaction[]> {
    return await api_request<Transaction[]>('/transactions?status=Active');
  },

  async getCheckedOutItems(branch_id?: number): Promise<Checked_Out_Copy[]> {
    const url = branch_id
      ? `/transactions/checked-out?branch_id=${branch_id}`
      : '/transactions/checked-out';
    return await api_request<Checked_Out_Copy[]>(url);
  },

  async get_check_out_details(
    copy_id: number | null
  ): Promise<Check_Out_Details | null> {
    if (copy_id === null) {
      return null;
    }
    return await api_request<Check_Out_Details>(
      `/transactions/checkin-lookup/${copy_id}`
    );
  },

  async reshelve_item(
    copy_id: number,
    branch_id?: number
  ): Promise<ReshelveResponseData | null> {
    try {
      const result = await api_request<ReshelveResponseData>(
        `/transactions/reshelve`,
        {
          method: 'POST',
          body: JSON.stringify({ copy_id, branch_id }),
        }
      );
      return result;
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async reshelve_items(
    copy_ids: number[],
    branch_id?: number
  ): Promise<ReshelveAllResult | null> {
    try {
      const result = await api_request<ReshelveAllResult>(
        `/transactions/reshelve-all`,
        {
          method: 'POST',
          body: JSON.stringify({ copy_ids, branch_id }),
        }
      );
      return result;
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async undo_reshelve(
    copy_id: number
  ): Promise<{ copy_id: number; status: string } | null> {
    try {
      const result = await api_request<{ copy_id: number; status: string }>(
        `/transactions/reshelve/undo`,
        {
          method: 'POST',
          body: JSON.stringify({ copy_id }),
        }
      );
      return result;
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  // Reservation operations
  async reserveBook(
    library_item_id: number,
    patron_id?: number
  ): Promise<Reservation> {
    const reservation_data = {
      library_item_id,
      patron_id,
    };

    return await api_request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation_data),
    });
  },

  async getAllReservations(): Promise<Reservation[]> {
    return await api_request<Reservation[]>('/reservations');
  },

  async cancelReservation(reservation_id: string): Promise<Reservation | null> {
    try {
      await api_request(`/reservations/${reservation_id}`, {
        method: 'DELETE',
      });
      return null; // Deletion successful
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async get_all_library_items(): Promise<Library_Item[]> {
    return await api_request<Library_Item[]>('/library-items');
  },

  async get_library_item_by_id(item_id: number): Promise<Library_Item | null> {
    try {
      return await api_request<Library_Item>(`/library-items/${item_id}`);
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async create_library_item(
    item: Create_Library_Item_Form_Data
  ): Promise<Library_Item> {
    return await api_request<Library_Item>('/library-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async update_library_item(
    item_id: number,
    item: Create_Library_Item_Form_Data
  ): Promise<Library_Item> {
    return await api_request<Library_Item>(`/library-items/${item_id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async delete_library_item(item_id: number): Promise<void> {
    return await api_request<void>(`/library-items/${item_id}`, {
      method: 'DELETE',
    });
  },

  async get_all_copies_by_item_id(
    item_id: number,
    branch_id?: number
  ): Promise<Item_Copy[]> {
    const url = branch_id
      ? `/item-copies/item/${item_id}?branch_id=${branch_id}`
      : `/item-copies/item/${item_id}`;
    return await api_request<Item_Copy[]>(url);
  },

  async get_all_copy_ids(): Promise<number[]> {
    const copies = await api_request<Item_Copy[]>('/item-copies');
    return copies.map((item: Item_Copy) => item.id);
  },

  async get_all_copies(
    branch_id: number,
    status?: Library_Copy_Status,
    condition?: Item_Condition
  ): Promise<Item_Copy_Result[]> {
    let url = '/item-copies';
    const params: string[] = [];

    if (branch_id) {
      params.push(`branch_id=${branch_id}`);
    }

    if (status) {
      params.push(`status=${status}`);
    }

    if (condition) {
      params.push(`condition=${condition}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return await api_request<Item_Copy_Result[]>(url);
  },

  async get_all_item_copies(): Promise<Item_Copy_Result[]> {
    return await api_request<Item_Copy_Result[]>('/item-copies');
  },

  async get_copy_by_id(
    copy_id: number | null
  ): Promise<Item_Copy_Result | null> {
    if (copy_id === null) {
      return null;
    }
    try {
      return await api_request<Item_Copy_Result>(`/item-copies/${copy_id}`);
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async get_checked_out_copies(branch_id: number): Promise<Item_Copy_Result[]> {
    const url = `/item-copies/checked-out?branch_id=${branch_id}`;
    return await api_request<Item_Copy_Result[]>(url);
  },

  async get_unshelved_copies(branch_id: number): Promise<Item_Copy_Result[]> {
    const url = `/item-copies/unshelved?branch_id=${branch_id}`;
    return await api_request<Item_Copy_Result[]>(url);
  },

  async get_copies_recently_reshelved(
    branch_id: number
  ): Promise<Item_Copy_Result[]> {
    const url = `/item-copies/recently-reshelved?branch_id=${branch_id}`;
    return await api_request<Item_Copy_Result[]>(url);
  },

  async create_copy(copy_data: {
    library_item_id: number;
    owning_branch_id: number;
    condition?: string;
    status?: string;
    cost?: number;
    notes?: string;
  }): Promise<Item_Copy> {
    return await api_request<Item_Copy>('/item-copies', {
      method: 'POST',
      body: JSON.stringify(copy_data),
    });
  },

  async update_copy(
    copy_id: number,
    copy_data: {
      condition?: string;
      status?: string;
      current_branch_id?: number;
      cost?: number;
      notes?: string;
    }
  ): Promise<Item_Copy> {
    return await api_request<Item_Copy>(`/item-copies/${copy_id}`, {
      method: 'PUT',
      body: JSON.stringify(copy_data),
    });
  },

  async delete_copy(copy_id: number): Promise<void> {
    return await api_request<void>(`/item-copies/${copy_id}`, {
      method: 'DELETE',
    });
  },

  async get_all_branches(): Promise<Branch[]> {
    return await api_request<Branch[]>('/branches');
  },

  async get_all_patrons(just_active: boolean = true): Promise<Patron[]> {
    const url = just_active ? '/patrons?active_only=true' : '/patrons';
    return await api_request<Patron[]>(url);
  },

  async get_patron_by_id(patron_id: number): Promise<Patron | null> {
    if (patron_id <= 0) {
      return null;
    }
    try {
      return await api_request<Patron>(`/patrons/${patron_id}`);
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async create_patron(patron_data: Create_Patron_Data): Promise<Patron> {
    return await api_request<Patron>('/patrons', {
      method: 'POST',
      body: JSON.stringify(patron_data),
    });
  },

  async update_patron(
    patron_id: number,
    patron_data: Update_Patron_Data
  ): Promise<Patron> {
    return await api_request<Patron>(`/patrons/${patron_id}`, {
      method: 'PUT',
      body: JSON.stringify(patron_data),
    });
  },

  async delete_patron_by_id(patron_id: number): Promise<boolean> {
    await api_request(`/patrons/${patron_id}`, {
      method: 'DELETE',
    });
    return true;
  },

  async get_stats(): Promise<Record<string, number>> {
    try {
      const result = await api_request<{ statistics: Record<string, number> }>(
        '/reports/stats/overview'
      );
      return result.statistics;
    } catch (error: Error | unknown) {
      // Return fallback statistics on error instead of throwing
      console.error('Failed to fetch stats:', error);
      return {
        total: 0,
        checked_out: 0,
        available: 0,
        reserved: 0,
      };
    }
  },

  async get_loan_durations(): Promise<Loan_Duration[] | null> {
    try {
      const result = await api_request<Loan_Duration[]>(
        '/settings/loan_durations'
      );
      return result;
    } catch (error: Error | unknown) {
      // Return null on error instead of throwing
      console.error('Failed to fetch loan durations:', error);
      return null;
    }
  },

  async update_loan_duration(id: number, duration: number): Promise<void> {
    await api_request(`/settings/loan_durations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ duration }),
    });
  },
};
