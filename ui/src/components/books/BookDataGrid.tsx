import { type GridColDef } from '@mui/x-data-grid';
import { useBooks } from '../../hooks/useBooks';
import { BaseDataGrid } from '../common/BaseDataGrid';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID' },
  { field: 'title', headerName: 'Title', flex: 1 },
  { field: 'author', headerName: 'Author', flex: 1 },
];

interface BooksDataGridProps {
  onError?: (error: string) => void;
  cols?: GridColDef[];
}

export const BooksDataGrid: React.FC<BooksDataGridProps> = ({
  onError,
  cols = columns,
}) => {
  const { data: books, isLoading: loading, error } = useBooks();

  if (error && onError) {
    onError(error.message);
  }

  return (
    <BaseDataGrid
      disableColumnSelector
      rows={books || []}
      columns={cols}
      loading={loading}
      label="Books"
    />
  );
};
