import { Search } from '@mui/icons-material';
import { InputAdornment, TextField, type SxProps } from '@mui/material';

interface Search_Props {
  search_term: string;
  set_search_term: React.Dispatch<React.SetStateAction<string>>;
  full_width?: boolean;
  sx?: SxProps;
}

export const SearchWithNameOrId = ({
  search_term,
  set_search_term,
  full_width = true,
  sx,
}: Search_Props) => {
  return (
    <TextField
      sx={{ bgcolor: 'background.paper', borderRadius: 3, ...sx }}
      fullWidth={full_width}
      placeholder="Search by name or ID"
      value={search_term}
      onChange={(e) => set_search_term(e.target.value)}
      slotProps={{
        htmlInput: {
          sx: { py: 1.5 },
        },
        input: {
          sx: { borderRadius: 2 },
          startAdornment: (
            <InputAdornment sx={{ mt: '0px !important' }} position="start">
              <Search />
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
