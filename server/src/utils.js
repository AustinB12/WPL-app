import dayjs from 'dayjs';

export function format_sql_datetime(date) {
  const date_obj = typeof date === 'string' ? new Date(date) : date;
  const js_date = dayjs(date_obj);
  return js_date.format('YYYY-MM-DD HH:mm:ss');
}
