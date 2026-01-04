import { CheckCircle, ErrorOutline, Input } from "@mui/icons-material";
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	Chip,
	CircularProgress,
	Divider,
	FormControl,
	Grid,
	InputLabel,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	MenuItem,
	Paper,
	Select,
	Snackbar,
	Stack,
	Step,
	StepLabel,
	Stepper,
	TextField,
	Tooltip,
	Typography
} from "@mui/material";
import { type SelectChangeEvent } from "@mui/material/Select";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { type FC, useEffect, useState } from "react";
import { PageContainer, PageTitle } from "../components/common/PageBuilders";
import { ConfirmCheckInCard } from "../components/copies/ConfirmCheckInCard";
import ItemTypeChip from "../components/library_items/ItemTypeChip";
import { useBranchesContext, useSelectedBranch } from "../hooks/useBranchHooks";
import { useCopyById } from "../hooks/useCopies";
import {
	useCheckedOutItems,
	useCheckOutDetails,
	useReturnBook
} from "../hooks/useTransactions";
import type { CheckInFormData, Item_Condition } from "../types";
import { get_condition_color } from "../utils/colors";

const conditions: Item_Condition[] = [
	"New",
	"Excellent",
	"Good",
	"Fair",
	"Poor"
];
const steps = ["Enter Copy ID", "Enter Condition & Notes", "Confirm Check-In"];

export const CheckInItem: FC = () => {
	const [form_data, set_form_data] = useState<CheckInFormData>({
		copy_id: null
	});

	const { selected_branch } = useSelectedBranch();

	const [active_step, set_active_step] = useState(0);
	const [snackbar, set_snackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error";
	}>({
		open: false,
		message: "",
		severity: "success"
	});

	const [item_id_input, set_item_id_input] = useState("");
	const [error_message, set_error_message] = useState<string | null>(null);

	const { branches } = useBranchesContext();
	const { data: checked_out_items = [], isLoading: loading_checked_out } =
		useCheckedOutItems(selected_branch?.id);

	const {
		mutate: return_book,
		isPending: is_returning,
		data: return_data
	} = useReturnBook();

	const {
		data: item_info_result,
		isLoading: loading_details,
		refetch: fetch_item_details
	} = useCopyById(item_id_input ? parseInt(item_id_input) : null);

	const { data: check_out_details, refetch: fetch_checkout_details } =
		useCheckOutDetails(
			item_id_input.length > 0 ? parseInt(item_id_input) : null
		);

	// Update condition when copy data is fetched
	useEffect(() => {
		if (item_info_result) {
			set_form_data((prev) => ({
				...prev,
				copy_id: item_info_result?.id,
				new_condition: item_info_result?.condition,
				new_location_id: item_info_result?.branch_id,
				new_notes: item_info_result?.notes
			}));
		}
	}, [item_info_result]);

	const handle_lookup_item = () => {
		const copy_id = parseInt(item_id_input);
		if (isNaN(copy_id) || copy_id <= 0) {
			set_error_message("Please enter a valid Copy ID (Barcode)");
			return;
		}
		fetch_item_details();
		fetch_checkout_details();
	};

	const handle_next = () => {
		// If we're on the last step (step 1 - Confirm Check-In), process the check-in
		if (active_step === steps.length - 1) {
			if (!form_data.copy_id || form_data.copy_id <= 0) {
				set_error_message("Copy ID is required");
				return;
			}

			// Clear any previous error messages
			set_error_message(null);

			return_book(
				{
					copy_id: form_data.copy_id,
					new_condition: form_data?.new_condition,
					new_location_id:
						form_data?.new_location_id || selected_branch?.id || 1,
					notes: form_data?.notes
				},
				{
					onSuccess: (data) => {
						set_snackbar({
							open: true,
							message: `${data?.title} successfully checked in! ${
								data?.fine_amount && data.fine_amount > 0
									? ` Fine applied: $${data.fine_amount.toFixed(2)}`
									: ""
							}`,
							severity: "success"
						});
						// Advance to success screen (step 3 - receipt)
						set_active_step(steps.length); // steps.length = 3, which shows the success screen
						// Clear error messages
						set_error_message(null);
					},
					onError: (error: Error) => {
						set_snackbar({
							open: true,
							message: `Failed to check in item: ${error.message}`,
							severity: "error"
						});
					}
				}
			);
			return;
		}

		// Normal step progression (step 0 -> step 1)
		set_active_step((prevActiveStep) => prevActiveStep + 1);
	};

	const handle_back = () => {
		set_active_step((prevActiveStep) => prevActiveStep - 1);
	};

	const handle_reset = () => {
		set_active_step(0);
		set_form_data({ copy_id: null });
		set_item_id_input("");
		set_error_message(null);
	};

	const is_next_disabled = () => {
		if (active_step === 0 && !check_out_details) return true;
		if (active_step === 1 && !check_out_details) return true;
		// Step 2: Allow next if copy is found (condition and notes are optional)
		return false;
	};

	const handle_condition_change = (event: SelectChangeEvent) => {
		set_form_data((prev) => ({
			...prev,
			new_condition: event.target.value as Item_Condition
		}));
	};

	const handle_notes_change = (event: React.ChangeEvent<HTMLInputElement>) => {
		set_form_data((prev) => ({ ...prev, notes: event.target.value }));
	};

	const handle_checked_out_item_selected = (copy_id: number) => {
		set_item_id_input(copy_id.toString());
	};

	useEffect(() => {
		fetch_item_details();
		fetch_checkout_details();
	}, [fetch_checkout_details, fetch_item_details]);

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns}>
			<PageContainer width="xl">
				<PageTitle title="Check In Item" Icon_Component={Input} />
				<Stepper
					activeStep={active_step}
					sx={{
						mb: 3,
						flexShrink: 0,
						"& .MuiStepLabel-root": {
							"& .MuiStepLabel-label": {
								fontSize: "0.875rem",
								fontWeight: 500
							}
						}
					}}
				>
					{steps.map((label) => {
						return (
							<Step key={label}>
								<StepLabel>{label}</StepLabel>
							</Step>
						);
					})}
				</Stepper>
				{active_step === steps.length ? (
					<Stack
						sx={{
							flex: 1,
							overflowY: "auto",
							overflowX: "hidden",
							flexDirection: "column",
							minHeight: 0
						}}
					>
						<Card
							sx={{
								overflow: "auto",
								maxHeight: "100%",
								display: "flex",
								flexDirection: "column",
								borderRadius: 3,
								boxShadow: 2
							}}
						>
							<CardHeader
								title="Check-In Receipt"
								subheader={`Transaction ID: #${return_data?.id}`}
							/>
							<Alert
								variant="filled"
								severity="success"
								icon={<CheckCircle />}
								sx={{ m: 2, borderRadius: 3 }}
							>
								<AlertTitle color="inherit">Check-In Successful!</AlertTitle>
								Copy {return_data?.copy_id || form_data.copy_id} has been
								successfully checked in.
								{return_data?.fine_amount && return_data.fine_amount > 0 ? (
									<>
										A fine of ${return_data.fine_amount.toFixed(2)} has been
										applied to the patron's account.
									</>
								) : (
									<>
										<br />
										<strong>Returned On Time</strong>
										<br />
										No fines have been assessed for this return.
									</>
								)}
								{return_data?.reservation_fulfilled &&
								return_data.reservation_fulfilled.patron ? (
									<>
										<br />
										<strong>Reservation Fulfilled:</strong> This item has been
										reserved for {return_data.reservation_fulfilled.patron.name}{" "}
										(Patron ID: {return_data.reservation_fulfilled.patron.id}).
										The item is now ready for pickup.
									</>
								) : null}
							</Alert>
							<CardContent
								sx={{
									display: "flex",
									flexDirection: "column",
									gap: 2,
									bgcolor: "background.paper",
									borderRadius: 3,
									m: 2
								}}
							>
								{/* Patron Information */}
								<Box>
									<Typography variant="subtitle2" gutterBottom>
										Patron Information
									</Typography>
									<Grid container spacing={2}>
										<Grid size={{ xs: 6, md: 3 }}>
											<Typography variant="body2" color="text.secondary">
												ID
											</Typography>
											<Typography variant="body1">
												#{return_data?.patron_id}
											</Typography>
										</Grid>
										<Grid size={{ xs: 6, md: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Name
											</Typography>
											<Typography variant="body1">
												{return_data?.first_name} {return_data?.last_name}
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, md: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Email
											</Typography>
											<Typography variant="body1">
												{return_data?.email}
											</Typography>
										</Grid>
										<Grid size={{ xs: 12, md: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Phone
											</Typography>
											<Typography variant="body1">
												{return_data?.phone}
											</Typography>
										</Grid>
									</Grid>
								</Box>

								<Divider />

								{/* Item Information */}
								<Box>
									<Typography variant="subtitle2" gutterBottom>
										Item Information
									</Typography>
									<Grid container spacing={2}>
										<Grid size={{ xs: 6, md: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Copy ID
											</Typography>
											<Typography variant="body1">
												#{return_data?.copy_id}
											</Typography>
										</Grid>
										<Grid size={{ xs: 6, md: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Title
											</Typography>
											<Typography variant="body1">
												{return_data?.title}
											</Typography>
										</Grid>
										<Grid size={{ xs: 6, md: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Type
											</Typography>
											<Typography variant="body1">
												{return_data?.item_type}
											</Typography>
										</Grid>
										<Grid size={{ xs: 6, md: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Location
											</Typography>
											<Typography variant="body1">
												{return_data?.branch_name}
											</Typography>
										</Grid>
									</Grid>
								</Box>

								<Divider />

								{/* Timeline */}
								<Box>
									<Typography variant="subtitle2" gutterBottom>
										Timeline
									</Typography>
									<Grid container spacing={2}>
										<Grid size={{ xs: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Checkout Date
											</Typography>
											<Typography variant="body1">
												{return_data?.checkout_date
													? new Date(
															return_data.checkout_date
													  ).toLocaleDateString()
													: "N/A"}
											</Typography>
										</Grid>
										<Grid size={{ xs: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Due Date
											</Typography>
											<Typography variant="body1">
												{return_data?.due_date
													? new Date(return_data.due_date).toLocaleDateString()
													: "N/A"}
											</Typography>
										</Grid>
										<Grid size={{ xs: 3 }}>
											<Typography variant="body2" color="text.secondary">
												Return Date
											</Typography>
											<Typography variant="body1">
												{return_data?.return_date
													? new Date(
															return_data.return_date
													  ).toLocaleDateString()
													: "N/A"}
											</Typography>
										</Grid>
									</Grid>
								</Box>

								{/* Fine Message (only show if there's a fine) */}
								{return_data && return_data.fine_amount > 0 && (
									<Alert
										sx={{
											p: 2,
											bgcolor: "warning.light",
											borderRadius: 1
										}}
									>
										<AlertTitle>⚠️ Overdue Fine</AlertTitle>
										{`This item was returned after the due date.  Fine Amount: ${return_data.fine_amount.toFixed(
											2
										)}`}
									</Alert>
								)}
								{/* Notes (if present) */}
								{return_data?.notes && (
									<>
										<Divider />
										<Box>
											<Typography variant="subtitle2" gutterBottom>
												Notes
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{return_data.notes}
											</Typography>
										</Box>
									</>
								)}
							</CardContent>
						</Card>
						<Box sx={{ display: "flex", flexDirection: "row", pt: 2, pb: 2 }}>
							<Box sx={{ flex: "1 1 auto" }} />
							<Button variant="outlined" onClick={handle_reset}>
								Check In Another Item
							</Button>
						</Box>
					</Stack>
				) : (
					<>
						<Box
							sx={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								overflow: "hidden",
								minHeight: 0
							}}
						>
							{active_step === 0 && (
								<Grid
									container
									spacing={3}
									sx={{
										flex: 1,
										minHeight: 0,
										m: 0,
										width: "100%",
										pt: 0,
										pb: 1
									}}
								>
									<Grid
										size={{ xs: 12, md: 6 }}
										sx={{
											display: "flex",
											flexDirection: "column",
											minHeight: 0
										}}
									>
										<Paper sx={{ p: 3, borderRadius: 3 }}>
											<Typography variant="h6" gutterBottom fontWeight="bold">
												Enter Copy ID (Barcode) to Check In
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ mb: 3 }}
											>
												Enter the unique Copy ID (Barcode) for the specific
												physical copy being returned. Each copy has its own
												unique ID.
											</Typography>

											<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
												<TextField
													label="Copy ID (Barcode)"
													value={item_id_input}
													onChange={(e) => set_item_id_input(e.target.value)}
													onKeyUp={(e) => {
														if (e.key === "Enter") handle_lookup_item();
													}}
													placeholder="Scan barcode or enter copy ID"
													type="number"
													fullWidth
													error={!!error_message}
													disabled={loading_details}
												/>
												<Button
													variant="contained"
													onClick={handle_lookup_item}
													disabled={!item_id_input || loading_details}
													sx={{ minWidth: 120 }}
													startIcon={
														loading_details ? (
															<CircularProgress size={20} />
														) : null
													}
												>
													{loading_details ? "Searching..." : "Search"}
												</Button>
											</Stack>

											{error_message && (
												<Alert
													severity="error"
													sx={{ mb: 2 }}
													icon={<ErrorOutline />}
													onClose={() => set_error_message(null)}
												>
													{error_message}
												</Alert>
											)}

											{item_info_result && check_out_details && (
												<Alert
													severity="success"
													sx={{ mt: 2 }}
													icon={<CheckCircle />}
												>
													<AlertTitle>Copy Found!</AlertTitle>
													{item_info_result.title} (Copy ID:{" "}
													{item_info_result.id}) is ready to check in. Click
													"Next" to continue.
												</Alert>
											)}
										</Paper>
									</Grid>

									<Grid
										size={{ xs: 12, md: 6 }}
										sx={{
											display: "flex",
											flexDirection: "column",
											minHeight: 0,
											height: "100%"
										}}
									>
										<Paper
											sx={{
												p: 3,
												display: "flex",
												flexDirection: "column",
												borderRadius: 3,
												flex: 1,
												minHeight: 0
											}}
										>
											<Typography variant="h6" gutterBottom fontWeight="bold">
												Checked-Out Items
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ mb: 2 }}
											>
												Click an item below to check it in, or enter a Copy ID
												above.
											</Typography>

											{loading_checked_out ? (
												<Box
													sx={{
														display: "flex",
														justifyContent: "center",
														p: 3
													}}
												>
													<CircularProgress />
												</Box>
											) : checked_out_items.length === 0 ? (
												<Alert severity="info">
													No items are currently checked out.
												</Alert>
											) : (
												<Box
													sx={{
														flex: 1,
														overflowY: "auto",
														minHeight: 0,
														pr: 1
													}}
												>
													<List
														dense
														sx={{
															py: 0,
															"& .MuiListItem-root:not(:last-child)": {
																mb: 1
															}
														}}
													>
														{checked_out_items.map((item) => (
															<ListItem key={item.copy_id} disablePadding>
																<ListItemButton
																	onClick={() =>
																		handle_checked_out_item_selected(
																			item.copy_id
																		)
																	}
																	sx={{
																		border: "1px solid",
																		borderColor:
																			item_info_result?.id === item.copy_id
																				? "primary.main"
																				: "divider",
																		borderRadius: 3,
																		"&:hover": {
																			bgcolor: "action.hover"
																		}
																	}}
																>
																	<ListItemText
																		primary={
																			<Typography
																				variant="body1"
																				fontWeight="medium"
																			>
																				{item.title}
																			</Typography>
																		}
																		secondary={
																			<>
																				<Typography
																					variant="body2"
																					color="text.secondary"
																					sx={{
																						display: "flex",
																						justifyContent: "space-between",
																						gap: 2
																					}}
																				>
																					{`${item.copy_label} - Checked Out By: ${item.patron_name} (ID: ${item.patron_id})`}
																				</Typography>
																				<Typography
																					variant="body2"
																					color="text.secondary"
																				></Typography>
																				<Stack
																					direction={"row"}
																					sx={{
																						alignItems: "center",
																						gap: 1
																					}}
																				>
																					<Typography
																						variant="body2"
																						color={
																							item.is_overdue
																								? "error.main"
																								: "text.secondary"
																						}
																						sx={{
																							fontWeight: item.is_overdue
																								? 600
																								: 400
																						}}
																					>
																						Due:
																						{new Date(
																							item.due_date || ""
																						).toLocaleDateString()}
																					</Typography>
																					{!!item.is_overdue && (
																						<Chip
																							label={`${dayjs().diff(
																								dayjs(item.due_date),
																								"day"
																							)} days overdue`}
																							color="error"
																							size="small"
																						/>
																					)}
																				</Stack>
																			</>
																		}
																	/>
																</ListItemButton>
															</ListItem>
														))}
													</List>
												</Box>
											)}
										</Paper>
									</Grid>
								</Grid>
							)}

							{/* Step 1: Enter Condition & Notes */}
							{active_step === 1 && check_out_details && item_info_result && (
								<Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
									<Grid size={{ xs: 12 }}>
										<Paper sx={{ p: 2, borderRadius: 3 }}>
											<Typography variant="h6" gutterBottom fontWeight="bold">
												Enter Condition & Notes
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ mb: 3 }}
											>
												Review the item information and update the condition and
												notes.
											</Typography>

											{/* Book Information Display */}
											<Paper
												elevation={1}
												sx={{
													bgcolor: "background.default",
													p: 2,
													mb: 3,
													border: "1px solid",
													borderColor: "divider"
												}}
											>
												<Typography
													variant="subtitle2"
													color="text.secondary"
													gutterBottom
												>
													ITEM INFORMATION
												</Typography>
												<Typography variant="h6" fontWeight="bold" gutterBottom>
													{item_info_result.title}
												</Typography>
												<Typography
													variant="body2"
													color="text.secondary"
													gutterBottom
												>
													Copy ID: {item_info_result.id} |{" "}
													{item_info_result.copy_label}
													{
														<ItemTypeChip
															sx={{ ml: 1 }}
															size="small"
															item_type={item_info_result.item_type}
														/>
													}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													{`Checked Out By: ${check_out_details.first_name} ${check_out_details.last_name} (ID: ${check_out_details.id})`}
													{/* {loading_checked_out ? (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              p: 3,
                            }}
                          >
                            <CircularProgress />
                          </Box>
                        ) : checked_out_items.length === 0 ? (
                          <Alert severity="info">
                            No items are currently checked out.
                          </Alert>
                        ) : (
                          <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            <List
                              dense
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                              }}
                            >
                              {checked_out_items.map((item) => (
                                <ListItem
                                  key={item.transaction_id}
                                  disablePadding
                                >
                                  <ListItemButton
                                    onClick={() => {
                                      set_item_id_input(
                                        item.copy_id.toString()
                                      );
                                      fetch_item_details(item.copy_id);
                                    }}
                                    sx={{
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 2,
                                      '&:hover': {
                                        bgcolor: 'action.hover',
                                      },
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Typography
                                          variant="body1"
                                          fontWeight="medium"
                                        >
                                          {`${item.title} | Copy #${item.copy_id}`}
                                        </Typography>
                                      }
                                      secondaryTypographyProps={{ component: 'div' }}
                                      secondary={
                                        <>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            component="div"
                                            sx={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              gap: 2,
                                            }}
                                          >
                                            <span>{item.copy_label}</span>
                                            <span>
                                              Checked Out By: {item.patron_name}{' '}
                                              (ID: {item.patron_id})
                                            </span>
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            component="div"
                                          ></Typography>
                                          <Stack
                                            direction={'row'}
                                            sx={{
                                              alignItems: 'center',
                                              gap: 1,
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              color={
                                                item.is_overdue
                                                  ? 'error.main'
                                                  : 'text.secondary'
                                              }
                                              sx={{
                                                fontWeight: item.is_overdue
                                                  ? 600
                                                  : 400,
                                              }}
                                              component="span"
                                            >
                                              Due: {format_date(item.due_date)}
                                            </Typography>
                                            {item.days_overdue > 0 && (
                                              <Chip
                                                label={`${item.days_overdue} days overdue`}
                                                color="error"
                                                size="small"
                                              />
                                            )}
                                          </Stack>
                                        </>
                                      }
                                    />
                                  </ListItemButton>
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {active_step === 1 && selected_copy && item_info && (
                  <Grid container spacing={3} sx={{ mb: 3, pt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                      <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                          Enter Condition & Notes */}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Due Date:{" "}
													{new Date(
														check_out_details?.due_date || ""
													).toLocaleDateString()}
													{check_out_details?.is_overdue && (
														<Chip
															label={`Overdue ${check_out_details?.days_overdue} days`}
															color="error"
															size="small"
															sx={{ ml: 1 }}
														/>
													)}
												</Typography>
												{check_out_details?.is_overdue && (
													<Typography
														variant="body2"
														color="error"
														fontWeight="600"
														sx={{ mt: 1 }}
													>
														Late Fee: $
														{check_out_details?.fine_amount.toFixed(2)}
													</Typography>
												)}
											</Paper>

											{/* Condition and Notes Fields */}
											<Grid container spacing={2}>
												<Grid size={{ xs: 12, sm: 6 }}>
													<FormControl fullWidth>
														<InputLabel id="condition-select-label" shrink>
															Condition
														</InputLabel>
														<Select
															title="The condition of the library item"
															labelId="condition-select-label"
															id="condition-select"
															value={
																form_data &&
																conditions.includes(
																	form_data?.new_condition || "Good"
																)
																	? form_data.new_condition
																	: ""
															}
															label="Condition"
															onChange={handle_condition_change}
															notched
														>
															{conditions.map((c) => (
																<MenuItem key={c} value={c}>
																	<Chip
																		label={c}
																		color={get_condition_color(c)}
																		variant="outlined"
																	/>
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</Grid>
												<Grid size={{ xs: 12 }}>
													<TextField
														fullWidth
														label="Notes"
														multiline
														rows={4}
														value={form_data?.notes || ""}
														onChange={handle_notes_change}
														placeholder="Add any notes about the item condition or return..."
													/>
												</Grid>
											</Grid>
										</Paper>
									</Grid>
								</Grid>
							)}

							{/* Step 2: Confirm Check-In */}
							{active_step === 2 && check_out_details && item_info_result && (
								<ConfirmCheckInCard
									item_info={item_info_result}
									checkout_details={check_out_details!}
									form_data={form_data}
									branches={branches}
								/>
							)}
						</Box>
						{active_step < steps.length && (
							<Box
								sx={{
									display: "flex",
									flexDirection: "row",
									pt: 2,
									flexShrink: 0
								}}
							>
								<Button
									disabled={active_step === 0}
									onClick={handle_back}
									sx={{ mr: 1 }}
									variant="outlined"
								>
									Back
								</Button>
								<Box sx={{ flex: "1 1 auto" }} />
								<Tooltip
									children={
										<span>
											{/* this span is needed to avoid a ref error caused by MUI code */}
											<Button
												variant="outlined"
												onClick={handle_next}
												disabled={is_next_disabled() || is_returning}
												startIcon={
													is_returning && active_step === steps.length - 1 ? (
														<CircularProgress size={20} />
													) : null
												}
											>
												{active_step === steps.length - 1
													? is_returning
														? "Processing..."
														: "Finish"
													: "Next"}
											</Button>
										</span>
									}
									title={
										is_next_disabled()
											? `Select ${
													active_step === 0 ? "item" : "copy"
											  } to proceed`
											: active_step === steps.length - 1
											? "Finish Check-In"
											: "Next page"
									}
								></Tooltip>
							</Box>
						)}
					</>
				)}

				<Snackbar
					open={snackbar.open}
					autoHideDuration={snackbar.severity === "success" ? 4000 : 6000}
					onClose={() => set_snackbar((prev) => ({ ...prev, open: false }))}
					anchorOrigin={{ vertical: "top", horizontal: "center" }}
				>
					<Alert
						onClose={() => set_snackbar((prev) => ({ ...prev, open: false }))}
						severity={snackbar.severity}
						variant="filled"
						sx={{ width: "100%" }}
					>
						{snackbar.message}
					</Alert>
				</Snackbar>
			</PageContainer>
		</LocalizationProvider>
	);
};
