import { Search } from '@mui/icons-material';
import { InputAdornment, TextField } from '@mui/material';

interface Search_Props {
  search_term: string;
  set_search_term: React.Dispatch<React.SetStateAction<string>>;
}

export const SearchWithNameOrId = ({
  search_term,
  set_search_term,
}: Search_Props) => {
  return (
    <TextField
      sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
      fullWidth
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
