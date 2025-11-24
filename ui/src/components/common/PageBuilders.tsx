import { Container, Typography, type SxProps, type Theme } from '@mui/material';
import { type PropsWithChildren } from 'react';

export const PageContainer = ({
  width = 'lg',
  children,
  sx,
}: PropsWithChildren<{
  sx?: SxProps<Theme>;
  width?: 'xl' | 'lg' | 'md' | 'sm';
}>) => {
  return (
    <Container
      maxWidth={width}
      sx={{
        py: 3,
        height: 1,
        overflow: 'hidden',
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
}

export function PageTitle({ title, Icon_Component, sx }: Page_Title_Props) {
  return (
    <Typography
      variant="h3"
      component="h1"
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
      <Icon_Component color="primary" fontSize="large" />
      {title}
    </Typography>
  );
}
