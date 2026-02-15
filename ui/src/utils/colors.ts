import { blueberryTwilightPalette } from '@mui/x-charts/colorPalettes';
import { Library_Item_Type } from '../types/item_types';

type Chip_Color =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

const CHIP_COLORS = blueberryTwilightPalette('dark');

const ITEM_TYPE_COLOR_MAP: Record<Library_Item_Type, string> = {
  [Library_Item_Type.Book]: CHIP_COLORS[0],
  [Library_Item_Type.Magazine]: CHIP_COLORS[1],
  [Library_Item_Type.Periodical]: CHIP_COLORS[2],
  [Library_Item_Type.Recording]: CHIP_COLORS[3],
  [Library_Item_Type.Audiobook]: CHIP_COLORS[4],
  [Library_Item_Type.Video]: CHIP_COLORS[5],
  [Library_Item_Type.CD]: CHIP_COLORS[0],
  [Library_Item_Type.Vinyl]: CHIP_COLORS[1],
};

const STATUS_COLOR_MAP: Record<string, Chip_Color> = {
  Available: 'success',
  'Checked Out': 'warning',
  'Renewed Once': 'info',
  'Renewed Twice': 'info',
  Reserved: 'info',
  Processing: 'secondary',
  Unshelved: 'warning',
  'Ready For Pickup': 'success',
  Damaged: 'error',
  Lost: 'error',
};

const CONDITION_COLOR_MAP: Record<string, Chip_Color> = {
  New: 'success',
  Good: 'success',
  Excellent: 'success',
  Fair: 'primary',
  Poor: 'warning',
  Digital: 'info',
};

export const get_color_for_item_type = (item_type: string): string => {
  return ITEM_TYPE_COLOR_MAP[item_type as Library_Item_Type] ?? 'default';
};

export const get_status_color = (status: string): Chip_Color => {
  return STATUS_COLOR_MAP[status] ?? 'default';
};

export const get_condition_color = (condition?: string): Chip_Color => {
  return condition ? (CONDITION_COLOR_MAP[condition] ?? 'default') : 'default';
};

export const get_checkout_count_color = (count: number): string => {
  return checkout_count_color_map[count] ?? '#2E7D32';
};

const checkout_count_color_map: Record<number, string> = {
  0: '#2E7D32',
  1: '#2E7D32',
  2: '#2E7D32',
  3: '#2E7D32',
  4: '#2E7D32',
  5: '#2E7D32',
  6: '#2E7D32',
  7: '#2E7D32',
  8: '#3E7B2E',
  9: '#577928',
  10: '#7B761F',
  11: '#9E7316',
  12: '#C0700D',
  13: '#E96407',
  14: '#E35414',
  15: '#DD6D06',
  16: '#DC451F',
  17: '#D6352A',
  18: '#D32F2F',
  19: '#D32F2F',
  20: '#D32F2F',
};
