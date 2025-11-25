// import { useState, useEffect } from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Button,
//   TextField,
//   Typography,
//   Box,
//   Alert,
//   CircularProgress,
//   Divider,
//   Stack,
//   List,
//   ListItem,
//   ListItemButton,
//   ListItemText,
//   Chip,
//   Stepper,
//   Step,
//   StepLabel,
// } from '@mui/material';
// import { useCopiesOfLibraryItem } from '../../hooks/useCopies';
// import { useLibraryItemById } from '../../hooks/useLibraryItems';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// interface Patron {
//   id: number;
//   first_name: string;
//   last_name: string;
//   email: string;
//   phone?: string;
//   address?: string;
//   card_expiration_date: string;
//   is_active: boolean;
// }

// interface Copy {
//   id: number;
//   library_item_id: number;
//   status: string;
//   condition: string;
//   copy_label?: string;
// }

// interface ReservationDialogProps {
//   open: boolean;
//   onClose: () => void;
//   initialItemId?: number;
//   initialItemName?: string;
//   onSuccess?: (message: string, onWaitlist: boolean) => void;
// }

// const steps = ['Select Item', 'Select Copy', 'Enter Patron', 'Confirm'];

// export const ReservationDialog = ({
//   open,
//   onClose,
//   initialItemId,
//   initialItemName,
//   onSuccess,
// }: ReservationDialogProps) => {
//   const [activeStep, setActiveStep] = useState(0);
//   const [itemIdInput, setItemIdInput] = useState(initialItemId?.toString() || '');
//   const [itemId, setItemId] = useState<number | null>(initialItemId || null);
//   const [itemName, setItemName] = useState<string>(initialItemName || '');
//   const [selectedCopyId, setSelectedCopyId] = useState<number | null>(null);
//   const [patronId, setPatronId] = useState('');
//   const [patron, setPatron] = useState<Patron | null>(null);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   // Fetch item details when itemId is set
//   const { data: libraryItem, isLoading: loadingItem } = useLibraryItemById(itemId || 0);
//   const { data: copies, isLoading: loadingCopies } = useCopiesOfLibraryItem(itemId || 0);

//   // Update item name when library item is loaded
//   useEffect(() => {
//     if (libraryItem) {
//       setItemName(libraryItem.title);
//     }
//   }, [libraryItem]);

//   // Reset when dialog opens/closes
//   useEffect(() => {
//     if (open) {
//       if (initialItemId) {
//         setItemId(initialItemId);
//         setItemIdInput(initialItemId.toString());
//         setActiveStep(1); // Start at copy selection if item ID is provided
//       } else {
//         setActiveStep(0);
//         setItemId(null);
//         setItemIdInput('');
//       }
//       setSelectedCopyId(null);
//       setPatronId('');
//       setPatron(null);
//       setError('');
//     }
//   }, [open, initialItemId]);

//   // Step 1: Lookup item by ID
//   const handleLookupItem = async () => {
//     const id = parseInt(itemIdInput);
//     if (isNaN(id) || id <= 0) {
//       setError('Please enter a valid Item ID');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const response = await fetch(`${API_BASE_URL}/library-items/${id}`);
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Item not found');
//       }

//       setItemId(id);
//       setItemName(data.data?.title || data.title || '');
//       setActiveStep(1);
//     } catch (err: any) {
//       setError(err.message || 'Failed to lookup item');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Step 2: Select copy
//   const handleSelectCopy = (copyId: number) => {
//     setSelectedCopyId(copyId);
//     setActiveStep(2);
//   };

//   // Step 3: Lookup patron
//   const handleLookupPatron = async () => {
//     if (!patronId.trim()) {
//       setError('Please enter a patron ID');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const response = await fetch(`${API_BASE_URL}/reservations/validate-patron/${patronId}`);
//       const data = await response.json();

//       if (!response.ok) {
//         if (data.valid === false) {
//           setError(data.error || 'Patron validation failed');
//           if (data.patron) {
//             setPatron(data.patron);
//             setActiveStep(3);
//           }
//           return;
//         }
//         throw new Error(data.error || 'Failed to lookup patron');
//       }

//       if (data.valid) {
//         setPatron(data.patron);
//         setActiveStep(3);
//       }
//     } catch (err: any) {
//       setError(err.message || 'Failed to lookup patron');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Step 4: Confirm reservation
//   const handleConfirmReservation = async () => {
//     if (!patron || !itemId) return;

//     setLoading(true);
//     setError('');

//     try {
//       // Create reservation (still using library_item_id, but we know which copy was selected)
//       const response = await fetch(`${API_BASE_URL}/reservations`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           library_item_id: itemId,
//           patron_id: patron.id,
//           copy_id: selectedCopyId, // Include copy_id for reference (backend may not use it yet)
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         if (data.validation_failed) {
//           setError(data.message || 'Patron validation failed');
//           return;
//         } else if (data.already_reserved) {
//           setError(data.message || 'Item already reserved for this patron');
//           return;
//         }
//         throw new Error(data.error || 'Failed to create reservation');
//       }

//       const selectedCopy = copies?.find((c: Copy) => c.id === selectedCopyId);
//       const copyInfo = selectedCopy ? ` (Copy ID: ${selectedCopyId})` : '';

//       const message = data.on_waitlist
//         ? `${patron.first_name} ${patron.last_name} has been added to the waitlist for "${itemName}"${copyInfo}. The patron will be notified by email when the item becomes available.`
//         : `Reservation created successfully for ${patron.first_name} ${patron.last_name} for "${itemName}"${copyInfo}. The patron will be notified by email when the reserved item is returned and ready for pickup.`;

//       if (onSuccess) {
//         onSuccess(message, data.on_waitlist);
//       }

//       handleClose();
//     } catch (err: any) {
//       setError(err.message || 'Failed to create reservation');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClose = () => {
//     setActiveStep(0);
//     setItemIdInput(initialItemId?.toString() || '');
//     setItemId(initialItemId || null);
//     setItemName(initialItemName || '');
//     setSelectedCopyId(null);
//     setPatronId('');
//     setPatron(null);
//     setError('');
//     setLoading(false);
//     onClose();
//   };

//   const handleBack = () => {
//     if (activeStep > 0) {
//       setActiveStep(activeStep - 1);
//       setError('');
//     }
//   };

//   const availableCopies = copies?.filter((copy: Copy) =>
//     copy.status === 'Available' || copy.status === 'Checked Out' || copy.status === 'Returned (not yet available)'
//   ) || [];

//   const selectedCopy = copies?.find((c: Copy) => c.id === selectedCopyId);

//   return (
//     <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
//       <DialogTitle>
//         <Box>
//           <Typography variant="h6" fontWeight="bold">
//         Reserve Item
//           </Typography>
//           <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 1 }}>
//             {steps.map((label) => (
//               <Step key={label}>
//                 <StepLabel>{label}</StepLabel>
//               </Step>
//             ))}
//           </Stepper>
//         </Box>
//       </DialogTitle>

//       <DialogContent>
//         {error && (
//           <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
//             {error}
//           </Alert>
//         )}

//         {/* Step 1: Select Item ID */}
//         {activeStep === 0 && (
//           <Box sx={{ pt: 2 }}>
//             <Typography variant="body1" gutterBottom>
//               Enter the Item ID (title ID) for the item you want to reserve
//             </Typography>
//             <Alert severity="info" sx={{ mb: 2 }}>
//               <Typography variant="body2">
//                 <strong>Item ID</strong> is the ID of the item title (e.g., "The Great Gatsby" has one Item ID, but may have multiple copies).
//                 <br />
//                 After selecting the item, you'll choose which specific copy to reserve.
//               </Typography>
//             </Alert>

//             <Stack direction="row" spacing={2}>
//               <TextField
//                 fullWidth
//                 label="Item ID"
//                 value={itemIdInput}
//                 onChange={(e) => setItemIdInput(e.target.value)}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') handleLookupItem();
//                 }}
//                 disabled={loading}
//                 autoFocus
//                 type="number"
//               />
//               <Button
//                 onClick={handleLookupItem}
//                 variant="contained"
//                 disabled={loading || !itemIdInput.trim()}
//                 sx={{ minWidth: 120 }}
//               >
//                 {loading ? 'Looking up...' : 'Lookup Item'}
//               </Button>
//             </Stack>

//             {libraryItem && (
//               <Alert severity="success" sx={{ mt: 2 }}>
//                 <Typography variant="body2" fontWeight="bold">
//                   Found: {libraryItem.title}
//                 </Typography>
//                 <Typography variant="body2">
//                   Item ID: {libraryItem.id} | Type: {libraryItem.item_type}
//                 </Typography>
//               </Alert>
//             )}
//           </Box>
//         )}

//         {/* Step 2: Select Copy */}
//         {activeStep === 1 && itemId && (
//           <Box sx={{ pt: 2 }}>
//             <Typography variant="body1" gutterBottom fontWeight="bold">
//               Select which copy to reserve
//             </Typography>
//             <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//               Item: <strong>{itemName}</strong> (Item ID: {itemId})
//             </Typography>

//             {loadingCopies ? (
//               <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
//                 <CircularProgress />
//               </Box>
//             ) : availableCopies.length === 0 ? (
//               <Alert severity="warning">
//                 No available copies found for this item. All copies may be checked out or unavailable.
//               </Alert>
//             ) : (
//               <List>
//                 {availableCopies.map((copy: Copy) => (
//                   <ListItem key={copy.id} disablePadding sx={{ mb: 1 }}>
//                     <ListItemButton
//                       onClick={() => handleSelectCopy(copy.id)}
//                       selected={selectedCopyId === copy.id}
//                       sx={{
//                         border: '1px solid',
//                         borderColor: selectedCopyId === copy.id ? 'primary.main' : 'divider',
//                         borderRadius: 1,
//                         '&.Mui-selected': {
//                           bgcolor: 'primary.light',
//                           '&:hover': {
//                             bgcolor: 'primary.light',
//                           },
//                         },
//                       }}
//                     >
//                       <ListItemText
//                         primary={
//                           <Typography variant="body1" fontWeight="medium">
//                             Copy ID: {copy.id}
//                             {copy.copy_label && ` • ${copy.copy_label}`}
//                           </Typography>
//                         }
//                         secondary={
//                           <Box component="div" sx={{ mt: 0.5 }}>
//                             <Chip
//                               label={copy.status}
//                               size="small"
//                               color={
//                                 copy.status === 'Available'
//                                   ? 'success'
//                                   : copy.status === 'Checked Out'
//                                   ? 'warning'
//                                   : 'default'
//                               }
//                               sx={{ mr: 1 }}
//                             />
//                             <Chip
//                               label={`Condition: ${copy.condition}`}
//                               size="small"
//                               variant="outlined"
//                             />
//                           </Box>
//                         }
//                         secondaryTypographyProps={{ component: 'div' }}
//                       />
//                     </ListItemButton>
//                   </ListItem>
//                 ))}
//               </List>
//             )}

//             {selectedCopyId && (
//               <Alert severity="success" sx={{ mt: 2 }}>
//                 <Typography variant="body2">
//                   Selected: Copy ID <strong>{selectedCopyId}</strong>
//                 </Typography>
//               </Alert>
//             )}
//           </Box>
//         )}

//         {/* Step 3: Enter Patron */}
//         {activeStep === 2 && (
//           <Box sx={{ pt: 2 }}>
//             <Typography variant="body1" gutterBottom>
//               Enter patron ID to reserve this item
//             </Typography>

//             <Alert severity="info" sx={{ mb: 2 }}>
//               <Typography variant="body2">
//                 <strong>Reservation Details:</strong>
//                 <br />
//                 • Item: {itemName} (Item ID: {itemId})
//                 <br />
//                 • Copy: Copy ID {selectedCopyId}
//               </Typography>
//             </Alert>

//             <TextField
//               fullWidth
//               label="Patron ID"
//               value={patronId}
//               onChange={(e) => setPatronId(e.target.value)}
//               onKeyPress={(e) => {
//                 if (e.key === 'Enter') handleLookupPatron();
//               }}
//               disabled={loading}
//               autoFocus
//               type="number"
//             />
//           </Box>
//         )}

//         {/* Step 4: Confirm */}
//         {activeStep === 3 && patron && (
//           <Box sx={{ pt: 2 }}>
//             <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//               RESERVATION SUMMARY
//             </Typography>

//             <Stack spacing={2} sx={{ mt: 2 }}>
//               <Box>
//                 <Typography variant="body2" color="text.secondary">
//                   Item
//                 </Typography>
//                 <Typography variant="body1" fontWeight="bold">
//                   {itemName} (Item ID: {itemId})
//                 </Typography>
//               </Box>

//               <Divider />

//               <Box>
//                 <Typography variant="body2" color="text.secondary">
//                   Copy
//                 </Typography>
//                 <Typography variant="body1" fontWeight="bold">
//                   Copy ID: {selectedCopyId}
//                 </Typography>
//               </Box>

//               <Divider />

//               <Box>
//                 <Typography variant="body2" color="text.secondary">
//                   Patron Name
//                 </Typography>
//                 <Typography variant="body1">
//                   {patron.first_name} {patron.last_name}
//                 </Typography>
//               </Box>

//               <Divider />

//               <Box>
//                 <Typography variant="body2" color="text.secondary">
//                   Patron ID
//                 </Typography>
//                 <Typography variant="body1">{patron.id}</Typography>
//               </Box>

//               <Divider />

//               <Box>
//                 <Typography variant="body2" color="text.secondary">
//                   Email
//                 </Typography>
//                 <Typography variant="body1">{patron.email}</Typography>
//               </Box>
//             </Stack>

//             {!error && (
//                 <Alert severity="info" sx={{ mt: 3 }}>
//                 Please confirm to create this reservation. The patron will be notified by email when the item becomes available.
//                 </Alert>
//             )}
//           </Box>
//         )}

//         {loading && activeStep !== 1 && (
//           <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
//             <CircularProgress size={24} />
//           </Box>
//         )}
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={activeStep === 0 ? handleClose : handleBack} disabled={loading}>
//           {activeStep === 0 ? 'Cancel' : 'Back'}
//         </Button>

//         {activeStep === 0 && (
//           <Button
//             onClick={handleLookupItem}
//             variant="contained"
//             disabled={loading || !itemIdInput.trim()}
//           >
//             {loading ? 'Looking up...' : 'Next'}
//           </Button>
//         )}

//         {activeStep === 1 && (
//           <Button
//             onClick={() => setActiveStep(2)}
//             variant="contained"
//             disabled={!selectedCopyId}
//           >
//             Next
//             </Button>
//         )}

//         {activeStep === 2 && (
//             <Button
//               onClick={handleLookupPatron}
//               variant="contained"
//               disabled={loading || !patronId.trim()}
//             >
//             {loading ? 'Looking up...' : 'Next'}
//             </Button>
//         )}

//         {activeStep === 3 && (
//               <Button
//                 onClick={handleConfirmReservation}
//                 variant="contained"
//                 disabled={loading || !patron?.is_active}
//               >
//             {loading ? 'Creating...' : 'Confirm Reservation'}
//           </Button>
//         )}
//       </DialogActions>
//     </Dialog>
//   );
// };
