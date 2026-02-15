import express from 'express';
import { body, param, validationResult } from 'express-validator';
import * as db from '../config/database.js';

const router = express.Router();

// Valid entity types and mime types
const VALID_ENTITY_TYPES = ['PATRON', 'LIBRARY_ITEM', 'BRANCH'];
const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Validation middleware for creating/updating images
const validate_image = [
  body('entity_type')
    .isIn(VALID_ENTITY_TYPES)
    .withMessage(
      `Entity type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
    ),
  body('entity_id')
    .isInt({ min: 1 })
    .withMessage('Entity ID must be a positive integer'),
  body('image_data')
    .notEmpty()
    .withMessage('Image data is required (base64 encoded)'),
  body('mime_type')
    .isIn(VALID_MIME_TYPES)
    .withMessage(`MIME type must be one of: ${VALID_MIME_TYPES.join(', ')}`),
  body('file_name')
    .optional()
    .isString()
    .withMessage('File name must be a string'),
];

// Validation middleware for entity params
const validate_entity_params = [
  param('entity_type')
    .isIn(VALID_ENTITY_TYPES)
    .withMessage(
      `Entity type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
    ),
  param('entity_id')
    .isInt({ min: 1 })
    .withMessage('Entity ID must be a positive integer'),
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

// GET /api/v1/images - Get all images (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { entity_type } = req.query;
    const conditions = [];
    const params = [];

    if (entity_type) {
      if (!VALID_ENTITY_TYPES.includes(entity_type.toUpperCase())) {
        return res.status(400).json({
          error: `Invalid entity_type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
        });
      }
      conditions.push('entity_type = ?');
      params.push(entity_type.toUpperCase());
    }

    const where_clause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Return metadata only (not the actual image data) for listing
    const images = await db.execute_query(
      `SELECT id, entity_type, entity_id, mime_type, file_name, file_size, created_at, updated_at
       FROM IMAGES
       ${where_clause}
       ORDER BY created_at DESC`,
      params,
    );

    res.json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch images',
      message: error.message,
    });
  }
});

// GET /api/v1/images/:entity_type/:entity_id - Get image by entity
router.get(
  '/:entity_type/:entity_id',
  validate_entity_params,
  handle_validation_errors,
  async (req, res) => {
    try {
      const { entity_type, entity_id } = req.params;

      const images = await db.execute_query(
        `SELECT * FROM IMAGES WHERE entity_type = ? AND entity_id = ?`,
        [entity_type.toUpperCase(), parseInt(entity_id, 10)],
      );

      if (images.length === 0) {
        return res.status(404).json({
          error: 'Image not found',
        });
      }

      const image = images[0];

      // Convert BLOB to base64 for JSON response
      const image_base64 = image.image_data
        ? Buffer.from(image.image_data).toString('base64')
        : null;

      res.json({
        success: true,
        data: {
          ...image,
          image_data: image_base64,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch image',
        message: error.message,
      });
    }
  },
);

// GET /api/v1/images/:entity_type/:entity_id/raw - Get raw image data (for <img> tags)
router.get(
  '/:entity_type/:entity_id/raw',
  validate_entity_params,
  handle_validation_errors,
  async (req, res) => {
    try {
      const { entity_type, entity_id } = req.params;

      const images = await db.execute_query(
        `SELECT image_data, mime_type FROM IMAGES WHERE entity_type = ? AND entity_id = ?`,
        [entity_type.toUpperCase(), parseInt(entity_id, 10)],
      );

      if (images.length === 0) {
        return res.status(404).json({
          error: 'Image not found',
        });
      }

      const image = images[0];

      // Set content type and send raw image data
      res.set('Content-Type', image.mime_type);
      res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(image.image_data);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch image',
        message: error.message,
      });
    }
  },
);

// POST /api/v1/images - Create a new image
router.post('/', validate_image, handle_validation_errors, async (req, res) => {
  console.log(
    'Received image upload request for entity:',
    req.body.entity_type,
    req.body.entity_id,
  );
  try {
    const { entity_type, entity_id, image_data, mime_type, file_name } =
      req.body;

    // Check if image already exists for this entity
    const existing = await db.execute_query(
      `SELECT id FROM IMAGES WHERE entity_type = ? AND entity_id = ?`,
      [entity_type.toUpperCase(), entity_id],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Image already exists for this entity',
        message: 'Use PUT to update the existing image',
        existing_id: existing[0].id,
      });
    }

    // Verify the referenced entity exists
    const entity_exists = await verify_entity_exists(
      entity_type.toUpperCase(),
      entity_id,
    );
    if (!entity_exists) {
      return res.status(404).json({
        error: `${entity_type} with ID ${entity_id} not found`,
      });
    }

    // Convert base64 to Buffer for BLOB storage
    const image_buffer = Buffer.from(image_data, 'base64');
    const file_size = image_buffer.length;

    const result = await db.execute_query(
      `INSERT INTO IMAGES (entity_type, entity_id, image_data, mime_type, file_name, file_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entity_type.toUpperCase(),
        entity_id,
        image_buffer,
        mime_type,
        file_name || null,
        file_size,
      ],
    );

    res.status(201).json({
      success: true,
      message: 'Image created successfully',
      data: {
        id: result.lastID,
        entity_type: entity_type.toUpperCase(),
        entity_id,
        mime_type,
        file_name,
        file_size,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create image',
      message: error.message,
    });
  }
});

// PUT /api/v1/images/:entity_type/:entity_id - Update an existing image
router.put(
  '/:entity_type/:entity_id',
  [
    ...validate_entity_params,
    body('image_data')
      .notEmpty()
      .withMessage('Image data is required (base64 encoded)'),
    body('mime_type')
      .isIn(VALID_MIME_TYPES)
      .withMessage(`MIME type must be one of: ${VALID_MIME_TYPES.join(', ')}`),
    body('file_name')
      .optional()
      .isString()
      .withMessage('File name must be a string'),
  ],
  handle_validation_errors,
  async (req, res) => {
    try {
      const { entity_type, entity_id } = req.params;
      const { image_data, mime_type, file_name } = req.body;

      // Check if image exists
      const existing = await db.execute_query(
        `SELECT id FROM IMAGES WHERE entity_type = ? AND entity_id = ?`,
        [entity_type.toUpperCase(), parseInt(entity_id, 10)],
      );

      if (existing.length === 0) {
        return res.status(404).json({
          error: 'Image not found',
          message: 'Use POST to create a new image',
        });
      }

      // Convert base64 to Buffer for BLOB storage
      const image_buffer = Buffer.from(image_data, 'base64');
      const file_size = image_buffer.length;

      await db.execute_query(
        `UPDATE IMAGES
         SET image_data = ?, mime_type = ?, file_name = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP
         WHERE entity_type = ? AND entity_id = ?`,
        [
          image_buffer,
          mime_type,
          file_name || null,
          file_size,
          entity_type.toUpperCase(),
          parseInt(entity_id, 10),
        ],
      );

      res.json({
        success: true,
        message: 'Image updated successfully',
        data: {
          id: existing[0].id,
          entity_type: entity_type.toUpperCase(),
          entity_id: parseInt(entity_id, 10),
          mime_type,
          file_name,
          file_size,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update image',
        message: error.message,
      });
    }
  },
);

// DELETE /api/v1/images/:entity_type/:entity_id - Delete an image
router.delete(
  '/:entity_type/:entity_id',
  validate_entity_params,
  handle_validation_errors,
  async (req, res) => {
    try {
      const { entity_type, entity_id } = req.params;

      // Check if image exists
      const existing = await db.execute_query(
        `SELECT id FROM IMAGES WHERE entity_type = ? AND entity_id = ?`,
        [entity_type.toUpperCase(), parseInt(entity_id, 10)],
      );

      if (existing.length === 0) {
        return res.status(404).json({
          error: 'Image not found',
        });
      }

      await db.execute_query(
        `DELETE FROM IMAGES WHERE entity_type = ? AND entity_id = ?`,
        [entity_type.toUpperCase(), parseInt(entity_id, 10)],
      );

      res.json({
        success: true,
        message: 'Image deleted successfully',
        data: {
          id: existing[0].id,
          entity_type: entity_type.toUpperCase(),
          entity_id: parseInt(entity_id, 10),
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete image',
        message: error.message,
      });
    }
  },
);

// Helper function to verify entity exists
async function verify_entity_exists(entity_type, entity_id) {
  let table;
  switch (entity_type) {
    case 'PATRON':
      table = 'PATRONS';
      break;
    case 'LIBRARY_ITEM':
      table = 'LIBRARY_ITEMS';
      break;
    case 'BRANCH':
      table = 'BRANCHES';
      break;
    default:
      return false;
  }

  const result = await db.execute_query(
    `SELECT id FROM ${table} WHERE id = ?`,
    [entity_id],
  );
  return result.length > 0;
}

export default router;
