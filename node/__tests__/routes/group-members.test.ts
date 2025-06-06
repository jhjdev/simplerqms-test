import request from 'supertest';
import app from '../../app.js';
import { mockDb } from '../mocks/db.js';

beforeEach(() => {
  mockDb.reset();
});

describe('Group Members API', () => {
  describe('GET /api/groups/:id/members', () => {
    it('should return all members of a group', async () => {
      // Create test group and users
      const group = await mockDb.sql`
        INSERT INTO groups (name, parent_id, level)
        VALUES ('Test Group', null, 1)
        RETURNING *
      `;

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

      // Add users to group
      await mockDb.sql`
        INSERT INTO group_members (group_id, user_id)
        VALUES (${group[0].id}, ${user1[0].id})
      `;

      await mockDb.sql`
        INSERT INTO group_members (group_id, user_id)
        VALUES (${group[0].id}, ${user2[0].id})
      `;

      const response = await request(app)
        .get(`/api/groups/${group[0].id}/members`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: user1[0].id,
            name: 'Test User 1',
            email: 'test1@example.com',
          }),
          expect.objectContaining({
            id: user2[0].id,
            name: 'Test User 2',
            email: 'test2@example.com',
          }),
        ])
      );
    });

    it('should return 404 for non-existent group', async () => {
      const response = await request(app)
        .get('/api/groups/999/members')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/groups/:id/members', () => {
    it('should add a user to a group', async () => {
      // Create test group and user
      const group = await mockDb.sql`
        INSERT INTO groups (name, parent_id, level)
        VALUES ('Test Group', null, 1)
        RETURNING *
      `;

      const user = await mockDb.sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;

      const response = await request(app)
        .post(`/api/groups/${group[0].id}/members`)
        .send({ userId: user[0].id })
        .expect(200);

      expect(response.body).toMatchObject({
        group_id: group[0].id,
        user_id: user[0].id,
      });

      // Verify member was added
      const members = await mockDb.sql`
        SELECT * FROM group_members
        WHERE group_id = ${group[0].id}
        AND user_id = ${user[0].id}
      `;

      expect(members).toHaveLength(1);
    });

    it('should return 404 for non-existent group', async () => {
      const response = await request(app)
        .post('/api/groups/999/members')
        .send({ userId: 1 })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent user', async () => {
      // Create test group
      const group = await mockDb.sql`
        INSERT INTO groups (name, parent_id, level)
        VALUES ('Test Group', null, 1)
        RETURNING *
      `;

      const response = await request(app)
        .post(`/api/groups/${group[0].id}/members`)
        .send({ userId: 999 })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/groups/:id/members/:userId', () => {
    it('should remove a user from a group', async () => {
      // Create test group and user
      const group = await mockDb.sql`
        INSERT INTO groups (name, parent_id, level)
        VALUES ('Test Group', null, 1)
        RETURNING *
      `;

      const user = await mockDb.sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;

      // Add user to group
      await mockDb.sql`
        INSERT INTO group_members (group_id, user_id)
        VALUES (${group[0].id}, ${user[0].id})
      `;

      const response = await request(app)
        .delete(`/api/groups/${group[0].id}/members/${user[0].id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        group_id: group[0].id,
        user_id: user[0].id,
      });

      // Verify member was removed
      const members = await mockDb.sql`
        SELECT * FROM group_members
        WHERE group_id = ${group[0].id}
        AND user_id = ${user[0].id}
      `;

      expect(members).toHaveLength(0);
    });

    it('should return 404 for non-existent group', async () => {
      const response = await request(app)
        .delete('/api/groups/999/members/1')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent user', async () => {
      // Create test group
      const group = await mockDb.sql`
        INSERT INTO groups (name, parent_id, level)
        VALUES ('Test Group', null, 1)
        RETURNING *
      `;

      const response = await request(app)
        .delete(`/api/groups/${group[0].id}/members/999`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
