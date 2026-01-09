import {
  Album,
  ChromeReaderMode,
  MenuBook,
  Mic,
  Movie,
  Newspaper,
  QuestionMark,
} from '@mui/icons-material';
import { Chip, type ChipProps, type SxProps, useTheme } from '@mui/material';
import { mangoFusionPalette } from '@mui/x-charts/colorPalettes';
import type { JSX } from 'react';
import type { Library_Item_Type } from '../../types';

const dark_colors = mangoFusionPalette('dark');
const light_colors = mangoFusionPalette('light');

type Item_Type_Config = {
  label: string;
  icon: JSX.Element;
  color: string;
};

const ITEM_TYPE_MAP_DARK: Record<Library_Item_Type, Item_Type_Config> = {
  BOOK: {
    label: 'Book',
    icon: <ChromeReaderMode sx={{ color: '#121212 !important' }} />,
    color: dark_colors[2],
  },
  MAGAZINE: {
    label: 'Magazine',
    icon: <MenuBook sx={{ color: '#121212 !important' }} />,
    color: dark_colors[1],
  },
  PERIODICAL: {
    label: 'Periodical',
    icon: <Newspaper sx={{ color: '#121212 !important' }} />,
    color: dark_colors[2],
  },
  RECORDING: {
    label: 'Recording',
    icon: <Mic sx={{ color: '#121212 !important' }} />,
    color: dark_colors[3],
  },
  AUDIOBOOK: {
    label: 'Audiobook',
    icon: <ChromeReaderMode sx={{ color: '#121212 !important' }} />,
    color: dark_colors[4],
  },
  VIDEO: {
    label: 'Movie',
    icon: <Movie sx={{ color: '#121212 !important' }} />,
    color: dark_colors[9],
  },
  CD: {
    label: 'CD',
    icon: <Album sx={{ color: '#121212 !important' }} />,
    color: dark_colors[3],
  },
  VINYL: {
    label: 'Vinyl',
    icon: <Album sx={{ color: '#121212 !important' }} />,
    color: dark_colors[7],
  },
};

const ITEM_TYPE_MAP_LIGHT: Record<Library_Item_Type, Item_Type_Config> = {
  BOOK: {
    label: 'Book',
    icon: <ChromeReaderMode sx={{ fill: 'white' }} />,
    color: light_colors[4],
  },
  MAGAZINE: {
    label: 'Magazine',
    icon: <MenuBook sx={{ fill: 'white' }} />,
    color: light_colors[1],
  },
  PERIODICAL: {
    label: 'Periodical',
    icon: <Newspaper sx={{ fill: 'white' }} />,
    color: light_colors[2],
  },
  RECORDING: {
    label: 'Recording',
    icon: <Mic sx={{ fill: 'white' }} />,
    color: light_colors[3],
  },
  AUDIOBOOK: {
    label: 'Audiobook',
    icon: <ChromeReaderMode sx={{ fill: 'white' }} />,
    color: light_colors[4],
  },
  VIDEO: {
    label: 'Movie',
    icon: <Movie sx={{ fill: 'white' }} />,
    color: 'darkblue',
  },
  CD: {
    label: 'CD',
    icon: <Album sx={{ fill: 'white' }} />,
    color: light_colors[3],
  },
  VINYL: {
    label: 'Vinyl',
    icon: <Album sx={{ fill: 'white' }} />,
    color: light_colors[7],
  },
};

const ItemTypeChip = ({
  item_type,
  size = 'medium',
  sx,
}: {
  item_type: Library_Item_Type;
  size?: ChipProps['size'];
  sx?: SxProps;
}) => {
  const theme = useTheme();
  const is_dark = theme.palette.mode === 'dark';
  const ITEM_TYPE_MAP = is_dark ? ITEM_TYPE_MAP_DARK : ITEM_TYPE_MAP_LIGHT;

  const { label, icon, color } = ITEM_TYPE_MAP[item_type] ?? {
    label: 'Unknown',
    icon: <QuestionMark />,
  };

  return (
    <Chip
      size={size}
      variant={'filled'}
      sx={{
        borderColor: color,
        color: is_dark ? '#121212' : 'white',
        bgcolor: color,
        ...sx,
      }}
      label={label}
      icon={icon}
    />
  );
};

export default ItemTypeChip;
