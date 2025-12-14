import {
  Container,
  Skeleton,
  Stack,
  type SxProps,
  type Theme,
  Typography,
} from '@mui/material';
import { type PropsWithChildren } from 'react';

interface Page_Container_Props {
  sx?: SxProps<Theme>;
  width?: 'xl' | 'lg' | 'md' | 'sm';
  scroll?: boolean;
}

export const PageContainer = ({
  width = 'lg',
  children,
  scroll = false,
  sx,
}: PropsWithChildren<Page_Container_Props>) => {
  return (
    <Container
      maxWidth={width}
      sx={{
        py: 3,
        height: 1,
        overflow: scroll ? 'auto' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ...sx,
      }}
    >
      {children}
    </Container>
  );
};

interface Page_Title_Props {
  title: string;
  Icon_Component: React.ElementType;
  sx?: SxProps<Theme>;
  loading?: boolean;
}

export function PageTitle({
  title,
  Icon_Component,
  sx,
  loading,
}: Page_Title_Props) {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Icon_Component color="primary" fontSize="large" />

      <Typography
        variant="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
          ...sx,
        }}
      >
        {loading ? (
          <Skeleton
            variant="text"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.25rem' },
              width: `min(70vw, ${Math.round(title.length * 1.2) + 'ch'})`,
            }}
          ></Skeleton>
        ) : (
          title
        )}
      </Typography>
    </Stack>
  );
}
