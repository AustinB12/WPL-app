import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import {
  createTestApp,
  createTestDB,
  closeTestDB,
  createDBHelpers,
} from '../../helpers/test-db.js';
import {
  seedDatabase,
  createTestPatron,
  createTestCopy,
} from '../../helpers/fixtures.js';

describe('Reservations API', () => {
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

  describe('POST /api/v1/reservations', () => {
    it('should create ready reservation for available copy with no existing reservations', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .send({
          item_copy_id: testData.copies.available.id,
          patron_id: testData.patrons.patron1.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ready');
      expect(response.body.data.queue_position).toBe(1);
      expect(response.body.message).toMatch(/ready for pickup/i);

      // Verify copy status changed to "Reserved"
      const copy = await dbHelpers.get_by_id(
        'LIBRARY_ITEM_COPIES',
        testData.copies.available.id
      );
      expect(copy.status).toBe('Reserved');

      // Verify transaction was logged
      const transactions = await dbHelpers.execute_query(
        'SELECT * FROM TRANSACTIONS WHERE copy_id = ? AND transaction_type = ?',
        [testData.copies.available.id, 'Reservation']
      );
      expect(transactions.length).toBeGreaterThan(0);
    });

    it('should create waiting reservation when copy already has a reservation', async () => {
      // Create a fresh copy for this test
      const testCopy = await createTestCopy(db, { status: 'Available' });

      // First reservation
      await request(app)
        .post('/api/v1/reservations')
        .send({
          item_copy_id: testCopy.id,
          patron_id: testData.patrons.patron1.id,
        })
        .expect(201);

      // Second reservation by different patron
      const response = await request(app)
        .post('/api/v1/reservations')
        .send({
          item_copy_id: testCopy.id,
          patron_id: testData.patrons.patron2.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('waiting');
      expect(response.body.data.queue_position).toBe(2);
      expect(response.body.on_waitlist).toBe(true);
      expect(response.body.message).toMatch(/position 2/i);
    });

    it('should create waiting reservation for checked out copy', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .send({
          item_copy_id: testData.copies.checkedOut.id,
          patron_id: testData.patrons.patron2.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('waiting');
      expect(response.body.data.queue_position).toBe(1);

      // Copy status should remain "Checked Out"
      const copy = await dbHelpers.get_by_id(
        'LIBRARY_ITEM_COPIES',
        testData.copies.checkedOut.id
      );
      expect(copy.status).toBe('Checked Out');
    });

    it('should allow reservation for unshelved copy', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .send({
          item_copy_id: testData.copies.unshelved.id,
          patron_id: testData.patrons.patron1.id,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      // Unshelved copies should go to waiting status
      expect(response.body.data.status).toBe('waiting');
    });

    it('should reject reservation for inactive patron', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .send({
          item_copy_id: testData.copies.available.id,
          patron_id: testData.patrons.inactivePatron.id,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toMatch(/not active/i);
    });

    it('should reject duplicate reservation by same patron for same copy', async () => {
      // First reservation
      await request(app)
        .post('/api/v1/reservations')
        .send({
          item_copy_id: testData.copies.available2.id,
          patron_id: testData.patrons.patron1.id,
        })
        .expect(201);

      // Attempt duplicate reservation
      const response = await request(app)
        .post('/api/v1/reservations')
        .send({
          item_copy_id: testData.copies.available2.id,
          patron_id: testData.patrons.patron1.id,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.already_reserved).toBe(true);
    });

    it('should reject reservation for non-existent copy', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .send({
          item_copy_id: 99999,
          patron_id: testData.patrons.patron1.id,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.details || response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/reservations', () => {
    it('should return all reservations', async () => {
      const response = await request(app)
        .get('/api/v1/reservations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should filter reservations by patron_id', async () => {
      const response = await request(app)
        .get(`/api/v1/reservations?patron_id=${testData.patrons.patron2.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned reservations should be for patron2
      response.body.data.forEach((reservation) => {
        expect(reservation.patron_id).toBe(testData.patrons.patron2.id);
      });
    });

    it('should filter reservations by status', async () => {
      const response = await request(app)
        .get('/api/v1/reservations?status=ready')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // All returned reservations should have ready status
      response.body.data.forEach((reservation) => {
        expect(reservation.status).toBe('ready');
      });
    });

    it('should filter reservations by item_copy_id', async () => {
      const response = await request(app)
        .get(`/api/v1/reservations?item_copy_id=${testData.copies.reserved.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/reservations/:id', () => {
    it('should return reservation details by id', async () => {
      const response = await request(app)
        .get(`/api/v1/reservations/${testData.reservations.existing.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testData.reservations.existing.id);
      expect(response.body.data.patron_id).toBe(testData.patrons.patron2.id);
    });

    it('should return 404 for non-existent reservation', async () => {
      await request(app).get('/api/v1/reservations/99999').expect(404);
    });
  });

  describe('DELETE /api/v1/reservations/:id', () => {
    it('should cancel a waiting reservation', async () => {
      // Create a waiting reservation
      const createRes = await request(app).post('/api/v1/reservations').send({
        item_copy_id: testData.copies.checkedOut.id,
        patron_id: testData.patrons.patron1.id,
      });

      const reservationId = createRes.body.data.id;

      // Cancel it
      const response = await request(app)
        .delete(`/api/v1/reservations/${reservationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/cancelled/i);

      // Verify reservation status changed
      const reservation = await dbHelpers.get_by_id(
        'RESERVATIONS',
        reservationId
      );
      expect(reservation.status).toBe('cancelled');
    });

    it('should cancel a ready reservation and make copy available', async () => {
      // Create a ready reservation
      const testCopy = await createTestCopy(db, { status: 'Available' });

      const createRes = await request(app).post('/api/v1/reservations').send({
        item_copy_id: testCopy.id,
        patron_id: testData.patrons.patron1.id,
      });

      const reservationId = createRes.body.data.id;

      // Cancel it
      const response = await request(app)
        .delete(`/api/v1/reservations/${reservationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify copy is now available
      const copy = await dbHelpers.get_by_id(
        'LIBRARY_ITEM_COPIES',
        testCopy.id
      );
      expect(copy.status).toBe('Available');
    });

    it('should update queue positions when cancelling a reservation', async () => {
      // Create multiple reservations for the same copy
      const testCopy = await createTestCopy(db, { status: 'Available' });

      const res1 = await request(app).post('/api/v1/reservations').send({
        item_copy_id: testCopy.id,
        patron_id: testData.patrons.patron1.id,
      });

      const res2 = await request(app).post('/api/v1/reservations').send({
        item_copy_id: testCopy.id,
        patron_id: testData.patrons.patron2.id,
      });

      // Cancel first reservation
      await request(app)
        .delete(`/api/v1/reservations/${res1.body.data.id}`)
        .expect(200);

      // Check that second reservation moved up in queue
      const updatedRes2 = await dbHelpers.get_by_id(
        'RESERVATIONS',
        res2.body.data.id
      );
      expect(updatedRes2.queue_position).toBeLessThan(
        res2.body.data.queue_position
      );
    });

    it('should return 404 for non-existent reservation', async () => {
      await request(app).delete('/api/v1/reservations/99999').expect(404);
    });

    it('should reject cancelling already cancelled reservation', async () => {
      // Create and cancel a reservation
      const createRes = await request(app).post('/api/v1/reservations').send({
        item_copy_id: testData.copies.checkedOut.id,
        patron_id: testData.patrons.patron1.id,
      });

      const reservationId = createRes.body.data.id;

      // First cancellation
      await request(app)
        .delete(`/api/v1/reservations/${reservationId}`)
        .expect(200);

      // Attempt second cancellation
      const response = await request(app)
        .delete(`/api/v1/reservations/${reservationId}`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
