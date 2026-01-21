import { Chip, type ChipProps } from '@mui/material';
import type { JSX } from 'react';
import { Genre } from '../../types/item_types';

// Unique color for each genre
const genre_colors: Record<Genre, string> = {
  [Genre.Academic]: '#5C6BC0', // Indigo
  [Genre.Adventure]: '#26A69A', // Teal
  [Genre.Art]: '#AB47BC', // Purple
  [Genre.Biography]: '#66BB6A', // Green
  [Genre.Business]: '#486a79', // Blue Grey
  [Genre.Children]: '#FFCA28', // Amber
  [Genre.Coming_Of_Age]: '#7E57C2', // Deep Purple
  [Genre.Cooking]: '#FF7043', // Deep Orange
  [Genre.Drama]: '#EC407A', // Pink
  [Genre.Dystopian]: '#78909C', // Grey Blue
  [Genre.Fantasy]: '#9575CD', // Light Purple
  [Genre.Fiction]: '#42A5F5', // Blue
  [Genre.Health]: '#4CAF50', // Green
  [Genre.History]: '#9b4729', // Brown
  [Genre.Horror]: '#B71C1C', // Dark Red
  [Genre.Memoir]: '#00897B', // Teal Dark
  [Genre.Mystery]: '#7B1FA2', // Purple Dark
  [Genre.NonFiction]: '#0288D1', // Light Blue
  [Genre.Poetry]: '#F48FB1', // Light Pink
  [Genre.Political]: '#D32F2F', // Red
  [Genre.Pop]: '#E91E63', // Pink
  [Genre.Rock]: '#424242', // Dark Grey
  [Genre.Musical_Theater]: '#C2185B', // Pink Dark
  [Genre.PsychThriller]: '#4A148C', // Deep Purple Dark
  [Genre.Reference]: '#1976D2', // Blue
  [Genre.Romance]: '#F06292', // Pink Light
  [Genre.ScienceFiction]: '#00BCD4', // Cyan
  [Genre.SelfHelp]: '#FFA726', // Orange
  [Genre.Soundtrack]: '#491f12', // Brown Dark
  [Genre.Technology]: '#00ACC1', // Cyan Dark
  [Genre.Thriller]: '#E53935', // Red
  [Genre.Travel]: '#43A047', // Green
  [Genre.YoungAdult]: '#29B6F6', // Light Blue
};

export function Genre_Chip({
  genre,
  size = 'small',
  sx,
}: {
  genre: Genre | string;
  size?: ChipProps['size'];
  sx?: ChipProps['sx'];
}): JSX.Element {
  const bg_color = genre_colors[genre as Genre] || '#9E9E9E';

  // Calculate contrasting text color
  const get_contrast_color = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const text_color = get_contrast_color(bg_color);

  return (
    <Chip
      size={size}
      label={genre}
      sx={{
        backgroundColor: bg_color,
        color: text_color,
        fontWeight: 500,
        '& .MuiChip-label': {
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        },
        ...sx,
      }}
    />
  );
}
