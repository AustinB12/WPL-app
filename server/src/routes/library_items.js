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
        '(LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))',
      );
      params.push(`%${search}%`, `%${search}%`);
    }

    const query = `
    WITH books_table AS (
      SELECT 
        li.id,
        li.title,
        'BOOK' as item_type,
        li.description,
        li.publication_year,
        bk.publisher,
        bk.author,
        bk.genre,
        bk.cover_image_url,
        bk.number_of_pages,
        (SELECT COUNT(*) FROM LIBRARY_ITEM_COPIES WHERE library_item_id = li.id) as total_copies
      FROM LIBRARY_ITEMS li
      JOIN BOOKS bk ON li.id = bk.library_item_id AND li.item_type = 'BOOK'
    ),
    cds_table AS (
      SELECT 
        li.id,
        li.title,
        'CD' as item_type,
        li.description,
        li.publication_year,
        cds.cover_image_url,
        cds.artist,
        cds.record_label,
        cds.number_of_tracks,
        cds.genre,
        cds.duration_seconds,
        (SELECT COUNT(*) FROM LIBRARY_ITEM_COPIES WHERE library_item_id = li.id) as total_copies
      FROM LIBRARY_ITEMS li
      JOIN CDS cds ON li.id = cds.library_item_id AND li.item_type = 'CD'
    ),
    audiobooks_table AS (
      SELECT 
        li.id,
        li.title,
        'AUDIOBOOK' as item_type,
        li.description,
        li.publication_year,
        abks.cover_img_url as cover_image_url,
        abks.narrator,
        abks.duration_in_seconds,
        abks.publisher,
        abks.genre,
        abks.format,
        abks.rating,
        (SELECT COUNT(*) FROM LIBRARY_ITEM_COPIES WHERE library_item_id = li.id) as total_copies
      FROM LIBRARY_ITEMS li
      JOIN AUDIOBOOKS abks ON li.id = abks.library_item_id AND li.item_type = 'AUDIOBOOK'
    ),
    vinyls_table AS (
      SELECT 
        li.id,
        li.title,
        'VINYL' as item_type,
        li.description,
        li.publication_year,
        va.cover_image_url,
        va.artist,
        va.color,
        va.number_of_tracks,
        va.genre,
        va.color,
        va.duration_seconds,
        (SELECT COUNT(*) FROM LIBRARY_ITEM_COPIES WHERE library_item_id = li.id) as total_copies
      FROM LIBRARY_ITEMS li
      JOIN VINYL_ALBUMS va ON li.id = va.library_item_id AND li.item_type = 'VINYL'
    ),
    videos_table AS (
      SELECT 
        li.id,
        li.title,
        'VIDEO' as item_type,
        li.description,
        li.publication_year,
        v.director,
        v.studio,
        v.format as video_format,
        v.duration_minutes,
        v.rating as video_rating,
        v.genre as video_genre,
        (SELECT COUNT(*) FROM LIBRARY_ITEM_COPIES WHERE library_item_id = li.id) as total_copies
      FROM LIBRARY_ITEMS li
      JOIN VIDEOS v ON li.id = v.library_item_id AND li.item_type = 'VIDEO'
    ),
    magazines_table AS (
      SELECT 
        li.id,
        li.title,
        'MAGAZINE' as item_type,
        li.description,
        li.publication_year,
        mag.subscription_cost,
        mag.publisher,
        mag.issue_number,
        mag.publication_month,
        mag.publication_year,
        (SELECT COUNT(*) FROM LIBRARY_ITEM_COPIES WHERE library_item_id = li.id) as total_copies
      FROM LIBRARY_ITEMS li
      JOIN MAGAZINES mag ON li.id = mag.library_item_id AND li.item_type = 'MAGAZINE'
    ),
    periodicals_table AS (
      SELECT 
        li.id,
        li.title,
        'PERIODICAL' as item_type,
        li.description,
        li.publication_year,
        per.pages,
        per.issue_number,
        per.publication_date,
        (SELECT COUNT(*) FROM LIBRARY_ITEM_COPIES WHERE library_item_id = li.id) as total_copies
      FROM LIBRARY_ITEMS li
      JOIN PERIODICALS per ON li.id = per.library_item_id AND li.item_type = 'PERIODICAL'
    )
    SELECT
  (SELECT json_group_array(json_object('id', id, 'title', title, 'item_type', item_type, 'description', description, 'publication_year', publication_year, 'publisher', publisher, 'genres', genre, 'cover_image_url', cover_image_url, 'number_of_pages', number_of_pages, 'author', author, 'total_copies', total_copies)) FROM books_table) as books,
  (SELECT json_group_array(json_object('id', id, 'title', title, 'item_type', item_type, 'description', description, 'publication_year', publication_year, 'cover_image_url', cover_image_url, 'artist', artist, 'record_label', record_label, 'number_of_tracks', number_of_tracks, 'genres', genre, 'duration_seconds', duration_seconds, 'total_copies', total_copies)) FROM cds_table) as cds,
  (SELECT json_group_array(json_object('id', id, 'title', title, 'item_type', item_type, 'description', description, 'publication_year', publication_year, 'cover_image_url', cover_image_url, 'narrator', narrator, 'duration_in_seconds', duration_in_seconds, 'publisher', publisher, 'genres', genre, 'format', format, 'rating', rating, 'total_copies', total_copies)) FROM audiobooks_table) as audiobooks,
  (SELECT json_group_array(json_object('id', id, 'title', title, 'item_type', item_type, 'description', description, 'publication_year', publication_year, 'cover_image_url', cover_image_url, 'artist', artist, 'color', color, 'number_of_tracks', number_of_tracks, 'genres', genre, 'duration_seconds', duration_seconds, 'color', color, 'total_copies', total_copies)) FROM vinyls_table) as vinyls,
  (SELECT json_group_array(json_object('id', id, 'title', title, 'item_type', item_type, 'description', description, 'publication_year', publication_year, 'director', director, 'studio', studio, 'video_format', video_format, 'duration_minutes', duration_minutes, 'video_rating', video_rating, 'genres', video_genre, 'total_copies', total_copies)) FROM videos_table) as videos,
  (SELECT json_group_array(json_object('id', id, 'title', title, 'item_type', item_type, 'description', description, 'publication_year', publication_year, 'subscription_cost', subscription_cost, 'publisher', publisher, 'issue_number', issue_number, 'publication_month', publication_month, 'publication_year', publication_year, 'total_copies', total_copies)) FROM magazines_table) as magazines,
  (SELECT json_group_array(json_object('id', id, 'title', title, 'item_type', item_type, 'description', description, 'publication_year', publication_year, 'pages', pages, 'issue_number', issue_number, 'publication_date', publication_date, 'total_copies', total_copies)) FROM periodicals_table) as periodicals
    `;

    const [result] = await db.execute_query(query, params);

    // Parse JSON strings from SQLite json_group_array
    const books = result.books ? JSON.parse(result.books) : [];
    const cds = result.cds ? JSON.parse(result.cds) : [];
    const audiobooks = result.audiobooks ? JSON.parse(result.audiobooks) : [];
    const vinyls = result.vinyls ? JSON.parse(result.vinyls) : [];
    const videos = result.videos ? JSON.parse(result.videos) : [];
    const magazines = result.magazines ? JSON.parse(result.magazines) : [];
    const periodicals = result.periodicals
      ? JSON.parse(result.periodicals)
      : [];
    // Combine all items
    const all_items = [
      ...books,
      ...cds,
      ...audiobooks,
      ...vinyls,
      ...videos,
      ...magazines,
      ...periodicals,
    ];

    all_items.forEach((item) => {
      item.genres = item.genres !== undefined ? JSON.parse(item.genres) : [];
    });

    all_items.sort((x, y) => x.id - y.id);

    res.json({
      success: true,
      count: all_items.length,
      data: all_items,
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
        b.cover_image_url as book_cover_image_url,
        v.director,
        v.studio,
        v.format as video_format,
        v.duration_minutes,
        v.rating as video_rating,
        v.cover_image_url as video_cover_image_url,
        v.genre as video_genre,
        a.narrator,
        a.duration_in_seconds as audiobook_duration,
        a.publisher as audiobook_publisher,
        a.genre as audiobook_genre,
        a.cover_img_url as audiobook_cover_image,
        a.format as audiobook_format,
        a.rating as audiobook_rating,
        va.artist,
        va.color as vinyl_color,
        va.number_of_tracks as vinyl_tracks,
        va.cover_image_url as vinyl_cover_image,
        va.record_label as vinyl_record_label,
        va.duration_seconds as vinyl_duration,
        va.genre as vinyl_genre,
        cd.genre as cd_genre,
        cd.artist as cd_artist,
        cd.record_label as cd_record_label,
        cd.number_of_tracks as cd_tracks,
        cd.cover_image_url as cd_cover_image,
        cd.duration_seconds as cd_duration,
        m.subscription_cost,
        m.publisher as magazine_publisher,
        m.issue_number,
        m.publication_month AS magazine_publication_month,
        m.publication_year AS magazine_publication_year,
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
      [req.params.id],
    );

    if (!library_item) {
      return res.status(404).json({
        error: 'Library item not found',
      });
    }

    let genres = [];
    if (library_item.book_genre) {
      genres = JSON.parse(library_item.book_genre);
    }
    if (library_item.video_genre) {
      genres = JSON.parse(library_item.video_genre);
      library_item.format = library_item.video_format;
      library_item.duration_minutes = library_item.duration_minutes;
      library_item.rating = library_item.video_rating;
    }
    if (library_item.audiobook_genre) {
      genres = JSON.parse(library_item.audiobook_genre);
      library_item.format = library_item.audiobook_format;
      library_item.publisher = library_item.audiobook_publisher;
      library_item.duration_seconds = library_item.audiobook_duration;
    }
    if (library_item.vinyl_genre) {
      genres = JSON.parse(library_item.vinyl_genre);
      library_item.record_label = library_item.vinyl_record_label;
      library_item.duration_seconds = library_item.vinyl_duration;
      library_item.artist = library_item.vinyl_artist;
      library_item.number_of_tracks = library_item.vinyl_tracks;
    }
    if (library_item.cd_genre) {
      genres = JSON.parse(library_item.cd_genre);
      library_item.record_label = library_item.cd_record_label;
      library_item.duration_seconds = library_item.cd_duration;
    }
    if (library_item.periodical_genre) {
      genres = JSON.parse(library_item.periodical_genre);
    }
    library_item.genres = genres;

    library_item.cover_image_url =
      library_item?.vinyl_cover_image ||
      library_item?.audiobook_cover_image ||
      library_item?.book_cover_image_url ||
      library_item?.video_cover_image_url ||
      library_item?.cd_cover_image ||
      null;

    delete library_item.book_genre;
    delete library_item.video_genre;
    delete library_item.audiobook_genre;
    delete library_item.vinyl_genre;
    delete library_item.cd_genre;
    delete library_item.vinyl_cover_image;
    delete library_item.audiobook_cover_image;
    delete library_item.book_cover_image_url;
    delete library_item.video_cover_image_url;
    delete library_item.cd_cover_image;
    delete library_item.vinyl_record_label;
    delete library_item.cd_record_label;
    delete library_item.vinyl_duration;
    delete library_item.cd_duration;
    delete library_item.vinyl_artist;
    delete library_item.vinyl_tracks;
    delete library_item.video_format;
    delete library_item.video_rating;
    delete library_item.audiobook_format;
    delete library_item.audiobook_publisher;
    delete library_item.audiobook_duration;

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
        cost: req.body.cost || null,
        image_url: req.body.image_url || null,
        created_at: now,
        updated_at: now,
      };

      const item_id = await db.create_record(
        'LIBRARY_ITEMS',
        library_item_data,
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
  },
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

        updated_at: format_sql_datetime(new Date()),
      };

      await db.update_record('LIBRARY_ITEMS', req.params.id, update_data);

      // Also update type-specific tables if needed
      switch (existing_item.item_type) {
        case 'BOOK':
          await db.execute_query(
            `UPDATE BOOKS SET
              publisher = ?,
              author = ?,
              genre = ?,
              cover_image_url = ?,
              number_of_pages = ?
            WHERE library_item_id = ?`,
            [
              req.body.publisher,
              req.body.author,
              JSON.stringify(req.body.genres || []),
              req.body.cover_image_url,
              req.body.number_of_pages,
              req.params.id,
            ],
          );
          break;
        case 'AUDIOBOOK':
          await db.execute_query(
            `UPDATE AUDIOBOOKS SET
                narrator = ?,
                duration_in_seconds = ?,
                publisher = ?,
                genre = ?,
                cover_img_url = ?,
                format = ?,
                rating = ?
              WHERE library_item_id = ?`,
            [
              req.body.narrator,
              req.body.duration_in_seconds,
              req.body.publisher,
              JSON.stringify(req.body.genres || []),
              req.body.cover_img_url,
              req.body.format,
              req.body.rating,
              req.params.id,
            ],
          );
          break;
        case 'CD':
          await db.execute_query(
            `UPDATE CDS SET
              artist = ?,
              record_label = ?,
              number_of_tracks = ?,
              genre = ?,
              duration_seconds = ?
            WHERE library_item_id = ?`,
            [
              req.body.artist,
              req.body.record_label,
              req.body.number_of_tracks,
              JSON.stringify(req.body.genres || []),
              req.body.duration_seconds,
              req.params.id,
            ],
          );
          break;
        case 'VINYL':
          await db.execute_query(
            `UPDATE VINYL_ALBUMS SET
              artist = ?,
              color = ?,
              number_of_tracks = ?,
              genre = ?,
              duration_seconds = ?
            WHERE library_item_id = ?`,
            [
              req.body.artist,
              req.body.color,
              req.body.number_of_tracks,
              JSON.stringify(req.body.genres || []),
              req.body.duration_seconds,
              req.params.id,
            ],
          );
          break;
        case 'VIDEO':
          await db.execute_query(
            `UPDATE VIDEOS SET
              director = ?,
              studio = ?,
              format = ?,
              duration_minutes = ?,
              rating = ?,
              genre = ?
            WHERE library_item_id = ?`,
            [
              req.body.director,
              req.body.studio,
              req.body.format,
              req.body.duration_minutes,
              req.body.rating,
              JSON.stringify(req.body.genres || []),
              req.params.id,
            ],
          );
          break;
        case 'MAGAZINE':
          await db.execute_query(
            `UPDATE MAGAZINES SET
                subscription_cost = ?,
                publisher = ?,
                issue_number = ?,
                publication_month = ?,
                publication_year = ?
              WHERE library_item_id = ?`,
            [
              req.body.subscription_cost,
              req.body.publisher,
              req.body.issue_number,
              req.body.publication_month,
              req.body.publication_year,
              req.params.id,
            ],
          );
          break;
        case 'PERIODICAL':
          await db.execute_query(
            `UPDATE PERIODICALS SET
                pages = ?,
                issue_number = ?,
                publication_date = ?
              WHERE library_item_id = ?`,
            [
              req.body.pages,
              req.body.issue_number,
              req.body.publication_date,
              req.params.id,
            ],
          );
          break;
        default:
          break;
      }

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
  },
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
      [req.params.id, req.params.id, req.params.id],
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
