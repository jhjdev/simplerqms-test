import { mockDb } from './db';

// Simple SQL parser that extracts the operation and values
function parseSQL(strings: TemplateStringsArray, values: any[]) {
  const query = strings.join('?');
  const operation = query.trim().split(' ')[0].toUpperCase();
  return { operation, query, values };
}

// Mock SQL template literal tag
const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  const { operation, query, values: queryValues } = parseSQL(strings, values);

  // Handle different SQL operations
  switch (operation) {
    case 'SELECT':
      if (query.includes('FROM users')) {
        return mockDb.getAllUsers();
      }
      if (query.includes('FROM groups')) {
        return mockDb.getAllGroups();
      }
      if (query.includes('FROM group_members')) {
        const groupId = queryValues.find((v) => typeof v === 'number');
        if (groupId) {
          return mockDb.getGroupMembers(groupId);
        }
      }
      break;

    case 'INSERT':
      if (query.includes('INTO users')) {
        const [name, email, type] = queryValues;
        return [await mockDb.insertUser(name, email, type)];
      }
      if (query.includes('INTO groups')) {
        const [name, parent_id] = queryValues;
        return [await mockDb.insertGroup(name, parent_id)];
      }
      if (query.includes('INTO group_members')) {
        const [group_id, member_id, member_type] = queryValues;
        return [await mockDb.addMember(group_id, member_id, member_type)];
      }
      break;

    case 'UPDATE':
      if (query.includes('users')) {
        const id = queryValues.find((v) => typeof v === 'number');
        if (id) {
          const updates: Record<string, any> = {};
          for (let i = 0; i < queryValues.length; i++) {
            if (queryValues[i] !== id) {
              const field = query.split('=')[i].trim();
              updates[field] = queryValues[i];
            }
          }
          return [await mockDb.updateUser(id, updates)];
        }
      }
      if (query.includes('groups')) {
        const id = queryValues.find((v) => typeof v === 'number');
        if (id) {
          const updates: Record<string, any> = {};
          for (let i = 0; i < queryValues.length; i++) {
            if (queryValues[i] !== id) {
              const field = query.split('=')[i].trim();
              updates[field] = queryValues[i];
            }
          }
          return [await mockDb.updateGroup(id, updates)];
        }
      }
      break;

    case 'DELETE':
      if (query.includes('FROM users')) {
        const id = queryValues.find((v) => typeof v === 'number');
        if (id) {
          await mockDb.deleteUser(id);
          return [];
        }
      }
      if (query.includes('FROM groups')) {
        const id = queryValues.find((v) => typeof v === 'number');
        if (id) {
          await mockDb.deleteGroup(id);
          return [];
        }
      }
      if (query.includes('FROM group_members')) {
        const [group_id, member_id] = queryValues;
        if (group_id && member_id) {
          await mockDb.removeMember(group_id, member_id);
          return [];
        }
      }
      break;
  }

  // Default: return empty array for unhandled queries
  return [];
};

export default sql;
