import request from 'supertest';
import { app } from '../../app';
import sql from '../../utils/db';

describe('User Routes', () => {
  beforeEach(async () => {
    // Clean up the database before each test
    await sql`TRUNCATE TABLE users CASCADE`;
  });

  afterAll(async () => {
    // Close the database connection after all tests
    await sql.end();
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all users', async () => {
      // Insert test users
      await sql`
        INSERT INTO users (name, email, type)
        VALUES 
          ('Test User 1', 'test1@example.com', 'user'),
          ('Test User 2', 'test2@example.com', 'user')
      `;

      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name', 'Test User 1');
      expect(response.body[1]).toHaveProperty('name', 'Test User 2');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        type: 'user',
      };

      const response = await request(app).post('/api/users').send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', userData.name);
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('created_at');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Incomplete User' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when email is invalid', async () => {
      const response = await request(app).post('/api/users').send({
        name: 'Invalid Email User',
        email: 'invalid-email',
        type: 'user',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update an existing user', async () => {
      // Create a test user
      const [user] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const response = await request(app)
        .patch(`/api/users/${user.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('email', updateData.email);
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .patch('/api/users/999')
        .send({ name: 'Non-existent User' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete an existing user', async () => {
      // Create a test user
      const [user] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;

      const response = await request(app).delete(`/api/users/${user.id}`);

      expect(response.status).toBe(204);

      // Verify user is deleted
      const [deletedUser] = await sql`
        SELECT * FROM users WHERE id = ${user.id}
      `;
      expect(deletedUser).toBeUndefined();
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app).delete('/api/users/999');

      expect(response.status).toBe(404);
    });
  });
});
