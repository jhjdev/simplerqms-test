import { mockDb } from './db';

describe('MockDB', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('User Operations', () => {
    it('should insert and retrieve a user', async () => {
      const user = await mockDb.insertUser(
        'Test User',
        'test@example.com',
        'user'
      );
      expect(user).toHaveProperty('id');
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.type).toBe('user');

      const retrievedUser = await mockDb.getUser(user.id);
      expect(retrievedUser).toEqual(user);
    });

    it('should get all users', async () => {
      const user1 = await mockDb.insertUser(
        'User 1',
        'user1@example.com',
        'user'
      );
      const user2 = await mockDb.insertUser(
        'User 2',
        'user2@example.com',
        'user'
      );

      const users = await mockDb.getAllUsers();
      expect(users).toHaveLength(2);
      expect(users).toEqual(expect.arrayContaining([user1, user2]));
    });

    it('should update a user', async () => {
      const user = await mockDb.insertUser(
        'Test User',
        'test@example.com',
        'user'
      );
      const updatedUser = await mockDb.updateUser(user.id, {
        name: 'Updated User',
        email: 'updated@example.com',
      });

      expect(updatedUser).toHaveProperty('id', user.id);
      expect(updatedUser).toHaveProperty('name', 'Updated User');
      expect(updatedUser).toHaveProperty('email', 'updated@example.com');
    });

    it('should delete a user', async () => {
      const user = await mockDb.insertUser(
        'Test User',
        'test@example.com',
        'user'
      );
      const success = await mockDb.deleteUser(user.id);
      expect(success).toBe(true);

      const deletedUser = await mockDb.getUser(user.id);
      expect(deletedUser).toBeUndefined();
    });
  });

  describe('Group Operations', () => {
    it('should insert and retrieve a group', async () => {
      const group = await mockDb.insertGroup('Test Group', null);
      expect(group).toHaveProperty('id');
      expect(group.name).toBe('Test Group');
      expect(group.parent_id).toBeNull();

      const retrievedGroup = await mockDb.getGroup(group.id);
      expect(retrievedGroup).toEqual(group);
    });

    it('should get all groups', async () => {
      const group1 = await mockDb.insertGroup('Group 1', null);
      const group2 = await mockDb.insertGroup('Group 2', group1.id);

      const groups = await mockDb.getAllGroups();
      expect(groups).toHaveLength(2);
      expect(groups).toEqual(expect.arrayContaining([group1, group2]));
    });

    it('should update a group', async () => {
      const group = await mockDb.insertGroup('Test Group', null);
      const updatedGroup = await mockDb.updateGroup(group.id, {
        name: 'Updated Group',
        parent_id: null,
      });

      expect(updatedGroup).toHaveProperty('id', group.id);
      expect(updatedGroup).toHaveProperty('name', 'Updated Group');
    });

    it('should delete a group', async () => {
      const group = await mockDb.insertGroup('Test Group', null);
      const success = await mockDb.deleteGroup(group.id);
      expect(success).toBe(true);

      const deletedGroup = await mockDb.getGroup(group.id);
      expect(deletedGroup).toBeUndefined();
    });
  });

  describe('Group Member Operations', () => {
    it('should add and check a member', async () => {
      const group = await mockDb.insertGroup('Test Group', null);
      const user = await mockDb.insertUser(
        'Test User',
        'test@example.com',
        'user'
      );

      const member = await mockDb.addMember(group.id, user.id, 'user');
      expect(member).toHaveProperty('id');
      expect(member.group_id).toBe(group.id);
      expect(member.member_id).toBe(user.id);
      expect(member.member_type).toBe('user');

      const isMember = await mockDb.isMember(group.id, user.id, 'user');
      expect(isMember).toBe(true);
    });

    it('should get group members', async () => {
      const group = await mockDb.insertGroup('Test Group', null);
      const user1 = await mockDb.insertUser(
        'User 1',
        'user1@example.com',
        'user'
      );
      const user2 = await mockDb.insertUser(
        'User 2',
        'user2@example.com',
        'user'
      );

      await mockDb.addMember(group.id, user1.id, 'user');
      await mockDb.addMember(group.id, user2.id, 'user');

      const members = await mockDb.getGroupMembers(group.id);
      expect(members).toHaveLength(2);
      expect(members[0].member_id).toBe(user1.id);
      expect(members[1].member_id).toBe(user2.id);
    });

    it('should remove a member', async () => {
      const group = await mockDb.insertGroup('Test Group', null);
      const user = await mockDb.insertUser(
        'Test User',
        'test@example.com',
        'user'
      );

      await mockDb.addMember(group.id, user.id, 'user');
      const success = await mockDb.removeMember(group.id, user.id);
      expect(success).toBe(true);

      const isMember = await mockDb.isMember(group.id, user.id, 'user');
      expect(isMember).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all data', async () => {
      // Add some data
      const user = await mockDb.insertUser(
        'Test User',
        'test@example.com',
        'user'
      );
      const group = await mockDb.insertGroup('Test Group', null);
      await mockDb.addMember(group.id, user.id, 'user');

      // Reset the database
      mockDb.reset();

      // Verify all data is gone
      const users = await mockDb.getAllUsers();
      const groups = await mockDb.getAllGroups();
      const members = await mockDb.getGroupMembers(group.id);

      expect(users).toHaveLength(0);
      expect(groups).toHaveLength(0);
      expect(members).toHaveLength(0);
    });
  });
});
