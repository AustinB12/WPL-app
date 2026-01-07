import express from "express";
import { body, validationResult } from "express-validator";
import * as db from "../config/database.js";
import { format_sql_datetime } from "../utils.js";

const router = express.Router();

const validate_checkout = [
	body("patron_id")
		.isInt({ min: 1 })
		.withMessage("Valid patron ID is required"),
	body("copy_id").isInt({ min: 1 }).withMessage("Valid copy ID is required"),
	body("due_date").optional().isISO8601().withMessage("Invalid due date format")
];

// Helper function to handle validation errors
const handle_validation_errors = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			error: "Validation failed",
			details: errors.array()
		});
	}
	next();
};

// PUT /api/v1/reshelve - Mark item copies as reshelved
router.put("/reshelve", async (req, res) => {
	const now = format_sql_datetime(new Date());
	try {
		const { copy_ids } = req.body;
		if (!copy_ids || !Array.isArray(copy_ids)) {
			return res.status(400).json({
				error: "copy_ids must be provided as an array"
			});
		}
		await db.execute_transaction(async () => {
			for (const copy_id of copy_ids) {
				const item_copy = await db.get_by_id("LIBRARY_ITEM_COPIES", copy_id);
				if (!item_copy) {
					throw new Error(`Item copy with ID ${copy_id} not found`);
				}

				// Validate item is in Unshelved status before reshelving
				if (item_copy.status !== "Unshelved") {
					throw new Error(
						`Item copy with ID ${copy_id} cannot be reshelved. Current status: ${item_copy.status}`
					);
				}

				await db.update_record("LIBRARY_ITEM_COPIES", item_copy.id, {
					status: "Available",
					updated_at: now
				});

				const reshelve_transaction_data = {
					copy_id: item_copy.id,
					location_id: item_copy.current_branch_id,
					transaction_type: "RESHELVE",
					created_at: now
				};

				await db.create_record("ITEM_TRANSACTIONS", reshelve_transaction_data);
			}
		});

		res.json({
			success: true,
			message: "Item copies reshelved successfully",
			data: {
				reshelved_count: copy_ids.length
			}
		});
	} catch (error) {
		res.status(500).json({
			error: "Failed to reshelve item copies",
			message: error.message
		});
	}
});

// GET /api/v1/transactions - Get all transactions
router.get("/", async (req, res) => {
	try {
		const { patron_id, transaction_type, order_by } = req.query;
		let conditions = "";
		const params = [];

		const filters = [];
		if (patron_id) {
			filters.push("t.patron_id = ?");
			params.push(patron_id);
		}
		if (transaction_type) {
			filters.push("t.transaction_type = ?");
			params.push(transaction_type);
		}

		if (filters.length > 0) {
			conditions = ` WHERE ${filters.join(" AND ")}`;
		}

		const query = `
      SELECT 
        t.*,
        p.first_name,
        p.last_name,
        li.title,
        li.item_type,
        ic.library_item_id,
        ic.condition,
        b.id as current_branch_id,
        b.branch_name as current_branch_name,
        bb.id as owning_branch_id,
        bb.branch_name as owning_branch_name
      FROM ITEM_TRANSACTIONS t
      LEFT JOIN PATRONS p ON t.patron_id = p.id
      LEFT JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
      LEFT JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      LEFT JOIN BRANCHES b ON ic.current_branch_id = b.id
      LEFT JOIN BRANCHES bb ON ic.owning_branch_id = bb.id
      ${conditions}
      ORDER BY ${order_by || "t.created_at"} DESC
    `;

		const transactions = await db.execute_query(query, params);

		// Add copy labels to transactions
		const transactions_with_labels = await Promise.all(
			transactions.map(async (transaction) => {
				const all_copies = await db.execute_query(
					"SELECT id FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? ORDER BY id",
					[transaction.library_item_id]
				);

				const copy_index = all_copies.findIndex(
					(c) => c.id === transaction.copy_id
				);
				const copy_number = copy_index + 1;
				const total_copies = all_copies.length;
				const copy_label = `Copy ${copy_number} of ${total_copies}`;

				return {
					...transaction,
					copy_label,
					copy_number,
					total_copies
				};
			})
		);

		res.json({
			success: true,
			count: transactions_with_labels.length,
			data: transactions_with_labels
		});
	} catch (error) {
		res.status(500).json({
			error: "Failed to fetch transactions",
			message: error.message
		});
	}
});

// GET /api/v1/transactions/checkin-lookup/:copy_id - Get checked-out copy by Copy ID (barcode)
router.get("/checkin-lookup/:copy_id", async (req, res) => {
	try {
		const copy_id = parseInt(req.params.copy_id, 10);

		if (Number.isNaN(copy_id)) {
			return res.status(400).json({
				error: "Invalid Copy ID"
			});
		}

		// Get the copy
		const copy = await db.get_by_id("LIBRARY_ITEM_COPIES", copy_id);
		if (!copy) {
			return res.status(404).json({
				error: "Copy not found"
			});
		}

		// Check if copy is checked out (case-insensitive, trim whitespace)
		// Also check for "Renewed Once" and "Renewed Twice" as they are still checked out
		const status_upper = (copy.status || "").trim().toUpperCase();
		const is_checked_out =
			status_upper === "CHECKED OUT" ||
			status_upper === "RENEWED ONCE" ||
			status_upper === "RENEWED TWICE";

		if (!is_checked_out) {
			return res.status(200).json({
				error: `This copy is not checked out. Current status: ${copy.status || "null"}`
			});
		}

		// Get the active checkout transaction (case-insensitive)
		const transaction = await db.execute_query(
			`SELECT * FROM ITEM_TRANSACTIONS 
       WHERE item_copy_id = ? AND UPPER(transaction_type) = 'CHECKOUT' 
       LIMIT 1`,
			[copy_id]
		);

		if (transaction.length === 0) {
			return res.status(200).json({
				error: "No active checkout transaction found for this copy"
			});
		}

		const checkout_transaction = transaction[0];

		// Get patron info
		const patron = await db.get_by_id(
			"PATRONS",
			checkout_transaction.patron_id
		);
		if (!patron) {
			return res.status(200).json({
				error: "Patron not found"
			});
		}

		// Get library item details
		const library_item = await db.get_by_id(
			"LIBRARY_ITEMS",
			copy.library_item_id
		);
		if (!library_item) {
			return res.status(200).json({
				error: "Library item not found"
			});
		}

		// Get item type-specific info
		let item_type_info = {};
		if (
			library_item.item_type === "BOOK" ||
			library_item.item_type === "book"
		) {
			const books = await db.execute_query(
				"SELECT * FROM BOOKS WHERE library_item_id = ?",
				[copy.library_item_id]
			);
			item_type_info = books[0] || {};
		} else if (
			library_item.item_type === "VIDEO" ||
			library_item.item_type === "video"
		) {
			const videos = await db.execute_query(
				"SELECT * FROM VIDEOS WHERE library_item_id = ?",
				[copy.library_item_id]
			);
			item_type_info = videos[0] || {};
		}

		// Calculate if overdue
		const due_date = new Date(checkout_transaction.due_date);
		const today = new Date();
		const is_overdue = today > due_date;
		const days_overdue = is_overdue
			? Math.ceil(
					(today.getTime() - due_date.getTime()) / (1000 * 60 * 60 * 24)
				)
			: 0;
		let fine_amount = days_overdue * 1.0; // $1.00 per day
		// Cap fine at book cost
		if (copy.cost && fine_amount > copy.cost) {
			fine_amount = copy.cost;
		}

		// Get total copies count for this item
		const all_copies = await db.execute_query(
			"SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? ORDER BY id",
			[copy.library_item_id]
		);
		const copy_index = all_copies.findIndex((c) => c.id === copy_id);
		const copy_number = copy_index >= 0 ? copy_index + 1 : 1;

		res.json({
			success: true,
			data: {
				item: {
					id: library_item.id,
					title: library_item.title,
					item_type: library_item.item_type,
					...item_type_info
				},
				copy: {
					copy_id: copy_id,
					copy_label: `Copy ${copy_number} of ${all_copies.length}`,
					copy_number,
					total_copies: all_copies.length,
					...copy
				},
				patron: {
					...patron
				},
				transaction: {
					...checkout_transaction,
					is_overdue,
					days_overdue,
					fine_amount
				}
			}
		});
	} catch (error) {
		console.error("Error in checkin-lookup:", error);
		res.status(500).json({
			error: "Failed to lookup copy",
			message: error.message,
			stack: process.env.NODE_ENV === "development" ? error.stack : undefined
		});
	}
});

// GET /api/v1/transactions/checked-out - Get all checked-out items ready for check-in
router.get("/checked-out", async (req, res) => {
	try {
		const { branch_id } = req.query;

		// Get all active checkout transactions with item and patron details
		const query = `
      SELECT 
        t.id as transaction_id,
        t.item_copy_id,
        t.patron_id,
        t.date,
        ic.status as copy_status,
        ic.condition,
        ic.library_item_id,
        ic.owning_branch_id,
        ic.current_branch_id,
        li.title,
        li.item_type,
        p.first_name,
        p.last_name,
        p.email,
        CASE 
           WHEN t.due_date < DATETIME('now', 'localtime') THEN 1  
          ELSE 0 
        END as is_overdue,
        CASE 
          WHEN t.due_date > DATETIME('now', 'localtime') THEN 
            CAST(julianday('now') - julianday(t.due_date) AS INTEGER)
          ELSE 0 
        END as days_overdue
      FROM ITEM_TRANSACTIONS t
      INNER JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
      INNER JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
      INNER JOIN PATRONS p ON t.patron_id = p.id
      WHERE UPPER(t.transaction_type) = 'CHECKOUT'
        AND (UPPER(ic.status) = 'CHECKED OUT' 
             OR UPPER(ic.status) = 'RENEWED ONCE' 
             OR UPPER(ic.status) = 'RENEWED TWICE')
        ${branch_id ? "AND (ic.current_branch_id = ? OR ic.owning_branch_id = ?)" : ""}
      ORDER BY t.due_date ASC, li.title ASC
    `;

		const params = branch_id ? [branch_id, branch_id] : [];
		const results = await db.execute_query(query, params);

		if (results.length === 0) {
			return res.json({
				success: true,
				count: 0,
				data: []
			});
		}

		// Get unique library item IDs to fetch copy counts efficiently
		const library_item_ids = [
			...new Set(results.map((r) => r.library_item_id))
		];

		// Fetch all copies for all library items in a single query
		const copy_counts_query = `
      SELECT 
        library_item_id,
        id as copy_id,
        ROW_NUMBER() OVER (PARTITION BY library_item_id ORDER BY id) as copy_position,
        COUNT(*) OVER (PARTITION BY library_item_id) as total_copies
      FROM LIBRARY_ITEM_COPIES
      WHERE library_item_id IN (${library_item_ids.map(() => "?").join(", ")})
      ORDER BY library_item_id, id
    `;

		const copy_info = await db.execute_query(
			copy_counts_query,
			library_item_ids
		);

		// Create a lookup map for O(1) access
		const copy_lookup = new Map();
		copy_info.forEach((info) => {
			copy_lookup.set(info.copy_id, {
				copy_number: info.copy_position,
				total_copies: info.total_copies
			});
		});

		// Add copy labels using the lookup map
		const results_with_labels = results.map((item) => {
			const copy_data = copy_lookup.get(item.copy_id) || {
				copy_number: 1,
				total_copies: 1
			};

			return {
				...item,
				copy_label: `Copy ${copy_data.copy_number} of ${copy_data.total_copies}`,
				copy_number: copy_data.copy_number,
				total_copies: copy_data.total_copies,
				patron_name: `${item.first_name} ${item.last_name}`
			};
		});

		res.json({
			success: true,
			count: results_with_labels.length,
			data: results_with_labels
		});
	} catch (error) {
		console.error("Error fetching checked-out items:", error);
		res.status(500).json({
			error: "Failed to fetch checked-out items",
			message: error.message
		});
	}
});

// GET /api/v1/transactions/:id - Get single transaction
router.get("/:id", async (req, res) => {
	try {
		const query = `
      SELECT 
        t.*,
        p.first_name,
        p.last_name,
        p.email,
        ci.title,
        ci.item_type,
        b.branch_name
      FROM ITEM_TRANSACTIONS t
      JOIN PATRONS p ON t.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
      JOIN LIBRARY_ITEMS ci ON ic.library_item_id = ci.id
      JOIN BRANCHES b ON ic.owning_branch_id = b.id
      WHERE t.id = ?
    `;

		const results = await db.execute_query(query, [req.params.id]);
		const transaction = results[0];

		if (!transaction) {
			return res.status(404).json({
				error: "Transaction not found"
			});
		}

		res.json({
			success: true,
			data: transaction
		});
	} catch (error) {
		res.status(500).json({
			error: "Failed to fetch transaction",
			message: error.message
		});
	}
});

// GET /api/v1/transactions/patron/:patron_id - Get all transactions for a patron
router.get("/patron/:patron_id", async (req, res) => {
	try {
		const query = `
      SELECT 
        t.*,
        p.first_name,
        p.last_name,
        ci.title,
        ci.item_type,
        ic.condition,
        b.branch_name
      FROM ITEM_TRANSACTIONS t
      JOIN PATRONS p ON t.patron_id = p.id
      JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
      JOIN LIBRARY_ITEMS ci ON ic.library_item_id = ci.id
      JOIN BRANCHES b ON ic.owning_branch_id = b.id
      WHERE t.patron_id = ?
    `;

		const results = await db.execute_query(query, [req.params.patron_id]);
		res.json({
			success: true,
			count: results.length,
			data: results
		});
	} catch (error) {
		res.status(500).json({
			error: "Failed to fetch transactions",
			message: error.message
		});
	}
});

// POST /api/v1/transactions/checkout - Checkout item
router.post(
	"/checkout",
	validate_checkout,
	handle_validation_errors,
	async (req, res) => {
		try {
			const now = format_sql_datetime(new Date());
			const { copy_id, patron_id, clear_fines = false } = req.body;

			// Process expired reservations before checkout
			// Import process_expired_reservations function from reservations route
			// For now, we'll inline the expiry check
			const expired_reservations = await db.execute_query(
				'SELECT * FROM RESERVATIONS WHERE status = "ready" AND expiry_date < ?',
				[now]
			);

			for (const reservation of expired_reservations) {
				await db.update_record("RESERVATIONS", reservation.id, {
					status: "expired",
					updated_at: now
				});

				const copies = await db.execute_query(
					'SELECT * FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status = "Reserved" LIMIT 1',
					[reservation.library_item_id]
				);

				if (copies.length > 0) {
					await db.update_record("LIBRARY_ITEM_COPIES", copies[0].id, {
						status: "returned",
						updated_at: now
					});

					const next_in_queue = await db.execute_query(
						'SELECT * FROM RESERVATIONS WHERE item_copy_id = ? AND status = "waiting" ORDER BY queue_position LIMIT 1',
						[reservation.library_item_id]
					);

					if (next_in_queue.length > 0) {
						const new_expiry = new Date();
						new_expiry.setDate(new_expiry.getDate() + 5);

						await db.update_record("RESERVATIONS", next_in_queue[0].id, {
							status: "ready",
							expiry_date: format_sql_datetime(new_expiry),
							updated_at: now
						});

						await db.update_record("LIBRARY_ITEM_COPIES", copies[0].id, {
							status: "Reserved",
							updated_at: now
						});
					}
				}
			}

			// Verify item copy exists and is available
			const item_copy = await db.get_by_id("LIBRARY_ITEM_COPIES", copy_id);
			if (!item_copy) {
				return res.status(400).json({
					error: "Item copy not found"
				});
			}

			// Check if item is available or reserved
			if (item_copy.status !== "Available" && item_copy.status !== "Reserved") {
				return res.status(400).json({
					error: "Item is not available for checkout",
					current_status: item_copy.status
				});
			}

			// ALWAYS check for reservations - this is the primary check
			// Check if there are any waiting/ready reservations for this library item by other patrons
			// Only block if another patron has a BETTER queue position (lower number)
			// This allows multiple patrons to check out different copies of the same item

			// First, check if THIS patron has a reservation
			const patron_reservation = await db.execute_query(
				'SELECT * FROM RESERVATIONS WHERE item_copy_id = ? AND patron_id = ? AND status IN ("waiting", "ready") ORDER BY queue_position LIMIT 1',
				[item_copy.library_item_id, patron_id]
			);

			// If patron has no reservation, check if there are ANY other active reservations
			// If patron HAS a reservation, only block if someone else has a BETTER queue position
			let other_patron_reservations = [];

			if (patron_reservation.length === 0) {
				// Patron has no reservation - block if there are ANY other reservations
				other_patron_reservations = await db.execute_query(
					'SELECT * FROM RESERVATIONS WHERE item_copy_id = ? AND status IN ("waiting", "ready") ORDER BY queue_position LIMIT 1',
					[item_copy.library_item_id]
				);
			} else {
				// Patron has a reservation - only block if someone else has a better queue position
				const patron_queue_pos = patron_reservation[0].queue_position;
				other_patron_reservations = await db.execute_query(
					'SELECT * FROM RESERVATIONS WHERE item_copy_id = ? AND patron_id != ? AND status IN ("waiting", "ready") AND queue_position < ? ORDER BY queue_position LIMIT 1',
					[item_copy.library_item_id, patron_id, patron_queue_pos]
				);
			}

			if (other_patron_reservations.length > 0) {
				// Get all reservations in queue to show who's waiting
				const all_reservations = await db.execute_query(
					`SELECT 
            r.*,
            p.first_name,
            p.last_name,
            p.email
          FROM RESERVATIONS r
          JOIN PATRONS p ON r.patron_id = p.id
          WHERE r.library_item_id = ? AND r.status IN ("waiting", "ready")
          ORDER BY r.queue_position ASC`,
					[item_copy.library_item_id]
				);

				return res.status(400).json({
					error: "Item is reserved for another patron",
					message: "This item has reservations that must be fulfilled first",
					queue: all_reservations.map((r) => ({
						patron_id: r.patron_id,
						patron_name: `${r.first_name} ${r.last_name}`,
						queue_position: r.queue_position,
						status: r.status
					}))
				});
			}

			// If item copy status is "Reserved", verify the patron has a reservation for it
			// (This is a secondary check - the primary check above already handles reservations)
			let reservation_to_fulfill = null;
			if (item_copy.status === "Reserved" || item_copy.status === "reserved") {
				const reservations = await db.execute_query(
					'SELECT * FROM RESERVATIONS WHERE item_copy_id = ? AND patron_id = ? AND status IN ("waiting", "ready") ORDER BY queue_position LIMIT 1',
					[item_copy.library_item_id, patron_id]
				);

				if (reservations.length === 0) {
					// Get all reservations in queue to show who's waiting
					const all_reservations = await db.execute_query(
						`SELECT 
              r.*,
              p.first_name,
              p.last_name,
              p.email
            FROM RESERVATIONS r
            JOIN PATRONS p ON r.patron_id = p.id
            WHERE r.library_item_id = ? AND r.status IN ("waiting", "ready")
            ORDER BY r.queue_position ASC`,
						[item_copy.library_item_id]
					);

					return res.status(400).json({
						error: "Item is reserved for another patron",
						message:
							"This item is reserved and you do not have an active reservation for it",
						queue: all_reservations.map((r) => ({
							patron_id: r.patron_id,
							patron_name: `${r.first_name} ${r.last_name}`,
							queue_position: r.queue_position,
							status: r.status
						}))
					});
				}

				reservation_to_fulfill = reservations[0];
			} else if (patron_reservation.length > 0) {
				// Item status is "Available" but patron has a reservation - this is valid, fulfill it
				reservation_to_fulfill = patron_reservation[0];
			}

			// Verify patron exists and is active
			const patron = await db.get_by_id("PATRONS", patron_id);
			if (!patron || !patron.is_active) {
				return res.status(400).json({
					error: "Patron not found or inactive"
				});
			}

			// Check patron eligibility (per acceptance criteria)
			const current_date = new Date();

			// 1. Check if patron's card is expired
			if (
				patron.card_expiration_date &&
				patron.card_expiration_date < current_date
			) {
				return res.status(400).json({
					error: "Patron's card is expired",
					message: "Card expiration must be extended before checkout"
				});
			}

			// 2. Check if patron has outstanding fines
			// If clear_fines is true, clear the balance before proceeding
			if (patron.balance > 0) {
				if (clear_fines) {
					// Clear the patron's balance (assumes fine was paid externally)
					await db.execute_query(
						"UPDATE PATRONS SET balance = 0 WHERE id = ?",
						[patron_id]
					);
					// Refresh patron data
					const updated_patron = await db.get_by_id("PATRONS", patron_id);
					patron.balance = updated_patron.balance;
				} else {
					return res.status(400).json({
						error: "Patron has outstanding fines",
						message: `Patron owes $${patron.balance.toFixed(2)}. Fines must be resolved before checkout`
					});
				}
			}

			// 3. Check if patron has too many books checked out (hard block - cannot override)
			// Use UPPER() to handle case-insensitive comparison for both status and transaction_type
			const active_checkout_count = await db.execute_query(
				'SELECT COUNT(*) as count FROM ITEM_TRANSACTIONS WHERE patron_id = ? AND UPPER(transaction_type) = "CHECKOUT"',
				[patron_id]
			);

			const current_count = active_checkout_count[0]?.count || 0;

			// Block if patron already has 20 or more books checked out (hard limit - cannot override)
			if (current_count >= 20) {
				return res.status(400).json({
					error: "Patron has too many books checked out",
					message: `Patron has ${current_count} books checked out. Maximum is 20. Cannot checkout additional items.`
				});
			}

			const library_item = await db.get_by_id(
				"LIBRARY_ITEMS",
				item_copy.library_item_id
			);

			const this_year = new Date().getFullYear();

			// Calculate due date based on item type (per acceptance criteria)
			// Books: 4 weeks (28 days)
			// Movies: 1 week (7 days) for old, 3 days for new
			const checkout_date = new Date();
			const calculated_due_date =
				library_item.item_type === "VIDEO" || library_item.item_type === "video"
					? library_item.publication_year >= this_year - 1
						? new Date(checkout_date.getTime() + 3 * 24 * 60 * 60 * 1000) // New Movies: 3 days
						: new Date(checkout_date.getTime() + 7 * 24 * 60 * 60 * 1000) // Movies: 1 week (7 days)
					: new Date(checkout_date.getTime() + 28 * 24 * 60 * 60 * 1000); // Books: 4 weeks (28 days)

			// Create transaction
			const transaction_data = {
				item_copy_id: copy_id,
				patron_id,
				location_id: item_copy.current_branch_id,
				transaction_type: "CHECKOUT",
				date: now,
				created_at: now
			};

			await db.create_record("ITEM_TRANSACTIONS", transaction_data);

			// Update item copy status and checkout info
			await db.update_record("LIBRARY_ITEM_COPIES", copy_id, {
				status: "Checked Out",
				checked_out_by: patron_id,
				due_date: format_sql_datetime(calculated_due_date),
				updated_at: now
			});

			// If this checkout fulfills a reservation, update the reservation status
			let reservation_info = null;
			if (reservation_to_fulfill) {
				await db.update_record("RESERVATIONS", reservation_to_fulfill.id, {
					status: "fulfilled",
					fulfillment_date: now,
					updated_at: now
				});

				// Update queue positions for remaining reservations
				await db.execute_query(
					'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND queue_position > ? AND status IN ("waiting", "ready")',
					[item_copy.library_item_id, reservation_to_fulfill.queue_position]
				);

				// Log fulfillment transaction
				await db.create_record("ITEM_TRANSACTIONS", {
					copy_id,
					patron_id,
					location_id: 1,
					transaction_type: "Reservation Fulfilled",
					notes: `Reservation #${reservation_to_fulfill.id} fulfilled via checkout`,
					created_at: now
				});

				// Get reservation info for response
				reservation_info = {
					reservation_id: reservation_to_fulfill.id,
					queue_position: reservation_to_fulfill.queue_position,
					status: "fulfilled",
					was_reserved: true
				};
			}

			// Fetch enriched data for receipt
			const query = `
        SELECT
          t.*,
          p.first_name,
          p.last_name,
          li.title,
          li.item_type,
          li.publication_year,
          b.author,
          b.publisher,
          v.director,
          v.studio,
          v.is_new_release
        FROM ITEM_TRANSACTIONS t
        JOIN PATRONS p ON t.patron_id = p.id
        JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
        JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
        LEFT JOIN BOOKS b ON li.id = b.library_item_id
        LEFT JOIN VIDEOS v ON li.id = v.library_item_id
        WHERE t.item_copy_id = ? AND t.patron_id = ? AND t.transaction_type = 'checkout'
        ORDER BY t.created_at DESC
        LIMIT 1
      `;

			const results = await db.execute_query(query, [copy_id, patron_id]);
			const enriched_transaction = results[0];

			res.status(201).json({
				success: true,
				message: reservation_info
					? "Item checked out successfully - Reservation fulfilled"
					: "Item checked out successfully",
				data: {
					...enriched_transaction,
					...patron,
					...item_copy,
					...library_item,
					...transaction_data,
					reservation: reservation_info
				}
			});
		} catch (error) {
			res.status(500).json({
				error: "Failed to checkout item",
				message: error.message
			});
		}
	}
);

// POST /api/v1/transactions/checkin - Checkin item
router.post(
	"/checkin",
	[
		body("new_condition")
			.optional()
			.isIn(["New", "Excellent", "Good", "Fair", "Poor"])
			.withMessage("Invalid condition"),
		body("copy_id")
			.notEmpty()
			.withMessage("Valid copy ID is required")
			.custom((value) => {
				// Handle both string and number inputs
				const num = typeof value === "number" ? value : parseInt(value, 10);
				if (Number.isNaN(num) || num <= 0) {
					throw new Error("Copy ID must be a positive number");
				}
				return true;
			})
			.toInt()
	],
	handle_validation_errors,
	async (req, res) => {
		try {
			const { copy_id, new_location_id, new_condition, notes } = req.body;

			// Validate new_location_id if provided
			if (new_location_id) {
				const branch = await db.get_by_id("BRANCHES", new_location_id);
				if (!branch) {
					return res.status(400).json({
						error: "Invalid new_location_id: Branch not found"
					});
				}
			}

			// Find item copy (check status more flexibly)
			const item_copy_found = await db.execute_query(
				"SELECT * FROM LIBRARY_ITEM_COPIES WHERE id = ? LIMIT 1",
				[copy_id]
			);

			if (item_copy_found.length === 0) {
				return res.status(404).json({
					error: "Copy not found"
				});
			}

			const item_copy_to_checkin = item_copy_found[0];
			const status_upper = (item_copy_to_checkin.status || "")
				.trim()
				.toUpperCase();

			// Check if copy is checked out (case-insensitive, trim whitespace)
			// Also check for "Renewed Once" and "Renewed Twice" as they are still checked out
			const is_checked_out =
				status_upper === "CHECKED OUT" ||
				status_upper === "RENEWED ONCE" ||
				status_upper === "RENEWED TWICE";

			if (!is_checked_out) {
				return res.status(400).json({
					error: `This copy is not checked out. Current status: ${item_copy_to_checkin.status || "null"}`
				});
			}

			// Find the check out transaction (case-insensitive)
			const check_out_transaction = await db.execute_query(
				'SELECT * FROM ITEM_TRANSACTIONS WHERE item_copy_id = ? AND UPPER(transaction_type) = "CHECKOUT" LIMIT 1',
				[copy_id]
			);

			if (check_out_transaction.length === 0) {
				return res.status(400).json({
					error: "No active checkout transaction found for this copy"
				});
			}

			const item_copy = item_copy_to_checkin;
			const transaction = check_out_transaction[0];
			const return_date = new Date(); // today
			const due_date = new Date(transaction.due_date);

			// Calculate fine if overdue
			let fine_amount = 0;
			let days_overdue = 0;
			if (return_date > due_date) {
				days_overdue = Math.ceil(
					(return_date - due_date) / (1000 * 60 * 60 * 24)
				);
				fine_amount = days_overdue * 1.0; // $1.00 per day
				// Cap fine at book cost
				if (item_copy.cost && fine_amount > item_copy.cost) {
					fine_amount = item_copy.cost;
				}
			}
			const now = format_sql_datetime(new Date());

			//!! == Execute all database operations in a transaction  == !!
			await db.execute_transaction(async () => {
				// Create a checkin transaction record
				const checkin_transaction_data = {
					item_copy_id: copy_id,
					patron_id: transaction.patron_id,
					location_id: new_location_id || item_copy.current_branch_id,
					transaction_type: "CHECKIN",
					date: now,
					notes: notes || null,
					created_at: now
				};

				const trans_id = await db.create_record(
					"ITEM_TRANSACTIONS",
					checkin_transaction_data
				);

				// Update item copy - initially set to "Unshelved" (will be updated later if there's a reservation)
				await db.update_record("LIBRARY_ITEM_COPIES", copy_id, {
					status: "Unshelved",
					checked_out_by: null,
					due_date: null,
					current_branch_id: new_location_id || item_copy.current_branch_id,
					condition: new_condition || item_copy.condition,
					updated_at: now
				});

				// Update patron balance if there's a fine
				if (fine_amount > 0) {
					await db.execute_query(
						"UPDATE PATRONS SET balance = balance + ? WHERE id = ?",
						[fine_amount, transaction.patron_id]
					);
				}

				// Check if there are any "waiting" reservations for this library item
				const waiting_reservations = await db.execute_query(
					'SELECT * FROM RESERVATIONS WHERE item_copy_id = ? AND status = "waiting" ORDER BY queue_position ASC LIMIT 1',
					[item_copy.library_item_id]
				);

				let reservation_fulfilled = null;
				let final_status = "Unshelved";

				// If there's a waiting reservation, fulfill it automatically
				if (waiting_reservations.length > 0) {
					const next_reservation = waiting_reservations[0];

					// Update reservation to "ready" status
					const expiry_date = new Date();
					expiry_date.setDate(expiry_date.getDate() + 5); // 5 days from now

					await db.update_record("RESERVATIONS", next_reservation.id, {
						status: "ready",
						expiry_date: format_sql_datetime(expiry_date),
						updated_at: now
					});

					// Update queue positions for remaining reservations
					await db.execute_query(
						'UPDATE RESERVATIONS SET queue_position = queue_position - 1 WHERE library_item_id = ? AND queue_position > ? AND status = "waiting"',
						[item_copy.library_item_id, next_reservation.queue_position]
					);

					// Mark the copy as "Reserved" (ready for the reserved patron to pick up)
					final_status = "Reserved";
					reservation_fulfilled = {
						reservation_id: next_reservation.id,
						patron_id: next_reservation.patron_id,
						queue_position: next_reservation.queue_position
					};
				}

				// Update item copy - set status based on whether there's a reservation
				// (other fields already updated in transaction block above)
				await db.update_record("LIBRARY_ITEM_COPIES", copy_id, {
					status: final_status,
					updated_at: now
				});

				// Get enriched data for response (patron, item, branch info)
				const enriched_query = `
        SELECT 
          t.id,
          t.item_copy_id,
          t.patron_id,
          t.date,
          t.transaction_type,
          p.first_name,
          p.last_name,
          p.email,
          li.title,
          li.item_type,
          b.branch_name
        FROM ITEM_TRANSACTIONS t
        LEFT JOIN PATRONS p ON t.patron_id = p.id
        LEFT JOIN LIBRARY_ITEM_COPIES ic ON t.item_copy_id = ic.id
        LEFT JOIN LIBRARY_ITEMS li ON ic.library_item_id = li.id
        LEFT JOIN BRANCHES b ON ic.current_branch_id = b.id
        WHERE t.id = ?
      `;
				const enriched_results = await db.execute_query(enriched_query, [
					trans_id
				]);
				const enriched_transaction = enriched_results[0] || {};

				// Get reserved patron info if reservation was fulfilled
				let reserved_patron_info = null;
				if (reservation_fulfilled) {
					const reserved_patron = await db.get_by_id(
						"PATRONS",
						reservation_fulfilled.patron_id
					);
					if (reserved_patron) {
						reserved_patron_info = {
							id: reserved_patron.id,
							name: `${reserved_patron.first_name} ${reserved_patron.last_name}`,
							email: reserved_patron.email
						};
					}
				}

				// Get updated item copy for response
				const updated_item_copy = await db.get_by_id(
					"LIBRARY_ITEM_COPIES",
					copy_id
				);

				res.json({
					success: true,
					message: reservation_fulfilled
						? "Item checked in successfully and reserved for patron"
						: "Item checked in successfully",
					data: {
						...enriched_transaction,
						id: trans_id,
						transaction_id: trans_id,
						fine_amount,
						days_overdue,
						updated_item_copy: updated_item_copy || null,
						reservation_fulfilled: reservation_fulfilled
							? {
									...reservation_fulfilled,
									patron: reserved_patron_info
								}
							: null
					}
				});
			});
		} catch (error) {
			res.status(500).json({
				error: "Failed to checkin item",
				message: error.message
			});
		}
	}
);

// PUT /api/v1/transactions/:id/renew - Renew transaction
router.put("/:id/renew", async (req, res) => {
	try {
		const transaction = await db.get_by_id("ITEM_TRANSACTIONS", req.params.id);

		if (!transaction) {
			return res.status(404).json({
				error: "Transaction not found"
			});
		}

		// Check renewal status - prevent if already renewed twice
		if (transaction.renewal_status === "Renewed Twice") {
			return res.status(400).json({
				error: "Item has already been renewed twice"
			});
		}

		// Get item copy
		const item_copy = await db.get_by_id(
			"LIBRARY_ITEM_COPIES",
			transaction.copy_id
		);
		if (!item_copy) {
			return res.status(400).json({
				error: "Item copy not found"
			});
		}

		// Check if item is reserved - prevent renewal if copy is reserved or has active reservations
		if (item_copy.status === "Reserved") {
			return res.status(400).json({
				error: "Item is reserved and cannot be renewed",
				message: "This item is currently reserved for another patron"
			});
		}

		// Also check for active reservations on this library item
		const reservations = await db.execute_query(
			'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready")',
			[item_copy.library_item_id]
		);

		if (reservations[0].count > 0) {
			return res.status(400).json({
				error: "Item is reserved",
				message: "This item has active reservations and cannot be renewed"
			});
		}

		// Get patron information
		const patron = await db.get_by_id("PATRONS", transaction.patron_id);
		if (!patron) {
			return res.status(400).json({
				error: "Patron not found"
			});
		}

		// Check if patron's card is expired
		const now = format_sql_datetime(new Date());
		if (patron.card_expiration_date < current_date) {
			return res.status(400).json({
				error: "Patron's card is expired"
			});
		}

		// Check if patron has fines
		if (patron.balance > 0) {
			return res.status(400).json({
				error: "Patron has fines"
			});
		}

		// Check if patron has too many books checked out
		const active_checkout_count = await db.execute_query(
			'SELECT COUNT(*) as count FROM ITEM_TRANSACTIONS WHERE patron_id = ? AND transaction_type IN ("checkout", "CHECKOUT")',
			[transaction.patron_id]
		);

		if (active_checkout_count[0].count >= 20) {
			return res.status(400).json({
				error: "Patron has too many books checked out"
			});
		}

		// Get item details for calculating due date
		const library_item = await db.execute_query(
			"SELECT li.*, v.is_new_release FROM LIBRARY_ITEMS li LEFT JOIN VIDEOS v ON li.id = v.library_item_id WHERE li.id = ?",
			[item_copy.library_item_id]
		);

		// Calculate new due date based on current date (not adding leftover time)
		const current_date_obj = new Date();
		let days_to_add = 14; // Default for books

		if (library_item[0]) {
			if (
				library_item[0].item_type === "VIDEO" ||
				library_item[0].item_type === "video"
			) {
				if (library_item[0].is_new_release === 1) {
					days_to_add = 3; // New release videos: 3 days
				} else {
					days_to_add = 7; // Regular videos: 7 days
				}
			} else if (
				library_item[0].item_type === "BOOK" ||
				library_item[0].item_type === "book"
			) {
				days_to_add = 28; // Books: 4 weeks
			}
		}

		const new_due_date = format_sql_datetime(
			new Date(current_date_obj.getTime() + days_to_add * 24 * 60 * 60 * 1000)
		);

		// Update renewal status
		let new_renewal_status = "Renewed Once";
		if (transaction.renewal_status === "Renewed Once") {
			new_renewal_status = "Renewed Twice";
		}

		// Create a new transaction record for the renewal
		const renewal_transaction = {
			copy_id: transaction.copy_id,
			patron_id: transaction.patron_id,
			location_id: transaction.location_id,
			transaction_type: "RENEW",
			date: now,
			created_at: now
		};
		await db.create_record("ITEM_TRANSACTIONS", renewal_transaction);

		// Update item copy due date (status remains "Checked Out" - renewal is patron-specific)
		await db.update_record("LIBRARY_ITEM_COPIES", transaction.copy_id, {
			due_date: new_due_date,
			updated_at: now
		});

		res.json({
			success: true,
			message: "Transaction renewed successfully",
			data: {
				transaction_id: req.params.id,
				new_due_date,
				renewal_status: new_renewal_status
			}
		});
	} catch (error) {
		res.status(500).json({
			error: "Failed to renew transaction",
			message: error.message
		});
	}
});

// GET /api/v1/transactions/by-copy/:copy_id - Get transaction info by copy ID
router.get("/by-copy/:copy_id", async (req, res) => {
	try {
		const copy_id = req.params.copy_id;

		// Get the active transaction for this copy
		const transactions = await db.execute_query(
			'SELECT * FROM ITEM_TRANSACTIONS WHERE item_copy_id = ? AND transaction_type IN ("checkout", "CHECKOUT") ORDER BY created_at DESC LIMIT 1',
			[copy_id]
		);

		if (transactions.length === 0) {
			return res.status(404).json({
				error: "No active transaction found for this item"
			});
		}

		const transaction = transactions[0];

		// Get item copy information
		const item_copy = await db.get_by_id("LIBRARY_ITEM_COPIES", copy_id);
		if (!item_copy) {
			return res.status(404).json({
				error: "Item copy not found"
			});
		}

		// Get library item information
		const library_item = await db.get_by_id(
			"LIBRARY_ITEMS",
			item_copy.library_item_id
		);
		if (!library_item) {
			return res.status(404).json({
				error: "Library item not found"
			});
		}

		// Get item type-specific information
		let item_details = {};
		if (
			library_item.item_type === "BOOK" ||
			library_item.item_type === "book"
		) {
			const books = await db.execute_query(
				"SELECT * FROM BOOKS WHERE library_item_id = ?",
				[library_item.id]
			);
			item_details = books[0] || {};
		} else if (
			library_item.item_type === "VIDEO" ||
			library_item.item_type === "video"
		) {
			const videos = await db.execute_query(
				"SELECT * FROM VIDEOS WHERE library_item_id = ?",
				[library_item.id]
			);
			item_details = videos[0] || {};
		}

		// Get patron information
		const patron = await db.get_by_id("PATRONS", transaction.patron_id);
		if (!patron) {
			return res.status(404).json({
				error: "Patron not found"
			});
		}

		// Get active checkout count for patron
		const active_checkout_count = await db.execute_query(
			'SELECT COUNT(*) as count FROM ITEM_TRANSACTIONS WHERE patron_id = ? AND transaction_type IN ("checkout", "CHECKOUT")',
			[patron.id]
		);

		// Check for reservations
		const reservations = await db.execute_query(
			'SELECT COUNT(*) as count FROM RESERVATIONS WHERE library_item_id = ? AND status IN ("waiting", "ready")',
			[library_item.id]
		);

		res.json({
			success: true,
			data: {
				transaction: {
					...transaction,
					item_copy,
					library_item: {
						...library_item,
						...item_details
					},
					patron: {
						...patron,
						active_checkouts: active_checkout_count[0].count
					},
					has_reservations: reservations[0].count > 0
				}
			}
		});
	} catch (error) {
		res.status(500).json({
			error: "Failed to fetch transaction information",
			message: error.message
		});
	}
});

// POST /api/v1/transactions/reshelve - Mark item as available (reshelve process)
router.post(
	"/reshelve",
	[body("copy_id").isNumeric().withMessage("Valid copy ID is required")],
	handle_validation_errors,
	async (req, res) => {
		try {
			const { copy_id, branch_id } = req.body;

			const now = format_sql_datetime(new Date());

			// Get item copy
			const item_copy = await db.get_by_id("LIBRARY_ITEM_COPIES", copy_id);
			if (!item_copy) {
				return res.status(400).json({
					error: "Item copy not found"
				});
			}

			// Verify the item is in the correct status for reshelving
			const status_upper = (item_copy.status || "").trim().toUpperCase();
			if (status_upper !== "UNSHELVED") {
				return res.status(400).json({
					error: "Item cannot be reshelved",
					message: `Item status must be "Unshelved" to reshelve. Current status: ${item_copy.status || "null"}`
				});
			}

			// Check if there are "waiting" reservations for this item
			const waiting_reservations = await db.execute_query(
				'SELECT * FROM RESERVATIONS WHERE item_copy_id = ? AND status = "waiting" ORDER BY queue_position LIMIT 1',
				[item_copy.library_item_id]
			);

			let final_status = "Available";
			let promotion_message = "";

			if (waiting_reservations.length > 0) {
				// Promote first waiting reservation to "ready"
				const next_reservation = waiting_reservations[0];
				const new_expiry = new Date();
				new_expiry.setDate(new_expiry.getDate() + 5);

				await db.update_record("RESERVATIONS", next_reservation.id, {
					status: "ready",
					expiry_date: format_sql_datetime(new_expiry),
					updated_at: now
				});

				// Set copy to Reserved for the patron
				final_status = "Reserved";
				promotion_message = " and reservation promoted to ready for pickup";
			}

			const was_reshelved = final_status === "Available";

			await db.create_record("ITEM_TRANSACTIONS", {
				item_copy_id: copy_id,
				patron_id: was_reshelved ? null : waiting_reservations[0].patron_id,
				transaction_type: was_reshelved ? "RESHELVE" : "RESERVATION PROMOTION",
				created_at: now,
				date: now
			});

			// Update item copy status
			await db.update_record("LIBRARY_ITEM_COPIES", copy_id, {
				status: final_status,
				current_branch_id: branch_id || item_copy.owning_branch_id,
				checked_out_by: null,
				due_date: null,
				updated_at: now
			});

			res.json({
				success: true,
				message: `Item marked as ${final_status.toLowerCase()} successfully${promotion_message}`,
				data: {
					copy_id,
					status: final_status,
					branch_id: branch_id || item_copy.owning_branch_id,
					reservation_promoted: waiting_reservations.length > 0
				}
			});
		} catch (error) {
			res.status(500).json({
				error: "Failed to reshelve item copy",
				message: error.message
			});
		}
	}
);

// POST /api/v1/transactions/reshelve-all - Mark multiple items as available (bulk reshelve process)
router.post(
	"/reshelve-all",
	[
		body("copy_ids")
			.isArray({ min: 1 })
			.withMessage("copy_ids must be a non-empty array"),
		body("copy_ids.*")
			.isNumeric()
			.withMessage("Each copy_id must be a valid number")
	],
	handle_validation_errors,
	async (req, res) => {
		try {
			const { copy_ids, branch_id } = req.body;

			const now = format_sql_datetime(new Date());

			const results = [];
			const errors = [];
			let reservations_promoted = 0;

			// Get all item copies at once for efficiency
			const item_copies = await db.get_by_ids("LIBRARY_ITEM_COPIES", copy_ids);
			const item_copies_map = new Map(item_copies.map((ic) => [ic.id, ic]));

			await db.execute_transaction(async () => {
				for (const copy_id of copy_ids) {
					try {
						// Get item copy from our fetched data
						const item_copy = item_copies_map.get(copy_id);
						if (!item_copy) {
							errors.push({
								copy_id,
								error: "Item copy not found"
							});
							continue;
						}

						// Verify the item is in the correct status for reshelving
						const status_upper = (item_copy.status || "").trim().toUpperCase();
						if (status_upper !== "UNSHELVED") {
							errors.push({
								copy_id,
								error: "Item cannot be reshelved",
								message: `Item status must be "Unshelved" to reshelve. Current status: ${item_copy.status || "null"}`
							});
							continue;
						}

						// Check if there are "waiting" reservations for this item
						const waiting_reservations = await db.execute_query(
							'SELECT * FROM RESERVATIONS WHERE item_copy_id = ? AND status = "waiting" ORDER BY queue_position LIMIT 1',
							[item_copy.library_item_id]
						);

						let final_status = "Available";
						let reservation_promoted = false;

						if (waiting_reservations.length > 0) {
							// Promote first waiting reservation to "ready"
							const next_reservation = waiting_reservations[0];
							const new_expiry = new Date();
							new_expiry.setDate(new_expiry.getDate() + 5);

							await db.update_record("RESERVATIONS", next_reservation.id, {
								status: "ready",
								expiry_date: format_sql_datetime(new_expiry),
								updated_at: now
							});

							// Set copy to Reserved for the patron
							final_status = "Reserved";
							reservation_promoted = true;
							reservations_promoted++;
						}

						// Update item copy status
						await db.update_record("LIBRARY_ITEM_COPIES", copy_id, {
							status: final_status,
							current_branch_id: branch_id || item_copy.owning_branch_id,
							checked_out_by: null,
							due_date: null,
							updated_at: now
						});

						const was_reshelved = final_status === "Available";

						await db.create_record("ITEM_TRANSACTIONS", {
							item_copy_id: copy_id,
							patron_id: was_reshelved
								? null
								: waiting_reservations[0].patron_id,
							transaction_type: was_reshelved
								? "RESHELVE"
								: "RESERVATION PROMOTION",
							created_at: now
						});

						results.push({
							copy_id,
							status: final_status,
							branch_id: branch_id || item_copy.owning_branch_id,
							reservation_promoted
						});
					} catch (error) {
						errors.push({
							copy_id,
							error: "Failed to reshelve item",
							message: error.message
						});
					}
				}
			});

			const success_count = results.length;
			const error_count = errors.length;
			const total_count = copy_ids.length;

			res.json({
				success: error_count === 0,
				message:
					error_count === 0
						? `Successfully reshelved ${success_count} item${success_count !== 1 ? "s" : ""}${reservations_promoted > 0 ? ` (${reservations_promoted} reservation${reservations_promoted !== 1 ? "s" : ""} promoted)` : ""}`
						: `Reshelved ${success_count} of ${total_count} items with ${error_count} error${error_count !== 1 ? "s" : ""}`,
				data: {
					total: total_count,
					success: success_count,
					errors: error_count,
					reservations_promoted,
					results,
					failed: errors
				}
			});
		} catch (error) {
			res.status(500).json({
				error: "Failed to reshelve item copies",
				message: error.message
			});
		}
	}
);

// POST /api/v1/transactions/reshelve/undo - Undo reshelve (change status back to "Unshelved")
router.post(
	"/reshelve/undo",
	[body("copy_id").isNumeric().withMessage("Valid copy ID is required")],
	handle_validation_errors,
	async (req, res) => {
		try {
			const { copy_id } = req.body;

			// Get item copy
			const item_copy = await db.get_by_id("LIBRARY_ITEM_COPIES", copy_id);
			if (!item_copy) {
				return res.status(400).json({
					error: "Item copy not found"
				});
			}

			// Verify the item is in "Available" status (can only undo if it was reshelved)
			const status_upper = (item_copy.status || "").trim().toUpperCase();
			if (status_upper !== "AVAILABLE") {
				return res.status(400).json({
					error: "Item cannot be undone",
					message: `Item status must be "Available" to undo reshelve. Current status: ${item_copy.status || "null"}`
				});
			}

			// Check if there's an active reservation for this item
			const active_reservation = await db.execute_query(
				'SELECT id FROM RESERVATIONS WHERE item_copy_id = ? AND status IN ("ready", "waiting") ORDER BY queue_position LIMIT 1',
				[item_copy.library_item_id]
			);

			if (active_reservation.length > 0) {
				return res.status(400).json({
					error: "Cannot undo reshelve",
					message:
						"Item has an active reservation and cannot be returned to unshelved status"
				});
			}

			// Find the most recent reshelve transaction
			const transaction_results = await db.execute_query(
				`SELECT id FROM ITEM_TRANSACTIONS 
         WHERE item_copy_id = ? AND UPPER(transaction_type) IN ('RESHELVE', 'RESERVATION PROMOTION') 
         ORDER BY created_at DESC LIMIT 1`,
				[copy_id]
			);

			if (transaction_results.length === 0) {
				return res.status(404).json({
					error: "No reshelve transaction found to undo"
				});
			}

			const transaction_id = transaction_results[0].id;

			// Wrap both operations in a transaction for atomicity
			await db.execute_transaction(async () => {
				// Update status back to "Unshelved"
				await db.update_record("LIBRARY_ITEM_COPIES", copy_id, {
					status: "Unshelved",
					updated_at: format_sql_datetime(new Date())
				});

				// Delete the reshelve transaction
				await db.delete_record("ITEM_TRANSACTIONS", transaction_id);
			});

			res.json({
				success: true,
				message: "Reshelve undone successfully",
				data: {
					copy_id,
					status: "Unshelved"
				}
			});
		} catch (error) {
			res.status(500).json({
				error: "Failed to undo reshelve",
				message: error.message
			});
		}
	}
);

export default router;
