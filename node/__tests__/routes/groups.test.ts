import request from 'supertest';
import app from '../../app.js';
import { mockDb } from '../mocks/db.js';

beforeEach(() => {
  mockDb.reset();
});

describe('Groups API', () => {
  describe('GET /api/groups/hierarchy', () => {
    it('should return groups in hierarchical structure', async () => {
      // Create parent group
      const parentGroup = await mockDb.sql`
        INSERT INTO groups (name, parent_id, level)
        VALUES ('Parent Group', NULL, 0)
        RETURNING *
      `;

      // Create child group
      const childGroup = await mockDb.sql`
        INSERT INTO groups (name, parent_id, level)
        VALUES ('Child Group', ${parentGroup[0].id}, 1)
        RETURNING *
      `;

      const response = await request(app)
        .get('/api/groups/hierarchy')
        .expect(200);

      expect(response.body).toHaveLength(1); // Only root groups
      expect(response.body[0]).toMatchObject({
        id: parentGroup[0].id,
        name: 'Parent Group',
        children: expect.arrayContaining([
          expect.objectContaining({
            id: childGroup[0].id,
            name: 'Child Group',
          }),
        ]),
      });
    });
  });

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      const response = await request(app)
        .post('/api/groups')
        .send({ name: 'New Group', parent_id: null })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'New Group',
        parent_id: null,
      });
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/groups')
        .send({ parent_id: null }) // Missing name
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
