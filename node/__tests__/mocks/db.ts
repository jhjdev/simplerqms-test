import {
  Sql,
  ListenRequest,
  PendingRequest,
  SubscriptionHandle,
  Row,
  ReplicationEvent,
} from 'postgres';

// Types matching the API response structure
type User = {
  id: number;
  name: string;
  email: string;
  type: string;
  created_at: Date;
  updated_at: Date;
  group_id?: number;
  group_name?: string;
};

type Group = {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  created_at: Date;
  updated_at: Date;
  children?: Group[];
};

type GroupMember = {
  id: number;
  group_id: number;
  member_id: number;
  member_type: string;
  created_at: Date;
  updated_at: Date;
};

class MockDB {
  private users: User[] = [];
  private groups: Group[] = [];
  private groupMembers: GroupMember[] = [];
  private nextUserId = 1;
  private nextGroupId = 1;
  private nextMemberId = 1;

  // Reset all data
  reset() {
    this.users = [];
    this.groups = [];
    this.groupMembers = [];
    this.nextUserId = 1;
    this.nextGroupId = 1;
    this.nextMemberId = 1;
  }

  // User operations
  getUsers(): User[] {
    return this.users.map((user) => {
      const member = this.groupMembers.find((m) => m.member_id === user.id);
      if (member) {
        const group = this.groups.find((g) => g.id === member.group_id);
        return {
          ...user,
          group_id: group?.id,
          group_name: group?.name,
        };
      }
      return user;
    });
  }

  getUser(id: number): User | undefined {
    const user = this.users.find((u) => u.id === id);
    if (!user) return undefined;

    const member = this.groupMembers.find((m) => m.member_id === user.id);
    if (member) {
      const group = this.groups.find((g) => g.id === member.group_id);
      return {
        ...user,
        group_id: group?.id,
        group_name: group?.name,
      };
    }
    return user;
  }

  createUser(data: { name: string; email: string; type?: string }): User {
    const user: User = {
      id: this.nextUserId++,
      name: data.name,
      email: data.email,
      type: data.type || 'user',
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.push(user);
    return user;
  }

  updateUser(id: number, data: Partial<User>): User | undefined {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;

    const user = this.users[index];
    this.users[index] = {
      ...user,
      ...data,
      updated_at: new Date(),
    };
    return this.users[index];
  }

  deleteUser(id: number): boolean {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  // Group operations
  getGroups(): Group[] {
    return this.groups.map((group) => ({
      ...group,
      children: this.getChildGroups(group.id),
    }));
  }

  getGroup(id: number): Group | undefined {
    const group = this.groups.find((g) => g.id === id);
    if (!group) return undefined;
    return {
      ...group,
      children: this.getChildGroups(group.id),
    };
  }

  createGroup(data: { name: string; parent_id?: number }): Group {
    const group: Group = {
      id: this.nextGroupId++,
      name: data.name,
      parent_id: data.parent_id || null,
      level: data.parent_id
        ? (this.groups.find((g) => g.id === data.parent_id)?.level || 0) + 1
        : 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.groups.push(group);
    return group;
  }

  updateGroup(id: number, data: Partial<Group>): Group | undefined {
    const index = this.groups.findIndex((g) => g.id === id);
    if (index === -1) return undefined;

    const group = this.groups[index];
    this.groups[index] = {
      ...group,
      ...data,
      updated_at: new Date(),
    };
    return this.groups[index];
  }

  deleteGroup(id: number): boolean {
    const index = this.groups.findIndex((g) => g.id === id);
    if (index === -1) return false;
    this.groups.splice(index, 1);
    return true;
  }

  // Group member operations
  getGroupMembers(groupId: number): GroupMember[] {
    return this.groupMembers.filter((m) => m.group_id === groupId);
  }

  addGroupMember(
    groupId: number,
    memberId: number,
    memberType: string
  ): GroupMember | undefined {
    // Check if group and member exist
    const group = this.groups.find((g) => g.id === groupId);
    const user = this.users.find((u) => u.id === memberId);
    if (!group || !user) return undefined;

    // Check if member is already in group
    const existing = this.groupMembers.find(
      (m) => m.group_id === groupId && m.member_id === memberId
    );
    if (existing) return existing;

    const member: GroupMember = {
      id: this.nextMemberId++,
      group_id: groupId,
      member_id: memberId,
      member_type: memberType,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.groupMembers.push(member);
    return member;
  }

  removeGroupMember(groupId: number, memberId: number): boolean {
    const index = this.groupMembers.findIndex(
      (m) => m.group_id === groupId && m.member_id === memberId
    );
    if (index === -1) return false;
    this.groupMembers.splice(index, 1);
    return true;
  }

  // Helper method to get child groups recursively
  private getChildGroups(parentId: number): Group[] {
    const children = this.groups.filter((g) => g.parent_id === parentId);
    return children.map((child) => ({
      ...child,
      children: this.getChildGroups(child.id),
    }));
  }

  // Test data setup methods
  setUsers(users: User[]) {
    this.users = users;
    this.nextUserId = Math.max(...users.map((u) => u.id), 0) + 1;
  }

  setGroups(groups: Group[]) {
    this.groups = groups;
    this.nextGroupId = Math.max(...groups.map((g) => g.id), 0) + 1;
  }

  setGroupMembers(members: GroupMember[]) {
    this.groupMembers = members;
    this.nextMemberId = Math.max(...members.map((m) => m.id), 0) + 1;
  }
}

export const mockDB = new MockDB();
