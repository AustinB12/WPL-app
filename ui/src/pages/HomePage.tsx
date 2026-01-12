import {
  Avatar,
  Box,
  Paper,
  SvgIcon,
  Tooltip,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';

export const HomePage = () => {
  return (
    <PageContainer width='lg' scroll={true}>
      <PageTitle title={'Welcome!'} Icon_Component={'symbol'}></PageTitle>
      <Paper sx={{ p: 3, mt: 2, borderRadius: 8, cornerShape: 'squircle' }}>
        <Typography variant='h4' fontWeight={'bold'} gutterBottom>
          {'What is this?'}
        </Typography>
        <Typography variant='body1'>{'Great question!'}</Typography>
        <Typography variant='body1'>
          {
            "This is a personal project I've created. It is an admin system management interface for a fictional library: Wayback Public Library"
          }
        </Typography>
      </Paper>
      <Paper
        sx={{
          p: 3,
          mt: 2,
          borderRadius: 8,
          cornerShape: 'squircle',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant='h4' fontWeight={'bold'} gutterBottom>
          {'The Tech Stack'}
        </Typography>
        <Box>
          <Typography variant='h5'>{'UI'}</Typography>
          <Typography variant='body1'>
            {
              'The frontend is built with React and TypeScript, using MUI for the component library. React Query is used for data fetching and state management, while React Router handles routing. Day.js is used for date manipulation.'
            }
          </Typography>
        </Box>
        <Box>
          <Typography variant='h5'>{'API'}</Typography>
          <Typography variant='body1'>
            {'The server is a NodeJS with Express App'}
          </Typography>
        </Box>
        <Box>
          <Typography variant='h5'>{'Database'}</Typography>
          <Typography variant='body1'>
            {
              "The database I'm using SQLite for simplicity. If this were a production app, I'd likely use PostgreSQL or MongoDB."
            }
          </Typography>
        </Box>
        <Github_Icon />
      </Paper>
      <Paper
        sx={{
          p: 3,
          mt: 2,
          borderRadius: 8,
          cornerShape: 'squircle',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant='h4' fontWeight={'bold'} gutterBottom>
          {'Me'}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            alignItems: 'flex-start',
          }}
        >
          <Avatar
            sx={{ width: 100, height: 100 }}
            src='https://media.licdn.com/dms/image/v2/C4D03AQF2qs6pZiimMg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1576023146183?e=1769040000&v=beta&t=NytL_qq2fxvZXKa9aLKQ1R8cVRezocfPVHjt5TK_I58'
          ></Avatar>
          <Box>
            <Typography variant='body1' gutterBottom>
              {
                "I'm a full-stack developer passionate about building useful applications that solve real problems. I enjoy working full-stack, from database design to user interface implementation."
              }
            </Typography>
            <Typography variant='body1'>
              {
                "When I'm not coding, I enjoy gardening, weight-lifting, video games, and hanging out with my daughter."
              }
            </Typography>
          </Box>
        </Box>
      </Paper>
    </PageContainer>
  );
};

const Github_Icon = () => {
  const nav = useNavigate();
  return (
    <Tooltip title='Check out the code on GitHub'>
      <SvgIcon
        fontSize='large'
        sx={{
          color: 'text.main',
          cursor: 'pointer',
          transition: 'all 0.2s ease-out',
          ['&:hover']: { color: 'primary.light', scale: 1.1 },
        }}
        onClick={() => nav('https://github.com/AustinB12/WPL-app')}
      >
        <svg
          width='800px'
          height='800px'
          viewBox='0 0 20 20'
          version='1.1'
          xmlns='http://www.w3.org/2000/svg'
        >
          <g
            id='Page-1'
            stroke='none'
            strokeWidth='1'
            fill='none'
            fillRule='evenodd'
          >
            <g
              id='Dribbble-Light-Preview'
              transform='translate(-140.000000, -7559.000000)'
              fill='currentColor'
            >
              <g id='icons' transform='translate(56.000000, 160.000000)'>
                <path
                  d='M94,7399 C99.523,7399 104,7403.59 104,7409.253 C104,7413.782 101.138,7417.624 97.167,7418.981 C96.66,7419.082 96.48,7418.762 96.48,7418.489 C96.48,7418.151 96.492,7417.047 96.492,7415.675 C96.492,7414.719 96.172,7414.095 95.813,7413.777 C98.04,7413.523 100.38,7412.656 100.38,7408.718 C100.38,7407.598 99.992,7406.684 99.35,7405.966 C99.454,7405.707 99.797,7404.664 99.252,7403.252 C99.252,7403.252 98.414,7402.977 96.505,7404.303 C95.706,7404.076 94.85,7403.962 94,7403.958 C93.15,7403.962 92.295,7404.076 91.497,7404.303 C89.586,7402.977 88.746,7403.252 88.746,7403.252 C88.203,7404.664 88.546,7405.707 88.649,7405.966 C88.01,7406.684 87.619,7407.598 87.619,7408.718 C87.619,7412.646 89.954,7413.526 92.175,7413.785 C91.889,7414.041 91.63,7414.493 91.54,7415.156 C90.97,7415.418 89.522,7415.871 88.63,7414.304 C88.63,7414.304 88.101,7413.319 87.097,7413.247 C87.097,7413.247 86.122,7413.234 87.029,7413.87 C87.029,7413.87 87.684,7414.185 88.139,7415.37 C88.139,7415.37 88.726,7417.2 91.508,7416.58 C91.513,7417.437 91.522,7418.245 91.522,7418.489 C91.522,7418.76 91.338,7419.077 90.839,7418.982 C86.865,7417.627 84,7413.783 84,7409.253 C84,7403.59 88.478,7399 94,7399'
                  id='github-[#142]'
                ></path>
              </g>
            </g>
          </g>
        </svg>
      </SvgIcon>
    </Tooltip>
  );
};
