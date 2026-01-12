import { Refresh, Settings } from '@mui/icons-material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import {
  Badge,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  styled,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ColumnsPanelTrigger,
  DataGrid,
  type DataGridProps,
  FilterPanelTrigger,
  type GridDensity,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilterTrigger,
  Toolbar,
  ToolbarButton,
} from '@mui/x-data-grid';
import { useState } from 'react';

interface BaseDataGridProps extends DataGridProps {
  hidden_columns?: string[];
  refetch?: () => void;
}
export const BaseDataGrid = (props: BaseDataGridProps) => {
  const [density, set_density] = useState<GridDensity>('standard');

  return (
    <DataGrid
      {...props}
      sx={{
        ['& .MuiDataGrid-scrollbar--horizontal']: {
          height: '8px',
        },
        '& .MuiDataGrid-cell:focus': {
          outline: 'none',
        },
        '& .MuiDataGrid-row:hover': {
          cursor: 'pointer',
        },
        ...props.sx,
      }}
      pageSizeOptions={[10, 25, 50]}
      showToolbar
      slots={{ toolbar: CustomToolbar }}
      slotProps={{
        toolbar: {
          density: density,
          onDensityChange: set_density,
          refetch: props.refetch,
          printOptions: { disableToolbarButton: true },
          csvOptions: { disableToolbarButton: true },
          label: props.label,
        } as CustomToolbarProps,
      }}
      initialState={{
        pagination: {
          paginationModel: { page: 0, pageSize: 25 },
        },
        columns: {
          columnVisibilityModel: {
            ...props.hidden_columns
              ?.map((col) => ({ [col]: false }))
              .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
          },
        },
        ...props.initialState,
      }}
    />
  );
};

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    density: GridDensity;
    onDensityChange: (newDensity: GridDensity) => void;
    label: string;
  }
}

const DENSITY_OPTIONS: { label: string; value: GridDensity }[] = [
  { label: 'Compact', value: 'compact' },
  { label: 'Standard', value: 'standard' },
  { label: 'Comfortable', value: 'comfortable' },
];

type CustomToolbarProps = {
  density: GridDensity;
  onDensityChange: (newDensity: GridDensity) => void;
  label: string;
  refetch?: () => void;
};

export function CustomToolbar(props: CustomToolbarProps) {
  const { density, onDensityChange, label, refetch } = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDensityChange = (newDensity: GridDensity) => {
    onDensityChange(newDensity);
    handleClose();
  };

  return (
    <Toolbar>
      <Typography variant='h6' sx={{ flex: 1 }}>
        {label}
      </Typography>
      {refetch && (
        <Tooltip title='Refresh Data'>
          <ToolbarButton onClick={refetch}>
            <Refresh fontSize='small' />
          </ToolbarButton>
        </Tooltip>
      )}
      <Tooltip title='Columns'>
        <ColumnsPanelTrigger render={<ToolbarButton />}>
          <ViewColumnIcon fontSize='small' />
        </ColumnsPanelTrigger>
      </Tooltip>

      <Tooltip title='Filters'>
        <FilterPanelTrigger
          render={(props, state) => (
            <ToolbarButton {...props} color='default'>
              <Badge
                badgeContent={state.filterCount}
                color='primary'
                variant='dot'
              >
                <FilterListIcon fontSize='small' />
              </Badge>
            </ToolbarButton>
          )}
        />
      </Tooltip>
      <Tooltip title='Adjust row density'>
        <IconButton
          onClick={handleClick}
          aria-controls={open ? 'density-menu' : undefined}
          aria-haspopup='true'
          aria-expanded={open ? 'true' : undefined}
        >
          <Settings />
        </IconButton>
      </Tooltip>
      <Menu
        id='density-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'density-button',
        }}
      >
        {DENSITY_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleDensityChange(option.value)}
            selected={density === option.value}
          >
            <ListItemIcon>
              {density === option.value && <CheckIcon fontSize='small' />}
            </ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <QuickFilter
        style={{
          display: 'grid',
          alignItems: 'center',
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        <QuickFilterTrigger
          render={(triggerProps, state) => (
            <Tooltip title='Search' enterDelay={0}>
              <StyledToolbarButton
                {...triggerProps}
                ownerState={{ expanded: state.expanded }}
                color='default'
                aria-disabled={state.expanded}
              >
                <SearchIcon fontSize='small' />
              </StyledToolbarButton>
            </Tooltip>
          )}
        />
        <QuickFilterControl
          render={({ ref, ...controlProps }, state) => (
            <StyledTextField
              {...controlProps}
              ownerState={{ expanded: state.expanded }}
              inputRef={ref}
              aria-label='Search'
              placeholder='Search...'
              size='small'
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon fontSize='small' />
                    </InputAdornment>
                  ),
                  endAdornment: state.value ? (
                    <InputAdornment position='end'>
                      <QuickFilterClear
                        edge='end'
                        size='small'
                        aria-label='Clear search'
                        material={{
                          sx: { marginRight: -0.75 },
                        }}
                      >
                        <CancelIcon fontSize='small' />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                  ...controlProps.slotProps?.input,
                },
                ...controlProps.slotProps,
              }}
            />
          )}
        />
      </QuickFilter>
    </Toolbar>
  );
}

const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: OwnerState }>(
  ({ theme, ownerState }) => ({
    gridArea: '1 / 1',
    width: 'min-content',
    height: 'min-content',
    zIndex: 1,
    opacity: ownerState.expanded ? 0 : 1,
    pointerEvents: ownerState.expanded ? 'none' : 'auto',
    transition: theme.transitions.create(['opacity']),
  })
);

const StyledTextField = styled(TextField)<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
  gridArea: '1 / 1',
  overflowX: 'clip',
  width: ownerState.expanded ? 220 : 'var(--trigger-width)',
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(['width', 'opacity']),
  maxWidth: '100%',
}));

type OwnerState = {
  expanded: boolean;
};
