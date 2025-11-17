import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  useMediaQuery,
  useTheme,
  Toolbar,
} from '@mui/material';
import {
  Home,
  Dashboard,
  SsidChart,
  Groups2,
  Book,
  Output,
  Input,
  Shelves,
  Event,
  TableRows,
  Sync,
  Settings,
} from '@mui/icons-material';

export const drawerWidth = 240;

export const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => {
  const location = useLocation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path))
    );
  };

  const collection_items = [
    { text: 'Home', path: '/', icon: <Home /> },
    { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { text: 'Library Items', path: '/library-items', icon: <Book /> },
    { text: 'All Copies', path: '/library-item-copies', icon: <TableRows /> },
    { text: 'Patrons', path: '/patrons', icon: <Groups2 /> },
    { text: 'Transactions', path: '/transactions', icon: <SsidChart /> },
    { text: 'Reservations', path: '/reservations', icon: <Event /> },
  ];

  const action_items = [
    { text: 'Check In', path: '/check-in', icon: <Input /> },
    {
      text: 'Check Out',
      path: '/check-out',
      icon: <Output sx={{ transform: 'rotate(180deg)' }} />,
    },
    { text: 'Reshelve', path: '/reshelve-new', icon: <Shelves /> },
    { text: 'Renewals', path: '/renewals', icon: <Sync /> },
  ];

  const bottom_items = [
    { text: 'Settings', path: '/settings', icon: <Settings /> },
  ];

  const drawer_content = (
    <Box sx={{ overflow: 'auto', flex: 1 }}>
      <List
        sx={{
          height: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          {collection_items.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive(item.path)}
                onClick={() => isMobile && setSidebarOpen(false)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.50',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.100',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: { fontWeight: isActive(item.path) ? 600 : 400 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 1, mx: 2 }} />
          {action_items.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isActive(item.path)}
                onClick={() => isMobile && setSidebarOpen(false)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.50',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.100',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{
                    primary: { fontWeight: isActive(item.path) ? 600 : 400 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 1, mx: 2 }} />
        </Box>
        {bottom_items.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              onClick={() => isMobile && setSidebarOpen(false)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.50',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.100',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? 'primary.main' : 'inherit',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                slotProps={{
                  primary: { fontWeight: isActive(item.path) ? 600 : 400 },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        <Toolbar />
        {drawer_content}
      </Drawer>
      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        <Toolbar />
        {drawer_content}
      </Drawer>
    </Box>
  );
};
