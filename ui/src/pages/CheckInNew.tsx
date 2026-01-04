import {
	Album,
	ArrowUpward,
	ChromeReaderMode,
	ErrorOutline,
	InfoOutline,
	Input,
	MenuBook,
	Mic,
	Newspaper,
	QuestionMark,
	YouTube
} from "@mui/icons-material";
import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	IconButton,
	Paper,
	Stack,
	TextField,
	Typography
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Activity, type FC, useEffect, useRef, useState } from "react";
import { QuickCheckInCard } from "../components/checkin/QuickCheckInCard";
import { RecentCheckInsList } from "../components/checkin/RecentCheckInsList";
import { PageContainer, PageTitle } from "../components/common/PageBuilders";
import { useSelectedBranch } from "../hooks/useBranchHooks";
import { useCheckedOutCopiesSimple, useCopyById } from "../hooks/useCopies";
import { useReturnBook } from "../hooks/useTransactions";
import type {
	Checkin_Receipt,
	Item_Condition,
	Library_Item_Type
} from "../types";

interface RecentCheckIn {
	copy_id: number;
	title: string;
	timestamp: Date;
	had_fine: boolean;
	fine_amount?: number;
}

export const CheckInNew: FC = () => {
	const [barcode_input, set_barcode_input] = useState("");
	const [show_checked_out, set_show_checked_out] = useState(true);
	const [error_message, set_error_message] = useState<string | null>(null);
	const [recent_check_ins, set_recent_check_ins] = useState<RecentCheckIn[]>(
		[]
	);
	const barcode_input_ref = useRef<HTMLInputElement>(null);

	const { selected_branch } = useSelectedBranch();

	const {
		data: item_info,
		isLoading: loading_item,
		refetch: fetch_item_details,
		error: item_error
	} = useCopyById(barcode_input ? parseInt(barcode_input) : null);

	const { mutate: return_book, isPending: is_returning } = useReturnBook();

	const { data: checked_out_copies, isLoading: loading_checked_out_copies } =
		useCheckedOutCopiesSimple();

	// Auto-focus barcode input on mount
	useEffect(() => {
		barcode_input_ref.current?.focus();
	}, []);

	// Handle errors
	useEffect(() => {
		if (item_error) {
			set_error_message(
				"Copy not found. Please check the barcode and try again."
			);
		}
	}, [item_error]);

	const handle_barcode_submit = () => {
		const copy_id = parseInt(barcode_input);
		if (isNaN(copy_id) || copy_id <= 0) {
			set_error_message("Please enter a valid Copy ID (Barcode)");
			return;
		}
		fetch_item_details();
	};

	const handle_checked_out_clicked = (copy_id: number) => {
		set_error_message(null);
		set_barcode_input(copy_id.toString());
	};

	const handle_confirm_checkin = (
		new_condition?: Item_Condition,
		notes?: string
	) => {
		if (!item_info) return;

		return_book(
			{
				copy_id: item_info.id,
				new_condition: new_condition || item_info.condition,
				new_location_id: selected_branch?.id || item_info.branch_id,
				notes: notes
			},
			{
				onSuccess: (data: Checkin_Receipt | null) => {
					if (!data) return;
					// Add to recent check-ins
					set_recent_check_ins((prev) => [
						{
							copy_id: item_info.id,
							title: data.title,
							timestamp: new Date(),
							had_fine: (data.fine_amount || 0) > 0,
							fine_amount: data.fine_amount
						},
						...prev.slice(0, 9) // Keep last 10
					]);

					// Clear form and refocus
					set_barcode_input("");
					set_error_message(null);
					barcode_input_ref.current?.focus();
				},
				onError: (error: Error) => {
					set_error_message(`Failed to check in: ${error.message}`);
				}
			}
		);
	};

	const handle_cancel = () => {
		set_barcode_input("");
		set_error_message(null);
		barcode_input_ref.current?.focus();
	};

	const has_valid_item =
		item_info &&
		["CHECKED OUT", "RESERVED"].includes(item_info.status.toUpperCase()) &&
		!error_message;

	const found_available_item =
		item_info && item_info.status.toUpperCase() === "AVAILABLE";

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns}>
			<PageContainer width="xl" scroll={true}>
				<PageTitle title="Check In Item" Icon_Component={Input} />
				<Stack gap={2}>
					{/* Barcode Input Section */}
					<Paper
						sx={{ px: 4, py: 3, borderRadius: 16, cornerShape: "squircle" }}
					>
						<Typography variant="h6" gutterBottom fontWeight="bold">
							Scan or Enter Copy ID - {barcode_input} - {typeof barcode_input}
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Scan the barcode or manually enter the Copy ID to check in an
							item. {item_info?.status}
						</Typography>

						<Stack direction="row" spacing={2}>
							<TextField
								inputRef={barcode_input_ref}
								label="Copy ID"
								value={barcode_input}
								onChange={(e) => set_barcode_input(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										handle_barcode_submit();
									} else if (e.key === "Escape") {
										handle_cancel();
									}
								}}
								placeholder="Enter Copy ID"
								type="number"
								fullWidth
								error={!!error_message}
								disabled={loading_item || is_returning}
								autoFocus
							/>
							<Button
								variant="contained"
								onClick={handle_barcode_submit}
								disabled={!barcode_input || loading_item || is_returning}
								sx={{ minWidth: 120 }}
								startIcon={loading_item ? <CircularProgress size={20} /> : null}
							>
								{loading_item ? "Searching..." : "Lookup"}
							</Button>
						</Stack>

						<Activity
							name="error-alert"
							mode={error_message ? "visible" : "hidden"}
						>
							<Alert
								severity="error"
								sx={{ mt: 2 }}
								icon={<ErrorOutline />}
								onClose={() => set_error_message(null)}
							>
								{error_message}
							</Alert>
						</Activity>
					</Paper>
					<Paper
						sx={{ px: 4, py: 3, borderRadius: 16, cornerShape: "squircle" }}
					>
						<Stack
							sx={{ alignSelf: "flex-start" }}
							direction="row"
							gap={2}
							alignItems="center"
						>
							<IconButton
								onClick={() => set_show_checked_out(!show_checked_out)}
							>
								<ArrowUpward
									sx={{
										transform: show_checked_out
											? "rotate(180deg)"
											: "rotate(0deg)",
										transitionProperty: "transform",
										transitionDuration: "0.2s"
									}}
								/>
							</IconButton>
							<Typography variant="h6" fontWeight="bold">
								Checked Out Copies
							</Typography>
						</Stack>
						{!loading_checked_out_copies && checked_out_copies && (
							<Collapse in={show_checked_out}>
								<Stack direction="row" gap={2} flexWrap={"wrap"} sx={{ my: 2 }}>
									{checked_out_copies.map((copy) => (
										<Chip
											sx={{
												maxWidth: 200,
												["&:hover"]: { cursor: "pointer", boxShadow: 3 }
											}}
											key={copy.id}
											label={copy.id + ": " + copy.title}
											variant="outlined"
											icon={get_checked_out_copy_chip_icon(
												copy.item_type,
												copy.is_overdue
											)}
											onClick={() => handle_checked_out_clicked(copy.id)}
										/>
									))}
								</Stack>
							</Collapse>
						)}
					</Paper>

					{/* Item Preview Card */}
					{has_valid_item && (
						<QuickCheckInCard
							item_info={item_info}
							on_confirm={handle_confirm_checkin}
							on_cancel={handle_cancel}
							is_processing={is_returning}
						/>
					)}

					{found_available_item && (
						<Alert
							severity="info"
							sx={{ mt: 2 }}
							icon={<InfoOutline />}
							onClose={() => set_barcode_input("")}
						>
							{"Item is not currently checked out."}
						</Alert>
					)}

					{/* Recent Check-Ins */}
					{recent_check_ins.length > 0 && (
						<RecentCheckInsList check_ins={recent_check_ins} />
					)}
				</Stack>
			</PageContainer>
		</LocalizationProvider>
	);
};

function get_checked_out_copy_chip_icon(
	item_type: Library_Item_Type,
	is_overdue: boolean
) {
	const color = is_overdue ? "error" : "success";
	switch (item_type) {
		case "BOOK":
			return <ChromeReaderMode color={color} />;
		case "MAGAZINE":
			return <MenuBook color={color} />;
		case "PERIODICAL":
			return <Newspaper color={color} />;
		case "RECORDING":
			return <Mic color={color} />;
		case "AUDIOBOOK":
			return <ChromeReaderMode color={color} />;
		case "VIDEO":
			return <YouTube color={color} />;
		case "CD":
			return <Album color={color} />;
		case "VINYL":
			return <Album color={color} />;
		default:
			return <QuestionMark color={color} />;
	}
}
