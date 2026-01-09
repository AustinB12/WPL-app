import { Avatar, Box, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { PageContainer, PageTitle } from '../components/common/PageBuilders';

export const HomePage = () => {
  return (
    <PageContainer width="lg" scroll={true}>
      <PageTitle title={'Welcome!'} Icon_Component={'symbol'}></PageTitle>
      <Paper sx={{ p: 3, mt: 2, borderRadius: 8, cornerShape: 'squircle' }}>
        <Typography variant="h4" fontWeight={'bold'} gutterBottom>
          {'What is this?'}
        </Typography>
        <Typography variant="body1">{'Great question!'}</Typography>
        <Typography variant="body1">
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
        <Typography variant="h4" fontWeight={'bold'} gutterBottom>
          {'The Tech Stack'}
        </Typography>
        <Box>
          <Typography variant="h5">{'UI'}</Typography>
          <Typography variant="body1">
            {
              'The frontend is built with React and TypeScript, using MUI for the component library. React Query is used for data fetching and state management, while React Router handles routing. Day.js is used for date manipulation.'
            }
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5">{'API'}</Typography>
          <Typography variant="body1">
            {'The server is a NodeJS with Express App'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5">{'Database'}</Typography>
          <Typography variant="body1">
            {
              "The database I'm using SQLite for simplicity. If this were a production app, I'd likely use PostgreSQL or MongoDB."
            }
          </Typography>
        </Box>
        <Link to={'https://github.com/AustinB12/WPL-app'}>The Repo</Link>
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
        <Typography variant="h4" fontWeight={'bold'} gutterBottom>
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
            src="https://media.licdn.com/dms/image/v2/C4D03AQF2qs6pZiimMg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1576023146183?e=1769040000&v=beta&t=NytL_qq2fxvZXKa9aLKQ1R8cVRezocfPVHjt5TK_I58"
          ></Avatar>
          <Box>
            <Typography variant="body1" gutterBottom>
              {
                "I'm a full-stack developer passionate about building useful applications that solve real problems. I enjoy working full-stack, from database design to user interface implementation."
              }
            </Typography>
            <Typography variant="body1">
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
