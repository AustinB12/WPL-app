import { format, isAfter, parseISO } from 'date-fns';
import type { Library_Item_Type } from '../types';
import dayjs from 'dayjs';

export const format_date = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
};

export const format_date_time = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

export const is_overdue = (due_date: Date): boolean => {
  return isAfter(new Date(), due_date);
};

export const calculate_days_overdue = (due_date: Date): number => {
  if (!is_overdue(due_date)) return 0;

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - due_date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

export const calculate_fine = (
  due_date: Date,
  finePerDay: number = 0.5
): number => {
  const days_overdue = calculate_days_overdue(due_date);
  return days_overdue * finePerDay;
};

const now = new Date();

export function calculate_due_date(
  item_type: Library_Item_Type,
  pub_year: number
): Date {
  if (item_type === 'VIDEO') {
    if (now.getFullYear() === pub_year) {
      return dayjs().add(3, 'day').toDate(); // 3 days for new releases
    }
    return dayjs().add(14, 'day').toDate(); // 2 weeks for other videos
  }
  return dayjs().add(28, 'day').toDate(); // Default 4 weeks for other item types
}
