import { mock } from '../mocks/mock';

describe('Group Routes', () => {
  beforeEach(() => {
    mock.reset();
    mock.setGroups([
      {
        id: 1,
        name: 'Test Group',
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  });

  describe('GET /api/groups', () => {
    it('should return all groups', () => {
      const groups = mock.getGroups();
      expect(groups).toHaveLength(1);
      expect(groups[0]).toMatchObject({
        id: 1,
        name: 'Test Group',
        parent_id: null,
      });
    });
  });

  describe('GET /api/groups/:id', () => {
    it('should return a group by id', () => {
      const group = mock.getGroup(1);
      expect(group).toMatchObject({
        id: 1,
        name: 'Test Group',
        parent_id: null,
      });
    });

    it('should return null for non-existent group', () => {
      const group = mock.getGroup(999);
      expect(group).toBeNull();
    });
  });

  describe('POST /api/groups', () => {
    it('should create a new group', () => {
      const groupData = {
        name: 'New Group',
      };

      const group = mock.createGroup(groupData);
      expect(group).toMatchObject({
        name: groupData.name,
        parent_id: null,
      });
    });

    it('should create a child group', () => {
      const groupData = {
        name: 'Child Group',
        parent_id: 1,
      };

      const group = mock.createGroup(groupData);
      expect(group).toMatchObject({
        name: groupData.name,
        parent_id: 1,
      });
    });
  });

  describe('PATCH /api/groups/:id', () => {
    it('should update a group', () => {
      const updateData = {
        name: 'Updated Group',
      };

      const group = mock.updateGroup(1, updateData);
      expect(group).toMatchObject({
        id: 1,
        name: updateData.name,
        parent_id: null,
      });
    });

    it('should return null for non-existent group', () => {
      const group = mock.updateGroup(999, { name: 'Updated' });
      expect(group).toBeNull();
    });
  });

  describe('DELETE /api/groups/:id', () => {
    it('should delete a group', () => {
      const result = mock.deleteGroup(1);
      expect(result).toEqual({ success: true });
    });

    it('should return null for non-existent group', () => {
      const result = mock.deleteGroup(999);
      expect(result).toBeNull();
    });
  });
});
