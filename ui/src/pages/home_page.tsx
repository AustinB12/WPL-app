import {
  Card,
  CardContent,
  CardHeader,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { PageContainer } from '../components/common/PageBuilders';
import SplitText from '../components/common/Split_Text';
import LogoLoop from '../components/common/Logo_Loop';
import {
  SiReact,
  SiTypescript,
  SiReactquery,
  SiExpress,
  SiNodedotjs,
  SiSqlite,
} from 'react-icons/si';

const techLogos = [
  { node: <SiReact />, title: 'React', href: 'https://react.dev' },
  {
    node: <SiTypescript />,
    title: 'TypeScript',
    href: 'https://www.typescriptlang.org',
  },
  {
    node: <SiReactquery />,
    title: 'React Query',
    href: 'https://react-query.tanstack.com',
  },
  { node: <SiNodedotjs />, title: 'Node.js', href: 'https://nodejs.org' },
  { node: <SiExpress />, title: 'Express', href: 'https://expressjs.com' },
  {
    node: <SiSqlite />,
    title: 'SQLite',
    href: 'https://www.sqlite.org/index.html',
  },
];

export const Home_Page = () => {
  const theme = useTheme();
  return (
    <PageContainer width='lg' scroll={true} sx={{ height: 'inherit' }}>
      <Typography fontWeight={'bold'} variant='h2' gutterBottom>
        <SplitText delay={75} duration={1.5} text='Wayback Public Library' />
      </Typography>
      <Typography variant='h4'>{'Tech Stack'}</Typography>
      <Paper
        sx={{
          maxHeight: '200px',
          position: 'relative',
          overflow: 'hidden',
          mx: 12,
        }}
      >
        <LogoLoop
          logos={techLogos}
          speed={40}
          direction='left'
          logoHeight={60}
          gap={50}
          hoverSpeed={0}
          scaleOnHover
          fadeOut
          fadeOutColor={theme.palette.background.default}
          ariaLabel='Technology partners'
        />
      </Paper>
      <Card>
        <CardHeader title='About the Project' />
        <CardContent>
          <Typography variant='body1' sx={{ p: 2 }}>
            The Wayback Public Library is a personal project of mine. It is an
            admin portal for a fictional library.
          </Typography>
        </CardContent>
      </Card>
    </PageContainer>
  );
};
