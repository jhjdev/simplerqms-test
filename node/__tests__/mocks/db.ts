import {
  Sql,
  ListenRequest,
  PendingRequest,
  SubscriptionHandle,
  Row,
  ReplicationEvent,
} from 'postgres';

// Mock database for testing
type User = {
  id: number;
  name: string;
  email: string;
  type: string;
  created_at: Date;
  updated_at: Date;
};

type Group = {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  created_at: Date;
  updated_at: Date;
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

  // SQL template literal interface
  async sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
    const query = strings
      .reduce((acc, str, i) => {
        return acc + str + (values[i] !== undefined ? `$${i + 1}` : '');
      }, '')
      .replace(/\s+/g, ' ')
      .trim();

    // USERS
    if (/INSERT INTO users/i.test(query)) {
      // INSERT INTO users (name, email, type) VALUES ($1, $2, $3)
      const [name, email, type = 'user'] = values;
      const user = await this.insertUser(name, email, type);
      return [user];
    } else if (/SELECT \* FROM users WHERE id = \$1/i.test(query)) {
      // SELECT * FROM users WHERE id = $1
      const [id] = values;
      const user = await this.getUser(id);
      return user ? [user] : [];
    } else if (/SELECT \* FROM users ORDER BY id/i.test(query)) {
      // SELECT * FROM users ORDER BY id
      return await this.getAllUsers();
    } else if (/SELECT \* FROM users/i.test(query)) {
      // SELECT * FROM users
      return await this.getAllUsers();
    } else if (
      /UPDATE users SET name = \$1, email = \$2, type = \$3, updated_at = \$4 WHERE id = \$5/i.test(
        query
      )
    ) {
      // UPDATE users SET name = $1, email = $2, type = $3, updated_at = $4 WHERE id = $5
      const [name, email, type, , id] = values;
      const user = await this.updateUser(id, { name, email, type });
      return user ? [user] : [];
    } else if (
      /UPDATE users SET name = \$1, email = \$2, updated_at = \$3 WHERE id = \$4/i.test(
        query
      )
    ) {
      // UPDATE users SET name = $1, email = $2, updated_at = $3 WHERE id = $4
      const [name, email, , id] = values;
      const user = await this.updateUser(id, { name, email });
      return user ? [user] : [];
    } else if (/DELETE FROM users WHERE id = \$1/i.test(query)) {
      // DELETE FROM users WHERE id = $1
      const [id] = values;
      await this.deleteUser(id);
      return [];
    }

    // GROUPS
    if (/INSERT INTO groups/i.test(query)) {
      // INSERT INTO groups (name, parent_id, level) VALUES ($1, $2, $3)
      const [name, parent_id, level = 0] = values;
      const group = await this.insertGroup(name, parent_id, level);
      return [group];
    } else if (/SELECT \* FROM groups WHERE id = \$1/i.test(query)) {
      // SELECT * FROM groups WHERE id = $1
      const [id] = values;
      const group = await this.getGroup(id);
      return group ? [group] : [];
    } else if (/SELECT \* FROM groups ORDER BY id/i.test(query)) {
      // SELECT * FROM groups ORDER BY id
      return await this.getAllGroups();
    } else if (/SELECT \* FROM groups/i.test(query)) {
      // SELECT * FROM groups
      return await this.getAllGroups();
    } else if (
      /UPDATE groups SET name = \$1, parent_id = \$2, level = \$3 WHERE id = \$4/i.test(
        query
      )
    ) {
      // UPDATE groups SET name = $1, parent_id = $2, level = $3 WHERE id = $4
      const [name, parent_id, level, id] = values;
      const group = await this.updateGroup(id, { name, parent_id, level });
      return group ? [group] : [];
    } else if (
      /UPDATE groups SET name = \$1, parent_id = \$2 WHERE id = \$3/i.test(
        query
      )
    ) {
      // UPDATE groups SET name = $1, parent_id = $2 WHERE id = $3
      const [name, parent_id, id] = values;
      const group = await this.updateGroup(id, { name, parent_id });
      return group ? [group] : [];
    } else if (/DELETE FROM groups WHERE id = \$1/i.test(query)) {
      // DELETE FROM groups WHERE id = $1
      const [id] = values;
      await this.deleteGroup(id);
      return [];
    }

    // GROUP MEMBERS
    if (/INSERT INTO group_members/i.test(query)) {
      // INSERT INTO group_members (group_id, member_id, member_type) VALUES ($1, $2, $3)
      const [group_id, member_id, member_type] = values;
      const member = await this.addMember(group_id, member_id, member_type);
      return [member];
    } else if (
      /SELECT \* FROM group_members WHERE group_id = \$1/i.test(query)
    ) {
      // SELECT * FROM group_members WHERE group_id = $1
      const [group_id] = values;
      return await this.getGroupMembers(group_id);
    } else if (
      /SELECT \* FROM group_members WHERE group_id = \$1 AND member_id = \$2/i.test(
        query
      )
    ) {
      // SELECT * FROM group_members WHERE group_id = $1 AND member_id = $2
      const [group_id, member_id] = values;
      const members = await this.getGroupMembers(group_id);
      return members.filter((m) => m.member_id === member_id);
    } else if (
      /DELETE FROM group_members WHERE group_id = \$1 AND member_id = \$2/i.test(
        query
      )
    ) {
      // DELETE FROM group_members WHERE group_id = $1 AND member_id = $2
      const [group_id, member_id] = values;
      await this.removeMember(group_id, member_id);
      return [];
    }

    // GROUP HIERARCHY
    if (/WITH RECURSIVE group_hierarchy/i.test(query)) {
      const rootGroups = this.groups.filter((g) => g.parent_id === null);
      return rootGroups.map((group) => ({
        ...group,
        children: this.getChildGroups(group.id),
      }));
    }

    // EXISTS queries
    if (/SELECT EXISTS/i.test(query)) {
      const [group_id, member_id, member_type] = values;
      const exists = await this.isMember(group_id, member_id, member_type);
      return [{ exists }];
    }

    // TRUNCATE
    if (/TRUNCATE/i.test(query)) {
      this.reset();
      return [];
    }

    // Fallback
    return [];
  }

  // Helper method to get child groups recursively
  private getChildGroups(parentId: number): any[] {
    const children = this.groups.filter((g) => g.parent_id === parentId);
    return children.map((child) => ({
      ...child,
      children: this.getChildGroups(child.id),
    }));
  }

  // User operations
  async insertUser(name: string, email: string, type: string): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      name,
      email,
      type,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
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

  async deleteUser(id: number): Promise<boolean> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  // Group operations
  async insertGroup(
    name: string,
    parent_id: number | null,
    level: number = 0
  ): Promise<Group> {
    const group: Group = {
      id: this.nextGroupId++,
      name,
      parent_id,
      level,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.groups.push(group);
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.find((g) => g.id === id);
  }

  async getAllGroups(): Promise<Group[]> {
    return [...this.groups];
  }

  async updateGroup(
    id: number,
    data: Partial<Group>
  ): Promise<Group | undefined> {
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

  async deleteGroup(id: number): Promise<boolean> {
    const index = this.groups.findIndex((g) => g.id === id);
    if (index === -1) return false;
    this.groups.splice(index, 1);
    return true;
  }

  // Group member operations
  async addMember(
    group_id: number,
    member_id: number,
    member_type: string
  ): Promise<GroupMember> {
    const member: GroupMember = {
      id: this.nextMemberId++,
      group_id,
      member_id,
      member_type,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.groupMembers.push(member);
    return member;
  }

  async getGroupMembers(group_id: number): Promise<GroupMember[]> {
    return this.groupMembers.filter((m) => m.group_id === group_id);
  }

  async removeMember(group_id: number, member_id: number): Promise<boolean> {
    const index = this.groupMembers.findIndex(
      (m) => m.group_id === group_id && m.member_id === member_id
    );
    if (index === -1) return false;
    this.groupMembers.splice(index, 1);
    return true;
  }

  // Test helpers
  setUsers(users: User[]) {
    this.users = users;
    this.nextUserId = Math.max(...users.map((u) => u.id)) + 1;
  }

  setGroups(groups: Group[]) {
    this.groups = groups;
    this.nextGroupId = Math.max(...groups.map((g) => g.id)) + 1;
  }

  addGroupMember(group_id: number, member_id: number, member_type: string) {
    this.groupMembers.push({
      id: this.nextMemberId++,
      group_id,
      member_id,
      member_type,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async isMember(
    group_id: number,
    member_id: number,
    member_type: string
  ): Promise<boolean> {
    return this.groupMembers.some(
      (m) =>
        m.group_id === group_id &&
        m.member_id === member_id &&
        m.member_type === member_type
    );
  }
}

export const mockDb = new MockDB();
export default mockDb;
