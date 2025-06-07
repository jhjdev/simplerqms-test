import { mock } from '../mocks/mock';

describe('Group Member Routes', () => {
  beforeEach(() => {
    mock.reset();
    // Set up test data
    mock.setUsers([
      {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        type: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    mock.setGroups([
      {
        id: 1,
        name: 'Test Group',
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    mock.setGroupMembers([
      {
        id: 1,
        group_id: 1,
        member_id: 1,
        member_type: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  });

  describe('GET /api/groups/:id/members', () => {
    it('should return group members', () => {
      const members = mock.getGroupMembers(1);
      expect(members).not.toBeNull();
      expect(members).toHaveLength(1);
      expect(members![0]).toMatchObject({
        group_id: 1,
        member_id: 1,
        member_type: 'user',
      });
    });

    it('should return null for non-existent group', () => {
      const members = mock.getGroupMembers(999);
      expect(members).toBeNull();
    });
  });

  describe('POST /api/groups/:id/members', () => {
    it('should add a member to a group', () => {
      const memberData = {
        user_id: 1,
      };

      const member = mock.addGroupMember(1, memberData.user_id, 'user');
      expect(member).toMatchObject({
        group_id: 1,
        member_id: memberData.user_id,
        member_type: 'user',
      });
    });

    it('should return null for non-existent group', () => {
      const member = mock.addGroupMember(999, 1, 'user');
      expect(member).toBeNull();
    });

    it('should return null for non-existent member', () => {
      const member = mock.addGroupMember(1, 999, 'user');
      expect(member).toBeNull();
    });
  });

  describe('DELETE /api/groups/:id/members/:userId', () => {
    it('should remove a member from a group', () => {
      const result = mock.removeGroupMember(1, 1);
      expect(result).toEqual({ success: true });
    });

    it('should return null for non-existent group', () => {
      const result = mock.removeGroupMember(999, 1);
      expect(result).toBeNull();
    });

    it('should return null for non-existent member', () => {
      const result = mock.removeGroupMember(1, 999);
      expect(result).toBeNull();
    });
  });
});
