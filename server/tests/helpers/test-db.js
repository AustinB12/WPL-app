import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import express from 'express';

/**
 * Create an in-memory SQLite database for testing
 * Each test gets a fresh, isolated database
 */
export async function createTestDB() {
  const db = await open({
    filename: ':memory:',
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA foreign_keys = ON;');

  // Create all tables
  await createTables(db);

  return db;
}

/**
 * Close the test database connection
 */
export async function closeTestDB(db) {
  if (db) {
    await db.close();
  }
}

/**
 * Create a test Express app with all routes mounted
 * Uses the provided test database
 */
export async function createTestApp(db) {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Store db instance on app for route access
  app.locals.db = db;

  // Import and mount routes dynamically
  // Note: Routes need to be modified to use app.locals.db instead of singleton
  // For now, we'll mount a simple version
  const library_items_routes = (
    await import('../../src/routes/library_items.js')
  ).default;
  const patrons_routes = (await import('../../src/routes/patrons.js')).default;
  const transactions_routes = (await import('../../src/routes/transactions.js'))
    .default;
  const reservations_routes = (await import('../../src/routes/reservations.js'))
    .default;
  const item_copies_routes = (
    await import('../../src/routes/library_item_copies.js')
  ).default;
  const branches_routes = (await import('../../src/routes/library_branches.js'))
    .default;

  // Mount routes
  app.use('/api/v1/library_items', library_items_routes);
  app.use('/api/v1/patrons', patrons_routes);
  app.use('/api/v1/transactions', transactions_routes);
  app.use('/api/v1/reservations', reservations_routes);
  app.use('/api/v1/library_item_copies', item_copies_routes);
  app.use('/api/v1/branches', branches_routes);

  return app;
}

/**
 * Create all database tables
 * Mirrors the schema from src/config/database.js
 */
async function createTables(db) {
  // BRANCHES table
  await db.exec(`
    CREATE TABLE BRANCHES (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_name TEXT NOT NULL DEFAULT 'Default Branch Name',
      address TEXT,
      phone TEXT,
      is_main BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      cover_image TEXT,
      primary_color TEXT,
      secondary_color TEXT,
      description TEXT
    );
  `);

  // LIBRARY_ITEMS table
  await db.exec(`
    CREATE TABLE LIBRARY_ITEMS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      item_type TEXT NOT NULL,
      description TEXT,
      publication_year INTEGER,
      congress_code TEXT DEFAULT '0000-0000',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // PATRONS table
  await db.exec(`
    CREATE TABLE PATRONS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      balance REAL NOT NULL DEFAULT 0.00,
      birthday DATE,
      card_expiration_date DATE NOT NULL DEFAULT CURRENT_DATE,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      image_url TEXT,
      local_branch_id INTEGER DEFAULT 1,
      FOREIGN KEY (local_branch_id) REFERENCES BRANCHES(id) ON DELETE SET NULL
    );
  `);

  // BOOKS table
  await db.exec(`
    CREATE TABLE BOOKS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      library_item_id INTEGER NOT NULL,
      publisher TEXT,
      author TEXT NOT NULL DEFAULT '',
      genre TEXT,
      cover_image_url TEXT,
      number_of_pages INTEGER,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE
    );
  `);

  // LIBRARY_ITEM_COPIES table
  await db.exec(`
    CREATE TABLE LIBRARY_ITEM_COPIES (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      library_item_id INTEGER NOT NULL,
      owning_branch_id INTEGER NOT NULL DEFAULT 1,
      current_branch_id INTEGER DEFAULT 1,
      checked_out_by INTEGER,
      condition TEXT DEFAULT 'Good',
      status TEXT DEFAULT 'Available',
      cost REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_acquired DATE,
      due_date DATE,
      FOREIGN KEY (library_item_id) REFERENCES LIBRARY_ITEMS(id) ON DELETE CASCADE,
      FOREIGN KEY (owning_branch_id) REFERENCES BRANCHES(id) ON DELETE SET NULL,
      FOREIGN KEY (current_branch_id) REFERENCES BRANCHES(id) ON DELETE SET NULL,
      FOREIGN KEY (checked_out_by) REFERENCES PATRONS(id) ON DELETE SET NULL
    );
  `);

  // RESERVATIONS table
  await db.exec(`
    CREATE TABLE RESERVATIONS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_copy_id INTEGER NOT NULL,
      patron_id INTEGER,
      reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiry_date DATE,
      status TEXT DEFAULT 'pending',
      queue_position INTEGER,
      notification_sent DATETIME,
      fulfillment_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_copy_id) REFERENCES LIBRARY_ITEM_COPIES(id) ON DELETE CASCADE,
      FOREIGN KEY (patron_id) REFERENCES PATRONS(id) ON DELETE CASCADE
    );
  `);

  // TRANSACTIONS table
  await db.exec(`
    CREATE TABLE TRANSACTIONS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      copy_id INTEGER,
      patron_id INTEGER,
      location_id INTEGER,
      transaction_type TEXT NOT NULL,
      checkout_date DATE,
      due_date DATE,
      return_date DATE,
      fine_amount REAL DEFAULT 0.00,
      status TEXT DEFAULT 'Active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (copy_id) REFERENCES LIBRARY_ITEM_COPIES(id) ON DELETE CASCADE,
      FOREIGN KEY (patron_id) REFERENCES PATRONS(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES BRANCHES(id) ON DELETE SET NULL
    );
  `);

  // FINES table
  await db.exec(`
    CREATE TABLE FINES (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      patron_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      is_paid BOOLEAN DEFAULT 0,
      paid_date DATE,
      payment_method TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES TRANSACTIONS(id) ON DELETE CASCADE,
      FOREIGN KEY (patron_id) REFERENCES PATRONS(id) ON DELETE CASCADE
    );
  `);

  // Insert default branch
  await db.exec(`
    INSERT INTO BRANCHES (id, branch_name, is_main) 
    VALUES (1, 'Test Library', 1);
  `);

  // Create indexes for performance
  await db.exec(`
    CREATE INDEX idx_library_item_copies_status ON LIBRARY_ITEM_COPIES(status);
    CREATE INDEX idx_library_item_copies_item_id ON LIBRARY_ITEM_COPIES(library_item_id);
    CREATE INDEX idx_reservations_status ON RESERVATIONS(status);
    CREATE INDEX idx_reservations_item_queue ON RESERVATIONS(item_copy_id, queue_position, status);
    CREATE INDEX idx_transactions_status ON TRANSACTIONS(status);
    CREATE INDEX idx_transactions_patron ON TRANSACTIONS(patron_id);
  `);
}

/**
 * Helper to execute queries on test database
 * Provides the same interface as the main database module
 */
export function createDBHelpers(db) {
  return {
    async execute_query(query, params = []) {
      const trimmedQuery = query.trim().toLowerCase();
      if (
        trimmedQuery.startsWith('select') ||
        trimmedQuery.startsWith('with')
      ) {
        return await db.all(query, params);
      } else {
        return await db.run(query, params);
      }
    },

    async get_by_id(table_name, id) {
      const query = `SELECT * FROM ${table_name} WHERE id = ?`;
      return await db.get(query, [id]);
    },

    async create_record(table_name, data) {
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data)
        .map(() => '?')
        .join(', ');
      const values = Object.values(data);
      const query = `INSERT INTO ${table_name} (${fields}) VALUES (${placeholders})`;
      const result = await db.run(query, values);
      return result.lastID;
    },

    async update_record(table_name, id, data) {
      const fields = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = Object.values(data).concat([id]);
      const query = `UPDATE ${table_name} SET ${fields} WHERE id = ?`;
      const result = await db.run(query, values);
      return result.changes > 0;
    },

    async execute_transaction(callback) {
      try {
        await db.exec('BEGIN TRANSACTION');
        const result = await callback(db);
        await db.exec('COMMIT');
        return result;
      } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
