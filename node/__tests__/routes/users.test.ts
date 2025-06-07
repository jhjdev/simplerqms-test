import { mock } from '../mocks/mock';

describe('User Routes', () => {
  beforeEach(() => {
    mock.reset();
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
  });

  describe('GET /api/users', () => {
    it('should return all users', () => {
      const users = mock.getUsers();
      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by id', () => {
      const user = mock.getUser(1);
      expect(user).toMatchObject({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should return null for non-existent user', () => {
      const user = mock.getUser(999);
      expect(user).toBeNull();
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
      };

      const user = mock.createUser(userData);
      expect(user).toMatchObject({
        name: userData.name,
        email: userData.email,
      });
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update a user', () => {
      const updateData = {
        name: 'Updated User',
      };

      const user = mock.updateUser(1, updateData);
      expect(user).toMatchObject({
        id: 1,
        name: updateData.name,
        email: 'test@example.com',
      });
    });

    it('should return null for non-existent user', () => {
      const user = mock.updateUser(999, { name: 'Updated' });
      expect(user).toBeNull();
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', () => {
      const result = mock.deleteUser(1);
      expect(result).toEqual({ success: true });
    });

    it('should return null for non-existent user', () => {
      const result = mock.deleteUser(999);
      expect(result).toBeNull();
    });
  });
});
