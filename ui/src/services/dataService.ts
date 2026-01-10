import type {
  Branch,
  Check_Out_Details,
  Checked_Out_Copy,
  Checked_Out_Copy_Simple,
  Checkin_Receipt,
  Create_Library_Item_Form_Data,
  Create_Patron_Data,
  Create_Reservation_Data,
  Item_Condition,
  Item_Copy,
  Item_Copy_Result,
  Item_Transaction_DB_Type,
  Library_Copy_Status,
  Library_Item,
  Loan_Duration,
  Patron,
  Reservation,
  ReshelveAllResult,
  ReshelveResponseData,
  Transaction,
  Update_Patron_Data,
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

    let data;
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
      const error = new Error(error_message) as Error & {
        queue?: unknown;
      };
      // Attach additional error data (like queue information) to the error object
      if (data.queue) {
        error.queue = data.queue;
      }
      throw error;
    }

    return data.data || data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed');
  }
};

export const data_service = {
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
  ): Promise<Check_Out_Details> {
    const checkout_data = {
      copy_id,
      patron_id,
      clear_fines,
    };

    const receipt = await api_request<Check_Out_Details>(
      '/transactions/checkout',
      {
        method: 'POST',
        body: JSON.stringify(checkout_data),
      }
    );

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
    } catch (error: unknown) {
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
      `/transactions/patron/${patron_id}`
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
      const result = await api_request<{
        copy_id: number;
        status: string;
      }>(`/transactions/reshelve/undo`, {
        method: 'POST',
        body: JSON.stringify({ copy_id }),
      });
      return result;
    } catch (error: unknown) {
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

  async getAllReservations(
    patron_id?: number,
    status?: string,
    library_item_id?: number
  ): Promise<Reservation[]> {
    let url = '/reservations';
    const params: string[] = [];

    if (patron_id) {
      params.push(`patron_id=${patron_id}`);
    }

    if (status) {
      params.push(`status=${status}`);
    }

    if (library_item_id) {
      params.push(`library_item_id=${library_item_id}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return await api_request<Reservation[]>(url);
  },

  async create_reservation(
    patron_id: number,
    item_copy_id: number
  ): Promise<Create_Reservation_Data | null> {
    try {
      const response = await api_request(`/reservations`, {
        method: 'POST',
        body: JSON.stringify({ patron_id, item_copy_id }),
      });
      return response as Create_Reservation_Data;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async get_reservations_by_item_copy(
    item_copy_id: number
  ): Promise<Reservation[]> {
    try {
      const response = await api_request<Reservation[]>(
        `/reservations/item-copy/${item_copy_id}`
      );
      return response;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return [];
      }
      return [];
    }
  },

  async cancelReservation(reservation_id: string): Promise<Reservation | null> {
    try {
      await api_request(`/reservations/${reservation_id}`, {
        method: 'DELETE',
      });
      return null; // Deletion successful
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
  ): Promise<Item_Copy_Result[]> {
    const url = branch_id
      ? `/item-copies/item/${item_id}?branch_id=${branch_id}`
      : `/item-copies/item/${item_id}`;
    return await api_request<Item_Copy_Result[]>(url);
  },

  async get_all_copy_ids(): Promise<number[]> {
    const copies = await api_request<Item_Copy[]>('/item-copies');
    return copies.map((item: Item_Copy) => item.id);
  },

  async get_all_copies(
    branch_id: number,
    status?: Library_Copy_Status,
    condition?: Item_Condition,
    other_status?: Library_Copy_Status
  ): Promise<Item_Copy_Result[]> {
    let url = '/item-copies';
    const params: string[] = [];

    if (branch_id) {
      params.push(`branch_id=${branch_id}`);
    }

    if (status) {
      params.push(`status=${status}`);
    }

    if (other_status) {
      params.push(`other_status=${other_status}`);
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
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async get_checked_out_copies(
    branch_id?: number
  ): Promise<Item_Copy_Result[]> {
    const url = `/item-copies/checked-out${
      branch_id ? `?branch_id=${branch_id}` : ''
    }`;
    return await api_request<Item_Copy_Result[]>(url);
  },

  async get_checked_out_copies_simple(
    branch_id?: number
  ): Promise<Checked_Out_Copy_Simple[]> {
    let url = '/item-copies/checked-out-simple';
    if (branch_id) {
      url += `?branch_id=${branch_id}`;
    }
    return await api_request<Checked_Out_Copy_Simple[]>(url);
  },

  async get_all_copy_transactions(
    start_date?: string,
    end_date?: string
  ): Promise<Item_Transaction_DB_Type[]> {
    let url = '/item-copies/item-transactions/';
    if (start_date) url += `?start_date=${start_date}`;
    if (end_date)
      url += start_date ? `&end_date=${end_date}` : `?end_date=${end_date}`;
    return await api_request<Item_Transaction_DB_Type[]>(url);
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

  async get_branch_by_id(branch_id: number): Promise<Branch | null> {
    try {
      return await api_request<Branch>(`/branches/${branch_id}`);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async update_branch(
    branch_id: number,
    branch_data: Partial<Branch>
  ): Promise<Branch> {
    return await api_request<Branch>(`/branches/${branch_id}`, {
      method: 'PUT',
      body: JSON.stringify(branch_data),
    });
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
    } catch (error: unknown) {
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
      const result = await api_request<{
        statistics: Record<string, number>;
      }>('/reports/stats/overview');
      return result.statistics;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

  // Analytics endpoints
  async get_circulation_trends(
    start_date?: string,
    end_date?: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    branch_id?: number
  ): Promise<{
    labels: string[];
    checkouts: number[];
    checkins: number[];
    renewals: number[];
  }> {
    const params = new URLSearchParams();
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    params.append('interval', interval);
    if (branch_id) params.append('branch_id', branch_id.toString());

    return await api_request(`/analytics/circulation?${params.toString()}`);
  },

  async get_popular_items(
    period: '7d' | '30d' | '90d' | '1y' = '30d',
    branch_id?: number,
    limit: number = 10
  ): Promise<{
    top_items: Array<{
      library_item_id: number;
      title: string;
      checkout_count: number;
    }>;
    top_genres: Array<{ genre: string; checkout_count: number }>;
    by_item_type: Array<{ item_type: string; checkout_count: number }>;
  }> {
    const params = new URLSearchParams();
    params.append('period', period);
    params.append('limit', limit.toString());
    if (branch_id) params.append('branch_id', branch_id.toString());

    return await api_request(`/analytics/popular-items?${params.toString()}`);
  },

  async get_patron_metrics(
    period: '7d' | '30d' | '90d' | '1y' = '30d',
    branch_id?: number
  ): Promise<{
    active_patrons: number;
    new_registrations: number;
    checkout_distribution: Array<{
      patron_id: number;
      first_name: string;
      last_name: string;
      checkout_count: number;
    }>;
    patron_types: {
      heavy_users: number;
      regular_users: number;
      light_users: number;
    };
  }> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (branch_id) params.append('branch_id', branch_id.toString());

    return await api_request(`/analytics/patrons?${params.toString()}`);
  },

  async get_overdue_tracking(branch_id?: number): Promise<{
    total_overdue: number;
    total_fines: number;
    by_branch: Array<{
      branch_id: number;
      branch_name: string;
      overdue_count: number;
      total_fines: number;
    }>;
    overdue_items: Array<any>;
    trend: Array<{ week_label: string; overdue_count: number }>;
  }> {
    const params = new URLSearchParams();
    if (branch_id) params.append('branch_id', branch_id.toString());

    return await api_request(`/analytics/overdue?${params.toString()}`);
  },

  async get_collection_utilization(
    branch_id?: number,
    min_days: number = 30
  ): Promise<{
    summary: {
      total_never_checked: number;
      oldest_item_days: number;
    };
    never_checked_out: Array<any>;
    checkout_rate_by_type: Array<{
      item_type: string;
      total_copies: number;
      checked_out_ever: number;
      utilization_rate: number;
    }>;
    age_analysis: {
      labels: string[];
      total_items: number[];
      never_checked: number[];
    };
  }> {
    const params = new URLSearchParams();
    if (branch_id) params.append('branch_id', branch_id.toString());
    params.append('min_days', min_days.toString());

    return await api_request(
      `/analytics/collection-utilization?${params.toString()}`
    );
  },

  async get_analytics_summary(branch_id?: number): Promise<{
    collection_size: number;
    active_patrons: number;
    current_checkouts: number;
    overdue_items: number;
  }> {
    const params = new URLSearchParams();
    if (branch_id) params.append('branch_id', branch_id.toString());

    return await api_request(`/analytics/summary?${params.toString()}`);
  },
};
