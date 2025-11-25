import { useState } from 'react';
import {
  Typography,
  Paper,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  Box,
  Divider,
  Stack,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  BookmarkAdd as ReserveIcon,
  BookmarkAdd,
} from '@mui/icons-material';
// import { ReservationDialog } from '../components/reservations/ReservationDialog';
import {
  Library_Item_Type,
  type Library_Copy_Status,
  type Item_Condition,
} from '../types';
import { PageContainer } from '../components/common/PageBuilders';
// import { useSnackbar } from '../hooks/useSnackbar';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface ItemCopyWithDetails {
  id: number;
  library_item_id: number;
  branch_id: number;
  status: Library_Copy_Status;
  condition?: Item_Condition;
  cost: number;
  notes?: string;
  title?: string;
  item_type?: Library_Item_Type;
  due_date?: string;
  patron_name?: string;
  patron_id?: number;
  copy_label?: string;
  copy_number?: number;
  total_copies?: number;
}

interface ItemRecord {
  itemName: string;
  itemId: number;
  itemType: Library_Item_Type;
  copyId: number;
  copyLabel: string;
  status: Library_Copy_Status;
  dueDate?: string;
  patronName?: string;
  patronId?: number;
  condition?: Item_Condition;
  branchId: number;
  availableCopies?: number;
  totalCopies?: number;
}

interface FullItemDetails {
  itemName: string;
  itemId: number;
  itemType: Library_Item_Type;
  copyId: number;
  copyLabel: string;
  status: Library_Copy_Status;
  dueDate?: string;
  patronName?: string;
  patronId?: number;
  condition?: Item_Condition;
  availableCopies: string;
  totalCopies: number;
}

type SearchBy = 'Item Name' | 'Item ID';
type Step = 'Display search options' | 'Search Results' | 'Full Item Record';

export function ReservePage() {
  const [step, setStep] = useState<Step>('Display search options');
  const [searchBy, setSearchBy] = useState<SearchBy>('Item Name');
  const [searchInput, setSearchInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [searchResults, setSearchResults] = useState<ItemRecord[]>([]);
  const [selectedItem, setSelectedItem] = useState<FullItemDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // const { show_snackbar } = useSnackbar();

  // Reservation dialog state
  // const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  // const [reservationItem, setReservationItem] = useState<{
  //   id: number;
  //   name: string;
  // } | null>(null);

  const validateSearchCriteria = (): boolean => {
    if (!searchInput.trim()) {
      setValidationError('Search criteria cannot be empty');
      return false;
    }
    setValidationError('');
    return true;
  };

  const executeItemSearch = async () => {
    setLoading(true);
    try {
      let copies: ItemCopyWithDetails[] = [];

      if (searchBy === 'Item ID') {
        // Search by library item ID - get all copies of that item
        const response = await fetch(
          `${API_BASE_URL}/item-copies/item/${searchInput}`
        );
        if (!response.ok) {
          throw new Error('Item not found');
        }
        const data = await response.json();
        copies = data.data || data;

        // Get library item details
        const itemResponse = await fetch(
          `${API_BASE_URL}/library-items/${searchInput}`
        );
        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          const item = itemData.data || itemData;
          copies = copies.map((copy) => ({
            ...copy,
            title: item.title,
            item_type: item.item_type,
          }));
        }
      } else {
        // Search by item name - get all library items matching the search
        const itemsResponse = await fetch(`${API_BASE_URL}/library-items`);
        if (!itemsResponse.ok) {
          throw new Error('Failed to fetch items');
        }
        const itemsData = await itemsResponse.json();
        const items = itemsData.data || itemsData;

        // Filter items by partial name match (case insensitive)
        const matchingItems = items.filter((item: { title: string }) =>
          item.title.toLowerCase().includes(searchInput.toLowerCase())
        );

        if (matchingItems.length === 0) {
          setValidationError('No items found matching the search criteria');
          setLoading(false);
          return;
        }

        // Get copies for all matching items
        for (const item of matchingItems) {
          const copiesResponse = await fetch(
            `${API_BASE_URL}/item-copies/item/${item.id}`
          );
          if (copiesResponse.ok) {
            const copiesData = await copiesResponse.json();
            const itemCopies = copiesData.data || copiesData;
            copies.push(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...itemCopies.map((copy: any) => ({
                ...copy,
                title: item.title,
                item_type: item.item_type,
              }))
            );
          }
        }
      }

      // Group copies by library_item_id to calculate available copies count
      const copiesByItem: { [key: number]: ItemCopyWithDetails[] } = {};
      copies.forEach((copy) => {
        if (!copiesByItem[copy.library_item_id]) {
          copiesByItem[copy.library_item_id] = [];
        }
        copiesByItem[copy.library_item_id].push(copy);
      });

      // For each copy, get transaction details if checked out
      const copiesWithDetails = await Promise.all(
        copies.map(async (copy) => {
          if (
            copy.status === 'Checked Out' ||
            copy.status === 'Renewed Once' ||
            copy.status === 'Renewed Twice'
          ) {
            try {
              const transactionsResponse = await fetch(
                `${API_BASE_URL}/transactions?status=Active`
              );
              if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json();
                const transactions = transactionsData.data || transactionsData;
                const transaction = transactions.find(
                  (t: { copy_id: number; transaction_type: string }) =>
                    t.copy_id === copy.id && t.transaction_type === 'checkout'
                );

                if (transaction) {
                  return {
                    ...copy,
                    due_date: transaction.due_date,
                    patron_name: `${transaction.first_name} ${transaction.last_name}`,
                    patron_id: transaction.patron_id,
                  };
                }
              }
            } catch (error) {
              console.error(
                'Error fetching transaction for copy:',
                copy.id,
                error
              );
            }
          }
          return copy;
        })
      );

      // Calculate available copies for each item
      const availableCopiesByItem: { [key: number]: number } = {};
      Object.keys(copiesByItem).forEach((itemId) => {
        const itemCopies = copiesByItem[Number(itemId)];
        const available = itemCopies.filter(
          (c) =>
            c.status === 'Available' || c.status?.toLowerCase() === 'available'
        ).length;
        availableCopiesByItem[Number(itemId)] = available;
      });

      const results: ItemRecord[] = copiesWithDetails.map((copy) => {
        const totalCopiesForItem =
          copiesByItem[copy.library_item_id]?.length || 1;
        const availableCopiesForItem =
          availableCopiesByItem[copy.library_item_id] || 0;

        return {
          itemName: copy.title || 'Untitled',
          itemId: copy.library_item_id,
          itemType: (copy.item_type ||
            Library_Item_Type.Book) as Library_Item_Type,
          copyId: copy.id,
          copyLabel:
            copy.copy_label ||
            `Copy ${copy.copy_number || 1} of ${
              copy.total_copies || totalCopiesForItem
            }`,
          status: (copy.status || 'Available') as Library_Copy_Status,
          dueDate: copy.due_date,
          patronName: copy.patron_name,
          patronId: copy.patron_id,
          condition: copy.condition as Item_Condition | undefined,
          branchId: copy.branch_id,
          availableCopies: availableCopiesForItem,
          totalCopies: totalCopiesForItem,
        };
      });

      if (results.length === 0) {
        setValidationError('No items found matching the search criteria');
      } else {
        setSearchResults(results);
        setStep('Search Results');
      }
    } catch {
      setValidationError('Failed to search items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchItems = () => {
    const isValid = validateSearchCriteria();

    if (!isValid) {
      return;
    }

    executeItemSearch();
  };

  const displayFullItemRecord = async (item: ItemRecord) => {
    setLoading(true);
    try {
      // Get all copies of this item to calculate availability
      const copiesResponse = await fetch(
        `${API_BASE_URL}/item-copies/item/${item.itemId}`
      );
      if (!copiesResponse.ok) {
        throw new Error('Failed to fetch item copies');
      }
      const copiesData = await copiesResponse.json();
      const copies = copiesData.data || copiesData;

      const totalCopies = copies.length;
      const availableCopies = copies.filter(
        (c: { status: string }) => c.status === 'Available'
      ).length;

      setSelectedItem({
        ...item,
        availableCopies: `${availableCopies}/${totalCopies}`,
        totalCopies,
      });
      setStep('Full Item Record');
    } catch {
      setValidationError('Failed to load full item details');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('Display search options');
    setSearchInput('');
    setSearchResults([]);
    setSelectedItem(null);
    setValidationError('');
  };

  // Step 1: Click reserve button - opens dialog with item pre-filled
  // const handleReserveClick = (itemId: number, itemName: string) => {
  // setReservationItem({ id: itemId, name: itemName });
  // setReservationDialogOpen(true);
  // };

  // const handleReservationSuccess = async (message: string) => {
  //   show_snackbar({
  //     message,
  //     severity: 'success',
  //     title: 'Success!',
  //   });
  //   setReservationDialogOpen(false);

  //   // Refresh search results to get updated copy statuses
  //   if (searchInput) {
  //     await executeItemSearch();
  //   }
  // };

  const renderContent = () => {
    if (step === 'Display search options') {
      return (
        <PageContainer>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              }}
            >
              <BookmarkAdd color="primary" fontSize="large" />
              Reserve {searchInput}
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>
                Search By
              </FormLabel>
              <RadioGroup
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value as SearchBy)}
              >
                <FormControlLabel
                  value="Item Name"
                  control={<Radio />}
                  label="Item Name (partial search supported)"
                />
                <FormControlLabel
                  value="Item ID"
                  control={<Radio />}
                  label="Item ID"
                />
              </RadioGroup>
            </FormControl>

            {validationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationError}
              </Alert>
            )}

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  searchBy === 'Item Name'
                    ? 'Enter item name or part of it......'
                    : 'Enter item ID'
                }
                type={searchBy === 'Item ID' ? 'number' : 'text'}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearchItems();
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearchItems}
                disabled={loading}
                startIcon={<SearchIcon />}
                sx={{ minWidth: 150 }}
              >
                {loading ? 'Searching...' : 'Search Items'}
              </Button>
            </Stack>
          </Paper>
        </PageContainer>
      );
    }

    if (step === 'Search Results') {
      return (
        <PageContainer>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              fontWeight="bold"
              sx={{ mb: 3 }}
            >
              Search Results
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Found {searchResults.length} result
              {searchResults.length !== 1 ? 's' : ''}. Click on an item to view
              full details.
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              {searchResults.map((item, index) => (
                <Box key={index}>
                  <Card elevation={2}>
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <CardActionArea
                          onClick={() => displayFullItemRecord(item)}
                          sx={{ flexGrow: 1, mr: 2 }}
                        >
                          <Box>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              gutterBottom
                            >
                              {item.itemName}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              <strong>Item ID:</strong> {item.itemId} (reserves
                              the title) | <strong>Copy:</strong>{' '}
                              {item.copyLabel} | <strong>Type:</strong>{' '}
                              {item.itemType}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={2}
                              sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}
                            >
                              {item.dueDate && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  <strong>Due Date:</strong>{' '}
                                  {new Date(item.dueDate).toLocaleDateString()}
                                </Typography>
                              )}
                              {item.patronName && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  <strong>Current Patron:</strong>{' '}
                                  {item.patronName}{' '}
                                  {item.patronId && `(ID: ${item.patronId})`}
                                </Typography>
                              )}
                              {item.availableCopies !== undefined &&
                                item.totalCopies !== undefined && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    <strong>Available Copies:</strong>{' '}
                                    {item.availableCopies} of {item.totalCopies}
                                  </Typography>
                                )}
                            </Stack>
                          </Box>
                        </CardActionArea>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={item.status}
                            color={
                              item.status === 'Available'
                                ? 'success'
                                : item.status === 'Checked Out'
                                ? 'warning'
                                : item.status === 'Reserved'
                                ? 'info'
                                : 'default'
                            }
                            sx={{ fontWeight: 'bold' }}
                          />
                          <Tooltip
                            title={
                              item.status === 'Reserved'
                                ? 'This item is already reserved'
                                : `Reserve Item ID: ${item.itemId} (reserves the title, not a specific copy)`
                            }
                            arrow
                          >
                            <span>
                              <Button
                                variant={
                                  item.status === 'Reserved'
                                    ? 'contained'
                                    : 'outlined'
                                }
                                size="small"
                                startIcon={<ReserveIcon />}
                                // onClick={() =>
                                //   handleReserveClick(item.itemId, item.itemName)
                                // }
                                color={
                                  item.status === 'Reserved'
                                    ? 'success'
                                    : 'primary'
                                }
                                disabled={item.status === 'Reserved'}
                              >
                                {item.status === 'Reserved'
                                  ? 'Reserved'
                                  : 'Reserve Item'}
                              </Button>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Stack>

            <Button variant="outlined" onClick={handleReset}>
              New Search
            </Button>
          </Paper>
        </PageContainer>
      );
    }

    if (step === 'Full Item Record' && selectedItem) {
      return (
        <PageContainer>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxHeight: 'calc(100vh - 200px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              fontWeight="bold"
              sx={{ mb: 3, flexShrink: 0 }}
            >
              Full Item Record
            </Typography>

            <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    ITEM NAME
                  </Typography>
                  <Typography variant="h6" fontWeight="600">
                    {selectedItem.itemName}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    ITEM ID (Title ID)
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedItem.itemId}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    ⓘ Reservations use this Item ID (the title), not a specific
                    copy
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    COPY ID (Specific Copy)
                  </Typography>
                  <Typography variant="body1">
                    {selectedItem.copyLabel}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    ⓘ This is the specific physical copy shown in search results
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    TYPE
                  </Typography>
                  <Typography variant="body1">
                    {selectedItem.itemType}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    STATUS INFORMATION
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Status:
                      </Typography>
                      <Chip
                        label={selectedItem.status}
                        size="small"
                        color={
                          selectedItem.status === 'Available'
                            ? 'success'
                            : selectedItem.status === 'Checked Out'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </Box>
                    {selectedItem.dueDate && (
                      <Typography variant="body2">
                        Due Date:{' '}
                        {new Date(selectedItem.dueDate).toLocaleDateString()}
                      </Typography>
                    )}
                    {selectedItem.patronName && selectedItem.patronId && (
                      <>
                        <Typography variant="body2">
                          Current Patron: {selectedItem.patronName}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 15 }}>
                          Patron ID: {selectedItem.patronId}
                        </Typography>
                      </>
                    )}
                    {selectedItem.condition && (
                      <Typography variant="body2">
                        Condition: {selectedItem.condition}
                      </Typography>
                    )}
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    COPY AVAILABILITY
                  </Typography>
                  <Typography variant="body1">
                    Available copies: {selectedItem.availableCopies}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, flexShrink: 0 }}>
              <Button variant="outlined" onClick={handleReset}>
                New Search
              </Button>
              <Button
                variant="contained"
                startIcon={<ReserveIcon />}
                // onClick={() =>
                //   handleReserveClick(selectedItem.itemId, selectedItem.itemName)
                // }
                color={
                  selectedItem.status === 'Reserved' ? 'success' : 'primary'
                }
                disabled={selectedItem.status === 'Reserved'}
              >
                {selectedItem.status === 'Reserved'
                  ? 'Item Reserved'
                  : 'Reserve Item (Item ID: ' + selectedItem.itemId + ')'}
              </Button>
            </Box>
          </Paper>
        </PageContainer>
      );
    }

    return null;
  };

  return (
    <>
      {renderContent()}

      {/* Reservation Dialog */}
      {/* {reservationItem && (
        <ReservationDialog
          open={reservationDialogOpen}
          onClose={() => {
            setReservationDialogOpen(false);
            setReservationItem(null);
          }}
          initialItemId={reservationItem?.id}
          initialItemName={reservationItem?.name}
          onSuccess={handleReservationSuccess}
        />
      )} */}
    </>
  );
}
