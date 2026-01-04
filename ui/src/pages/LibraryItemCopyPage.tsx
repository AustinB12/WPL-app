import { Book as BookIcon, Delete, Edit, MoreVert } from "@mui/icons-material";
import {
	Card,
	CardHeader,
	Grid,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	MenuList,
	Stack,
	Typography
} from "@mui/material";
import { Activity, Suspense } from "react";
import { useParams } from "react-router-dom";
import { PageContainer, PageTitle } from "../components/common/PageBuilders";
import { useCopyById } from "../hooks/useCopies";
import React from "react";
import { useLibraryItemById } from "../hooks/useLibraryItems";
import { GenreChip } from "../components/common/GenreChip";

export const Library_Item_Copy_Page = () => {
	const { library_item_copy_id } = useParams();
	const { data: item_copy, isLoading: item_loading } = useCopyById(
		parseInt(library_item_copy_id!)
	);

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	const { data: library_item } = useLibraryItemById(
		item_copy?.library_item_id!
	);

	const page_loading = !library_item_copy_id || item_loading;
	return (
		<PageContainer width="xl" sx={{ overflowY: "auto" }}>
			<Stack spacing={2} onClick={() => console.log(item_copy, library_item)}>
				<Card sx={{ borderRadius: 3 }}>
					<CardHeader
						action={
							<>
								<IconButton onClick={handleClick}>
									<MoreVert />
								</IconButton>
								<Menu
									id="basic-menu"
									anchorEl={anchorEl}
									open={open}
									onClose={handleClose}
									slotProps={{
										list: {
											"aria-labelledby": "basic-button"
										}
									}}
								>
									<MenuList>
										<MenuItem onClick={handleClose}>
											<ListItemIcon>
												<Edit />
											</ListItemIcon>
											<ListItemText>Edit</ListItemText>
										</MenuItem>
										<MenuItem onClick={handleClose}>
											<ListItemIcon>
												<Delete />
											</ListItemIcon>
											<ListItemText>Delete</ListItemText>
										</MenuItem>
									</MenuList>
								</Menu>
							</>
						}
						title={
							<PageTitle
								loading={page_loading}
								title={page_loading ? "Library Item" : `${item_copy?.title}`}
								Icon_Component={BookIcon}
							></PageTitle>
						}
					/>

					<Typography sx={{ px: 2 }} variant="subtitle1" color="text.secondary">
						{item_copy?.description}
					</Typography>
					<Activity mode={library_item?.genres ? "visible" : "hidden"}>
						<Stack sx={{ px: 2, py: 1 }} direction={"row"} gap={1}>
							{library_item?.genres.map((b) => (
								<GenreChip genre={b} />
							))}
						</Stack>
					</Activity>
				</Card>

				<Grid container spacing={2}>
					<Suspense fallback={<div>Loading content...</div>}>
						<Grid size={8}>
							{/* <LIP_Section>
								<Stack spacing={2}>
									<Stack direction={'row'} justifyContent={'space-between'}>
										<LIP_Field label="Title" value={data?.title || ''} />
									</Stack>
									<Stack direction={'row'} justifyContent={'space-between'}>
										<LIP_Field
											label="Publisher"
											value={
												data?.publisher ||
												data?.audiobook_publisher ||
												'Unknown'
											}
										/>
									</Stack>
									<Stack direction={'row'} justifyContent={'space-between'}>
										<LIP_Field
											label="Number of Pages"
											value={data?.number_of_pages?.toString() || 'N/A'}
										/>
										<LIP_Field
											label="Publication Year"
											value={data?.publication_year?.toString() || 'N/A'}
										/>
									</Stack>
									<LIP_Field
										label="Description"
										value={data?.description || 'No description available'}
									/>
									<Stack direction={'row'} justifyContent={'space-between'}>
										<LIP_Field
											label="Total Copies"
											value={data?.total_copies || 'N/A'}
										/>
										<LIP_Field
											label="Available Copies"
											value={data?.available_copies || 'N/A'}
										/>
										<LIP_Field
											label="Checked Out Copies"
											value={data?.checked_out_copies?.toString() || 'N/A'}
										/>
									</Stack>
								</Stack>
							</LIP_Section> */}
						</Grid>
						<Grid size={4}>
							<img
								style={{ width: "97%", borderRadius: "8px" }}
								src={
									library_item?.cover_image_url ||
									library_item?.audiobook_cover_image ||
									""
								}
								alt={`Cover image of ${library_item?.title || ""}`}
							/>
						</Grid>
					</Suspense>
				</Grid>
			</Stack>
		</PageContainer>
	);
};
