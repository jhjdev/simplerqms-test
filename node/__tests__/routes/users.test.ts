import request from 'supertest';
import app from '../../app.js';
import { mockDb } from '../mocks/db.js';

beforeEach(() => {
  mockDb.reset();
});

describe('Users API', () => {
  describe('GET /api/users', () => {
    it('should return all users', async () => {
      // Create test users
      const user1 = await mockDb.sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User 1', 'test1@example.com', 'user')
        RETURNING *
      `;

      const user2 = await mockDb.sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User 2', 'test2@example.com', 'user')
        RETURNING *
      `;

      const response = await request(app).get('/api/users').expect(200);

      expect(response.body).toEqual([user1[0], user2[0]]);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update a user', async () => {
      // Create a test user
      const user = await mockDb.sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;

      const response = await request(app)
        .patch(`/api/users/${user[0].id}`)
        .send({ name: 'Updated User', email: 'updated@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: user[0].id,
        name: 'Updated User',
        email: 'updated@example.com',
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .patch('/api/users/999')
        .send({ name: 'Updated User', email: 'updated@example.com' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
