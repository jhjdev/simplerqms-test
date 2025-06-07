import { mockDB } from './db';

// Mock API responses
export const mock = {
  // User endpoints
  getUsers: () => {
    return mockDB.getUsers();
  },

  getUser: (id: number) => {
    const user = mockDB.getUser(id);
    return user || null;
  },

  createUser: (data: { name: string; email: string; type?: string }) => {
    return mockDB.createUser(data);
  },

  updateUser: (
    id: number,
    data: { name?: string; email?: string; type?: string }
  ) => {
    const user = mockDB.updateUser(id, data);
    return user || null;
  },

  deleteUser: (id: number) => {
    const success = mockDB.deleteUser(id);
    return success ? { success: true } : null;
  },

  // Group endpoints
  getGroups: () => {
    return mockDB.getGroups();
  },

  getGroup: (id: number) => {
    const group = mockDB.getGroup(id);
    return group || null;
  },

  createGroup: (data: { name: string; parent_id?: number }) => {
    return mockDB.createGroup(data);
  },

  updateGroup: (id: number, data: { name?: string; parent_id?: number }) => {
    const group = mockDB.updateGroup(id, data);
    return group || null;
  },

  deleteGroup: (id: number) => {
    const success = mockDB.deleteGroup(id);
    return success ? { success: true } : null;
  },

  // Group member endpoints
  getGroupMembers: (groupId: number) => {
    const group = mockDB.getGroup(groupId);
    if (!group) return null;
    return mockDB.getGroupMembers(groupId);
  },

  addGroupMember: (groupId: number, memberId: number, memberType: string) => {
    const member = mockDB.addGroupMember(groupId, memberId, memberType);
    return member || null;
  },

  removeGroupMember: (groupId: number, memberId: number) => {
    const success = mockDB.removeGroupMember(groupId, memberId);
    return success ? { success: true } : null;
  },

  // Test helpers
  reset: () => {
    mockDB.reset();
  },

  setUsers: (users: any[]) => {
    mockDB.setUsers(users);
  },

  setGroups: (groups: any[]) => {
    mockDB.setGroups(groups);
  },

  setGroupMembers: (members: any[]) => {
    mockDB.setGroupMembers(members);
  },

  end: async () => {}, // No-op for test cleanup
};
