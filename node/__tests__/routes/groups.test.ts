import request from 'supertest';
import { app } from '../../app';

// Get the mock function that will be returned by the mock
const mockSql = jest.fn();

// Mock the database module
jest.mock('../../utils/db', () => {
  return mockSql;
});

describe('Groups API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/groups', () => {
    it('should return all groups', async () => {
      // Mock the SQL response
      mockSql.mockResolvedValueOnce([
        { id: 1, name: 'Group 1', parent_id: null },
        { id: 2, name: 'Group 2', parent_id: 1 },
      ]);

      const response = await request(app).get('/api/groups');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Group 1');
      expect(response.body[1].name).toBe('Group 2');
    });
  });

  describe('POST /api/groups/:id/check-membership', () => {
    it('should check if a member is in a group hierarchy', async () => {
      const groupId = 1;
      const memberId = 2;
      const memberType = 'user';

      // Mock the SQL response for the check-membership query
      mockSql.mockResolvedValueOnce([
        { is_member: true }
      ]);

      const response = await request(app)
        .post(`/api/groups/${groupId}/check-membership`)
        .send({ memberId, memberType })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ isMember: true });
    });
  });

  describe('GET /api/groups/:id/all-members', () => {
    it('should return all members in a group hierarchy', async () => {
      const groupId = 1;

      // Mock the SQL response for the all-members query
      mockSql.mockResolvedValueOnce([
        { id: 2, name: 'User 1', type: 'user' },
        { id: 3, name: 'Group 2', type: 'group' },
      ]);

      const response = await request(app).get(
        `/api/groups/${groupId}/all-members`
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].type).toBe('user');
      expect(response.body[1].type).toBe('group');
    });
  });
});
