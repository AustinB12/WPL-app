import dayjs from 'dayjs';

export function format_sql_datetime(date) {
  const date_obj = typeof date === 'string' ? new Date(date) : date;
  const js_date = dayjs(date_obj.toLocaleString('en-US', { timeZone: 'EST' }));
  return js_date.format('YYYY-MM-DD HH:mm:ss');
}

export function format_sql_date(date) {
  const date_obj = typeof date === 'string' ? new Date(date) : date;
  const js_date = dayjs(date_obj.toLocaleString('en-US', { timeZone: 'EST' }));
  return js_date.format('YYYY-MM-DD');
}