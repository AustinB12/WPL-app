import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import {
  createTestApp,
  createTestDB,
  closeTestDB,
  createDBHelpers,
} from '../../helpers/test-db.js';
import { seedDatabase } from '../../helpers/fixtures.js';

describe('Patrons API', () => {
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

  describe('POST /api/v1/patrons', () => {
    it('should create a new patron', async () => {
      const patron = {
        first_name: 'New',
        last_name: 'Patron',
        email: 'new.patron@test.com',
        phone: '555-9999',
        address: '789 New St',
      };

      const response = await request(app)
        .post('/api/v1/patrons')
        .send(patron)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        first_name: 'New',
        last_name: 'Patron',
        email: 'new.patron@test.com',
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.is_active).toBe(1);
      expect(response.body.data.balance).toBe(0.0);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/patrons')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.details || response.body.error).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const patron = {
        first_name: 'Duplicate',
        last_name: 'Email',
        email: testData.patrons.patron1.email, // Use existing email
      };

      const response = await request(app)
        .post('/api/v1/patrons')
        .send(patron)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/patrons', () => {
    it('should return all patrons', async () => {
      const response = await request(app).get('/api/v1/patrons').expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/patrons/:id', () => {
    it('should return patron by id', async () => {
      const response = await request(app)
        .get(`/api/v1/patrons/${testData.patrons.patron1.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe('John');
      expect(response.body.data.last_name).toBe('Doe');
    });

    it('should return 404 for non-existent patron', async () => {
      await request(app).get('/api/v1/patrons/99999').expect(404);
    });
  });

  describe('PUT /api/v1/patrons/:id', () => {
    it('should update patron information', async () => {
      const updates = {
        phone: '555-1111',
        address: '999 Updated Ave',
      };

      const response = await request(app)
        .put(`/api/v1/patrons/${testData.patrons.patron1.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify changes
      const patron = await dbHelpers.get_by_id(
        'PATRONS',
        testData.patrons.patron1.id
      );
      expect(patron.phone).toBe('555-1111');
      expect(patron.address).toBe('999 Updated Ave');
    });

    it('should return 404 for non-existent patron', async () => {
      await request(app)
        .put('/api/v1/patrons/99999')
        .send({ phone: '555-0000' })
        .expect(404);
    });
  });
});
