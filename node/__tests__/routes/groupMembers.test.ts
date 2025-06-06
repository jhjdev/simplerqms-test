import request from 'supertest';
import app from '../../app.js';
import { mockDb } from '../mocks/db.js';

beforeEach(() => {
  mockDb.reset();
});

describe('Group Members API', () => {
  describe('POST /api/groups/:id/members', () => {
    it('should add a user to a group', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        type: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockGroup = {
        id: 1,
        name: 'Test Group',
        parent_id: null,
        level: 0,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z'),
      };
      mockDb.setUsers([mockUser]);
      mockDb.setGroups([mockGroup]);

      const response = await request(app)
        .post('/api/groups/1/members')
        .send({ userId: 1 })
        .expect(201);

      expect(response.body).toMatchObject({
        group_id: 1,
        member_id: 1,
        member_type: 'user',
      });
    });

    it('should return 404 for non-existent group', async () => {
      const response = await request(app)
        .post('/api/groups/999/members')
        .send({ userId: 1 })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/groups/1/members')
        .send({}) // Missing userId
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/groups/:id/members/:userId', () => {
    it('should remove a user from a group', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        type: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockGroup = {
        id: 1,
        name: 'Test Group',
        parent_id: null,
        level: 0,
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z'),
      };
      mockDb.setUsers([mockUser]);
      mockDb.setGroups([mockGroup]);
      mockDb.addGroupMember(1, 1, 'user');

      const response = await request(app)
        .delete('/api/groups/1/members/1')
        .expect(200);

      expect(response.body).toMatchObject({
        group_id: 1,
        member_id: 1,
        member_type: 'user',
      });
    });

    it('should return 404 for non-existent group', async () => {
      const response = await request(app)
        .delete('/api/groups/999/members/1')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
