import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import {
  createTestApp,
  createTestDB,
  closeTestDB,
  createDBHelpers,
} from '../../helpers/test-db.js';
import { seedDatabase } from '../../helpers/fixtures.js';

describe('Transactions API - Checkout Flow', () => {
  let app;
  let db;
  let dbHelpers;
  let testData;

  beforeEach(async () => {
    db = await createTestDB();
    dbHelpers = createDBHelpers(db);
    app = await createTestApp(db);
    testData = await seedDatabase(db);
  });

  afterEach(async () => {
    await closeTestDB(db);
  });

  describe('POST /api/v1/transactions/checkout', () => {
    it('should successfully checkout an available copy', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkout')
        .send({
          patron_id: testData.patrons.patron1.id,
          copy_id: testData.copies.available.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        patron_id: testData.patrons.patron1.id,
        copy_id: testData.copies.available.id,
      });
      expect(response.body.data.transaction_id).toBeDefined();
      expect(response.body.data.due_date).toBeDefined();

      // Verify copy status changed to "Checked Out"
      const copy = await dbHelpers.get_by_id(
        'LIBRARY_ITEM_COPIES',
        testData.copies.available.id
      );
      expect(copy.status).toBe('Checked Out');
      expect(copy.checked_out_by).toBe(testData.patrons.patron1.id);
    });

    it('should reject checkout for inactive patron', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkout')
        .send({
          patron_id: testData.patrons.inactivePatron.id,
          copy_id: testData.copies.available.id,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.message || response.body.error).toMatch(
        /inactive|not active/i
      );
    });

    it('should reject checkout for already checked out copy', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkout')
        .send({
          patron_id: testData.patrons.patron2.id,
          copy_id: testData.copies.checkedOut.id,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject checkout for non-existent patron', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkout')
        .send({
          patron_id: 99999,
          copy_id: testData.copies.available.id,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject checkout for non-existent copy', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkout')
        .send({
          patron_id: testData.patrons.patron1.id,
          copy_id: 99999,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle checkout with patron fines when clear_fines is true', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkout')
        .send({
          patron_id: testData.patrons.patron3WithFines.id,
          copy_id: testData.copies.available.id,
          clear_fines: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify patron balance was cleared
      const patron = await dbHelpers.get_by_id(
        'PATRONS',
        testData.patrons.patron3WithFines.id
      );
      expect(patron.balance).toBe(0);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkout')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.details || response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/transactions/checkin', () => {
    it('should successfully checkin a checked out copy', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkin')
        .send({
          copy_id: testData.copies.checkedOut.id,
          condition: 'Good',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify copy status changed to "Available"
      const copy = await dbHelpers.get_by_id(
        'LIBRARY_ITEM_COPIES',
        testData.copies.checkedOut.id
      );
      expect(copy.status).toBe('Available');
      expect(copy.checked_out_by).toBeNull();
      expect(copy.due_date).toBeNull();

      // Verify transaction was updated
      const transaction = await dbHelpers.get_by_id(
        'TRANSACTIONS',
        testData.transactions.activeCheckout.id
      );
      expect(transaction.status).toBe('Completed');
      expect(transaction.return_date).toBeDefined();
    });

    it('should update copy condition on checkin', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkin')
        .send({
          copy_id: testData.copies.checkedOut.id,
          condition: 'Fair',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const copy = await dbHelpers.get_by_id(
        'LIBRARY_ITEM_COPIES',
        testData.copies.checkedOut.id
      );
      expect(copy.condition).toBe('Fair');
    });

    it('should reject checkin for non-checked-out copy', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkin')
        .send({
          copy_id: testData.copies.available.id,
          condition: 'Good',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject checkin for non-existent copy', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkin')
        .send({
          copy_id: 99999,
          condition: 'Good',
        })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should validate condition field', async () => {
      const response = await request(app)
        .post('/api/v1/transactions/checkin')
        .send({
          copy_id: testData.copies.checkedOut.id,
          condition: 'InvalidCondition',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/transactions/checked-out', () => {
    it('should return all checked out items', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/checked-out')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const checkedOutItem = response.body.data.find(
        (item) => item.copy_id === testData.copies.checkedOut.id
      );
      expect(checkedOutItem).toBeDefined();
      expect(checkedOutItem.patron_id).toBe(testData.patrons.patron1.id);
    });

    it('should filter checked out items by branch', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/checked-out?branch_id=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('should return transaction details by id', async () => {
      const response = await request(app)
        .get(`/api/v1/transactions/${testData.transactions.activeCheckout.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(
        testData.transactions.activeCheckout.id
      );
      expect(response.body.data.patron_id).toBe(testData.patrons.patron1.id);
    });

    it('should return 404 for non-existent transaction', async () => {
      await request(app).get('/api/v1/transactions/99999').expect(404);
    });
  });
});
