import { Drawer } from '@mui/material';

interface Details_Drawer_Props {
  open: boolean;
  handle_close: () => void;
  children: React.ReactNode;
}
export const Details_Drawer = ({
  open,
  handle_close,
  children,
}: Details_Drawer_Props) => {
  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={handle_close}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: '85%' },
            maxWidth: '1200px',
          },
        },
      }}
    >
      {children}
    </Drawer>
  );
};
