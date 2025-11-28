import express from 'express';
import { body, validationResult } from 'express-validator';
import * as db from '../config/database.js';
import { format_sql_datetime } from '../utils.js';

const router = express.Router();

// Validation middleware
const validate_library_item = [
  body('title').notEmpty().withMessage('Title is required'),
  body('item_type')
    .isIn([
      'Book',
      'BOOK',
      'Magazine',
      'MAGAZINE',
      'Periodical',
      'PERIODICAL',
      'Recording',
      'RECORDING',
      'Audiobook',
      'AUDIOBOOK',
      'Video',
      'VIDEO',
      'cd',
      'CD',
      'Vinyl',
      'VINYL',
    ])
    .withMessage('Invalid item type'),
  body('publication_year')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Invalid publication year'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
];

// Helper function to handle validation errors
const handle_validation_errors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// GET /api/v1/library-items - Get all library items
router.get('/', async (req, res) => {
  try {
    const { item_type, search } = req.query;
    const conditions = [];
    const params = [];

    if (item_type) {
      conditions.push('item_type = ?');
      params.push(item_type.toUpperCase()); // Normalize to uppercase
    }

    if (search) {
      conditions.push(
        '(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))'
      );
      params.push(`%${search}%`, `%${search}%`);
    }

    const where_clause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const order_by = 'ORDER BY title';

    const library_items = await db.get_all(
      'LIBRARY_ITEMS',
      `${where_clause} ${order_by}`,
      params
    );
    res.json({
      success: true,
      count: library_items.length,
      data: library_items,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch library items',
      message: error.message,
    });
  }
});

// GET /api/v1/library-items/:id - Get single library item with type-specific details
router.get('/:id', async (req, res) => {
  try {
    const [library_item] = await db.execute_query(
      `SELECT 
        li.*,
        b.author,
        b.publisher,
        b.genre as book_genre,
        b.number_of_pages,
        b.cover_image_url,
        v.director,
        v.studio,
        v.format as video_format,
        v.duration_minutes,
        v.rating as video_rating,
        a.narrator,
        a.duration_in_seconds as audiobook_duration,
        va.artist,
        va.color as vinyl_color,
        va.number_of_tracks as vinyl_tracks,
        cd.artist as cd_artist,
        cd.record_label,
        cd.number_of_tracks as cd_tracks,
        m.subscription_cost,
        m.publisher as magazine_publisher,
        m.issue_number,
        m.publication_month,
        m.publication_year,
        p.pages,
        p.issue_number as periodical_issue_number,
        p.publication_date,
        COUNT(DISTINCT ic.id) as total_copies,
        SUM(CASE WHEN ic.status = 'Available' THEN 1 ELSE 0 END) as available_copies,
        SUM(CASE WHEN ic.status = 'Checked Out' THEN 1 ELSE 0 END) as checked_out_copies
      FROM LIBRARY_ITEMS li
      LEFT JOIN BOOKS b ON (li.id = b.library_item_id AND li.item_type = 'BOOK')
      LEFT JOIN VIDEOS v ON (li.id = v.library_item_id AND li.item_type = 'VIDEO')
      LEFT JOIN AUDIOBOOKS a ON (li.id = a.library_item_id AND li.item_type = 'AUDIOBOOK')
      LEFT JOIN VINYL_ALBUMS va ON (li.id = va.library_item_id AND li.item_type = 'VINYL')
      LEFT JOIN CDS cd ON (li.id = cd.library_item_id AND li.item_type = 'CD')
      LEFT JOIN MAGAZINES m ON (li.id = m.library_item_id AND li.item_type = 'MAGAZINE')
      LEFT JOIN PERIODICALS p ON (li.id = p.library_item_id AND li.item_type = 'PERIODICAL')
      LEFT JOIN LIBRARY_ITEM_COPIES ic ON li.id = ic.library_item_id
      WHERE li.id = ?
      GROUP BY li.id`,
      [req.params.id]
    );

    if (!library_item) {
      return res.status(404).json({
        error: 'Library item not found',
      });
    }

    res.json({
      success: true,
      data: library_item,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch library item',
      message: error.message,
    });
  }
});

// POST /api/v1/library-items - Create new library item
router.post(
  '/',
  validate_library_item,
  handle_validation_errors,
  async (req, res) => {
    const now = format_sql_datetime(new Date());
    try {
      const library_item_data = {
        title: req.body.title,
        item_type: req.body.item_type.toUpperCase(),
        description: req.body.description || null,
        publication_year: req.body.publication_year || null,
        congress_code: req.body.congress_code || '0000-0000',
        cost: req.body.cost || null,
        image_url: req.body.image_url || null,
        created_at: now,
        updated_at: now,
      };

      const item_id = await db.create_record(
        'LIBRARY_ITEMS',
        library_item_data
      );

      res.status(201).json({
        success: true,
        message: 'Library item created successfully',
        data: { id: item_id, ...library_item_data },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create library item',
        message: error.message,
      });
    }
  }
);

// PUT /api/v1/library-items/:id - Update library item
router.put(
  '/:id',
  validate_library_item,
  handle_validation_errors,
  async (req, res) => {
    try {
      const existing_item = await db.get_by_id('LIBRARY_ITEMS', req.params.id);

      if (!existing_item) {
        return res.status(404).json({
          error: 'Library item not found',
        });
      }

      // Prevent changing item_type (would orphan type-specific records in BOOKS, VIDEOS, etc.)
      if (
        req.body.item_type &&
        req.body.item_type !== existing_item.item_type
      ) {
        return res.status(400).json({
          error: 'Cannot change item type',
          message: `Item type cannot be changed from '${existing_item.item_type}' to '${req.body.item_type}'. Create a new item instead.`,
        });
      }

      const update_data = {
        title: req.body.title,
        item_type: existing_item.item_type, // Preserve original type
        description:
          req.body.description !== undefined
            ? req.body.description
            : existing_item.description,
        publication_year:
          req.body.publication_year !== undefined
            ? req.body.publication_year
            : existing_item.publication_year,
        congress_code:
          req.body.congress_code !== undefined
            ? req.body.congress_code
            : existing_item.congress_code,
        cost: req.body.cost !== undefined ? req.body.cost : existing_item.cost,
        image_url:
          req.body.image_url !== undefined
            ? req.body.image_url
            : existing_item.image_url,
        updated_at: format_sql_datetime(new Date()),
      };

      await db.update_record('LIBRARY_ITEMS', req.params.id, update_data);

      // Return updated data
      const updated_item = await db.get_by_id('LIBRARY_ITEMS', req.params.id);

      res.json({
        success: true,
        message: 'Library item updated successfully',
        data: updated_item,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update library item',
        message: error.message,
      });
    }
  }
);

// DELETE /api/v1/library-items/:id - Delete library item
router.delete('/:id', async (req, res) => {
  try {
    const existing_item = await db.get_by_id('LIBRARY_ITEMS', req.params.id);

    if (!existing_item) {
      return res.status(404).json({
        error: 'Library item not found',
      });
    }

    // Check for checked-out copies (business rule: can't delete items currently on loan)
    const [checked_out_info] = await db.execute_query(
      `SELECT 
        COUNT(*) as checked_out_count,
        (SELECT COUNT(*) FROM LIBRARY_ITEM_COPIES WHERE library_item_id = ? AND status != 'Checked Out') as other_copies,
        (SELECT COUNT(*) FROM RESERVATIONS WHERE library_item_id = ? AND status IN ('pending', 'ready')) as active_reservations
      FROM LIBRARY_ITEM_COPIES 
      WHERE library_item_id = ? AND status = 'Checked Out'`,
      [req.params.id, req.params.id, req.params.id]
    );

    if (checked_out_info.checked_out_count > 0) {
      return res.status(400).json({
        error: 'Cannot delete library item with checked-out copies',
        message: `This item has ${checked_out_info.checked_out_count} copy/copies currently checked out. Please wait for all copies to be returned before deleting.`,
        details: {
          checked_out_copies: checked_out_info.checked_out_count,
          other_copies: checked_out_info.other_copies,
          active_reservations: checked_out_info.active_reservations,
        },
      });
    }

    // Database CASCADE will automatically delete:
    // - LIBRARY_ITEM_COPIES (all copies)
    // - RESERVATIONS (via CASCADE)
    // - Type-specific records (BOOKS, VIDEOS, etc. via CASCADE)
    await db.delete_record('LIBRARY_ITEMS', req.params.id);

    res.json({
      success: true,
      message: 'Library item deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete library item',
      message: error.message,
    });
  }
});

export default router;
