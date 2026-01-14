import { Chip, type ChipProps } from '@mui/material';
import type { JSX } from 'react';
import { Genre } from '../../types/item_types';

export function GenreChip({
  genre,
  size = 'small',
}: {
  genre: Genre | string;
  size?: ChipProps['size'];
}): JSX.Element {
  // Map genres to colors
  const get_genre_color = (
    genreValue: Genre | string
  ): ChipProps['color'] | undefined => {
    switch (genreValue) {
      // Fiction genres - primary/blue shades
      case Genre.Fiction:
      case Genre.ScienceFiction:
        return 'primary';

      // Mystery/Thriller/Horror - error/red shades
      case Genre.Mystery:
      case Genre.Thriller:
      case Genre.Horror:
      case Genre.Dystopian:
        return 'error';

      // Fantasy/Adventure - secondary/purple shades
      case Genre.Fantasy:
      case Genre.YoungAdult:
      case Genre.Coming_Of_Age:
        return 'secondary';

      // Romance/Drama - default pink shades
      case Genre.Romance:
      case Genre.Drama:
        return 'error';

      // Non-Fiction/Educational - info/teal shades
      case Genre.NonFiction:
      case Genre.Academic:
      case Genre.Reference:
      case Genre.Technology:
      case Genre.Memoir:
        return 'info';

      // Biography/History - success/green shades
      case Genre.Biography:
      case Genre.History:
      case Genre.Political:
      case Genre.Adventure:
        return 'success';

      // Lifestyle - warning/orange shades
      case Genre.SelfHelp:
      case Genre.Health:
      case Genre.Cooking:
      case Genre.Travel:
      case Genre.PsychThriller:
      case Genre.Rock:
        return 'warning';

      // Creative - secondary
      case Genre.Art:
      case Genre.Poetry:
      case Genre.Pop:
        return 'secondary';

      // Other
      case Genre.Business:
      case Genre.Children:
      case Genre.Soundtrack:
      case Genre.Musical_Theater:
        return 'info';

      default:
        return undefined;
    }
  };

  const color = get_genre_color(genre);

  return (
    <Chip
      size={size}
      label={genre}
      color={color}
      sx={{
        fontWeight: 500,
        '& .MuiChip-label': {
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        },
      }}
    />
  );
}
