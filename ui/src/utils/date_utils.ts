import { format, isAfter, parseISO } from 'date-fns';
import dayjs from 'dayjs';
import { Library_Item_Type } from '../types/item_types';

export function format_sql_datetime(date: string | Date): string {
  const date_obj = typeof date === 'string' ? new Date(date) : date;
  const js_date = dayjs(date_obj);
  return js_date.format('YYYY-MM-DD HH:mm:ss');
}

export const format_date = (date: string | Date): string => {
  const date_obj = typeof date === 'string' ? parseISO(date) : date;
  return format(date_obj, 'MMM dd, yyyy');
};

export const format_date_time = (date: string | Date): string => {
  const date_obj = typeof date === 'string' ? parseISO(date) : date;
  return format(date_obj, 'MMM dd, yyyy HH:mm');
};

export const is_overdue = (due_date: Date, now: Date = new Date()): boolean => {
  return isAfter(now, due_date);
};

export const calculate_days_overdue = (
  due_date: Date,
  now: Date = new Date()
): number => {
  if (!is_overdue(due_date, now)) return 0;

  const diff_time = now.getTime() - due_date.getTime();
  const diff_days = Math.ceil(diff_time / (1000 * 60 * 60 * 24));

  return diff_days;
};

export const calculate_fine = (
  due_date: Date,
  fine_per_day: number = 1.0,
  now: Date = new Date()
): number => {
  const days_overdue = calculate_days_overdue(due_date, now);
  return days_overdue * fine_per_day;
};

export function calculate_due_date(
  item_type: Library_Item_Type,
  pub_year: number
): Date {
  const now = new Date();
  if (item_type === Library_Item_Type.Video) {
    if (now.getFullYear() === pub_year) {
      return dayjs().add(3, 'day').toDate(); // 3 days for new releases
    }
    return dayjs().add(14, 'day').toDate(); // 2 weeks for other videos
  }
  return dayjs().add(28, 'day').toDate(); // Default 4 weeks for other item types
}
