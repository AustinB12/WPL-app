import { Box } from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Branch_Provider } from '../../contexts/Branch_Context';
import { ErrorBoundary } from './ErrorBoundary';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Branch_Provider>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Box
          component='main'
          sx={(theme) => ({
            flexGrow: 1,
            bgcolor: theme.palette.mode === 'dark' ? '#292929ff' : '#eeeeeeff',
            width: '100%',
            overflow: 'auto',
            mt: '64px', // Height of the Header/AppBar
          })}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Branch_Provider>
    </Box>
  );
};
