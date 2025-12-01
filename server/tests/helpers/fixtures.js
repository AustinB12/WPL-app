/**
 * Test data fixtures for seeding test databases
 * Provides consistent, reusable test data
 */

/**
 * Seed the database with standard test data
 * Returns references to all created entities
 */
export async function seedDatabase(db) {
  // Create test branch (ID 1 is already created in createTables)
  const branch2Result = await db.run(`
    INSERT INTO BRANCHES (branch_name, address, is_main)
    VALUES ('Secondary Branch', '456 Test Ave', 0)
  `);

  // Create test patrons
  const patron1Result = await db.run(`
    INSERT INTO PATRONS (first_name, last_name, email, phone, is_active, balance, card_expiration_date)
    VALUES ('John', 'Doe', 'john.doe@test.com', '555-0100', 1, 0.00, date('now', '+1 year'))
  `);

  const patron2Result = await db.run(`
    INSERT INTO PATRONS (first_name, last_name, email, phone, is_active, balance, card_expiration_date)
    VALUES ('Jane', 'Smith', 'jane.smith@test.com', '555-0200', 1, 0.00, date('now', '+1 year'))
  `);

  const patron3WithFinesResult = await db.run(`
    INSERT INTO PATRONS (first_name, last_name, email, phone, is_active, balance, card_expiration_date)
    VALUES ('Bob', 'Johnson', 'bob.johnson@test.com', '555-0300', 1, 15.50, date('now', '+1 year'))
  `);

  const inactivePatronResult = await db.run(`
    INSERT INTO PATRONS (first_name, last_name, email, phone, is_active, balance, card_expiration_date)
    VALUES ('Inactive', 'User', 'inactive@test.com', '555-0400', 0, 0.00, date('now', '-1 year'))
  `);

  // Create test library items
  const book1Result = await db.run(`
    INSERT INTO LIBRARY_ITEMS (title, item_type, description, publication_year)
    VALUES ('The Great Test', 'BOOK', 'A book for testing', 2020)
  `);

  const book1Id = book1Result.lastID;

  await db.run(
    `
    INSERT INTO BOOKS (library_item_id, author, publisher, genre, number_of_pages)
    VALUES (?, 'Test Author', 'Test Publisher', '["Fiction"]', 300)
  `,
    [book1Id]
  );

  const book2Result = await db.run(`
    INSERT INTO LIBRARY_ITEMS (title, item_type, description, publication_year)
    VALUES ('Another Test Book', 'BOOK', 'Another testing book', 2021)
  `);

  const book2Id = book2Result.lastID;

  await db.run(
    `
    INSERT INTO BOOKS (library_item_id, author, publisher, genre, number_of_pages)
    VALUES (?, 'Another Author', 'Test Publisher', '["Mystery"]', 250)
  `,
    [book2Id]
  );

  // Create library item copies with various statuses
  const availableCopyResult = await db.run(
    `
    INSERT INTO LIBRARY_ITEM_COPIES 
    (library_item_id, owning_branch_id, current_branch_id, status, condition)
    VALUES (?, 1, 1, 'Available', 'Good')
  `,
    [book1Id]
  );

  const checkedOutCopyResult = await db.run(
    `
    INSERT INTO LIBRARY_ITEM_COPIES 
    (library_item_id, owning_branch_id, current_branch_id, status, condition, checked_out_by, due_date)
    VALUES (?, 1, 1, 'Checked Out', 'Good', ?, date('now', '+14 days'))
  `,
    [book1Id, patron1Result.lastID]
  );

  const reservedCopyResult = await db.run(
    `
    INSERT INTO LIBRARY_ITEM_COPIES 
    (library_item_id, owning_branch_id, current_branch_id, status, condition)
    VALUES (?, 1, 1, 'Reserved', 'Excellent')
  `,
    [book2Id]
  );

  const unshelvedCopyResult = await db.run(
    `
    INSERT INTO LIBRARY_ITEM_COPIES 
    (library_item_id, owning_branch_id, current_branch_id, status, condition)
    VALUES (?, 1, 1, 'Unshelved', 'Fair')
  `,
    [book2Id]
  );

  // Create another available copy for the same book (for queue testing)
  const availableCopy2Result = await db.run(
    `
    INSERT INTO LIBRARY_ITEM_COPIES 
    (library_item_id, owning_branch_id, current_branch_id, status, condition)
    VALUES (?, 1, 1, 'Available', 'Good')
  `,
    [book2Id]
  );

  // Create an active checkout transaction
  const activeTransactionResult = await db.run(
    `
    INSERT INTO TRANSACTIONS 
    (copy_id, patron_id, location_id, transaction_type, checkout_date, due_date, status)
    VALUES (?, ?, 1, 'CHECKOUT', date('now', '-7 days'), date('now', '+7 days'), 'Active')
  `,
    [checkedOutCopyResult.lastID, patron1Result.lastID]
  );

  // Create an existing reservation (for queue testing)
  const existingReservationResult = await db.run(
    `
    INSERT INTO RESERVATIONS 
    (item_copy_id, patron_id, reservation_date, expiry_date, status, queue_position)
    VALUES (?, ?, datetime('now'), date('now', '+5 days'), 'ready', 1)
  `,
    [reservedCopyResult.lastID, patron2Result.lastID]
  );

  // Return all created test data references
  return {
    branches: {
      main: { id: 1 },
      secondary: { id: branch2Result.lastID },
    },
    patrons: {
      patron1: {
        id: patron1Result.lastID,
        email: 'john.doe@test.com',
        first_name: 'John',
        last_name: 'Doe',
      },
      patron2: {
        id: patron2Result.lastID,
        email: 'jane.smith@test.com',
        first_name: 'Jane',
        last_name: 'Smith',
      },
      patron3WithFines: {
        id: patron3WithFinesResult.lastID,
        email: 'bob.johnson@test.com',
        balance: 15.5,
      },
      inactivePatron: {
        id: inactivePatronResult.lastID,
        is_active: false,
      },
    },
    items: {
      book1: { id: book1Id, title: 'The Great Test' },
      book2: { id: book2Id, title: 'Another Test Book' },
    },
    copies: {
      available: { id: availableCopyResult.lastID, status: 'Available' },
      checkedOut: { id: checkedOutCopyResult.lastID, status: 'Checked Out' },
      reserved: { id: reservedCopyResult.lastID, status: 'Reserved' },
      unshelved: { id: unshelvedCopyResult.lastID, status: 'Unshelved' },
      available2: { id: availableCopy2Result.lastID, status: 'Available' },
    },
    transactions: {
      activeCheckout: { id: activeTransactionResult.lastID },
    },
    reservations: {
      existing: { id: existingReservationResult.lastID },
    },
  };
}

/**
 * Create a minimal patron for quick tests
 */
export async function createTestPatron(db, overrides = {}) {
  const defaults = {
    first_name: 'Test',
    last_name: 'Patron',
    email: `test.${Date.now()}@test.com`,
    is_active: 1,
    balance: 0.0,
    card_expiration_date: "date('now', '+1 year')",
  };

  const data = { ...defaults, ...overrides };
  const fields = Object.keys(data).join(', ');
  const placeholders = Object.keys(data)
    .map(() => '?')
    .join(', ');
  const values = Object.values(data);

  const result = await db.run(
    `INSERT INTO PATRONS (${fields}) VALUES (${placeholders})`,
    values
  );

  return { id: result.lastID, ...data };
}

/**
 * Create a minimal library item copy for quick tests
 */
export async function createTestCopy(db, overrides = {}) {
  // First create a library item if not provided
  let library_item_id = overrides.library_item_id;

  if (!library_item_id) {
    const itemResult = await db.run(`
      INSERT INTO LIBRARY_ITEMS (title, item_type, description)
      VALUES ('Test Item ${Date.now()}', 'BOOK', 'Test item for testing')
    `);
    library_item_id = itemResult.lastID;
  }

  const defaults = {
    library_item_id,
    owning_branch_id: 1,
    current_branch_id: 1,
    status: 'Available',
    condition: 'Good',
  };

  const data = { ...defaults, ...overrides };
  const fields = Object.keys(data).join(', ');
  const placeholders = Object.keys(data)
    .map(() => '?')
    .join(', ');
  const values = Object.values(data);

  const result = await db.run(
    `INSERT INTO LIBRARY_ITEM_COPIES (${fields}) VALUES (${placeholders})`,
    values
  );

  return { id: result.lastID, ...data };
}
