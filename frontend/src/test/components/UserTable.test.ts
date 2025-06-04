import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UserTable from '../../components/UserTable.svelte';
import type { User, Group } from '../../types';
import { tick } from 'svelte';

// Mock CSS imports
vi.mock('../../styles/components/UserTable.css', () => ({}));
vi.mock('material-icons/iconfont/material-icons.css', () => ({}));

describe('UserTable', () => {
  let mockUsers: User[];
  let mockGroups: Group[];
  let mockOnUserEdit: ReturnType<typeof vi.fn>;
  let mockOnUserDelete: ReturnType<typeof vi.fn>;
  
  // Target DOM element that will be shared across tests
  let target: HTMLDivElement;
  
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    
    // Create a fresh target for each test
    target = document.createElement('div');
    document.body.appendChild(target);
    
    // Mock confirm method to always return true for tests
    window.confirm = vi.fn(() => true);
    
    // Add table-related ARIA roles to jsdom
    document.body.setAttribute('role', 'document');

    mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', groupId: '1', type: 'user' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', groupId: '2', type: 'user' }
    ];

    mockGroups = [
      { 
        id: '1', 
        name: 'Group 1', 
        parent_id: null, 
        type: 'group',
        level: 0,
        users: [],
        children: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      { 
        id: '2', 
        name: 'Group 2', 
        parent_id: null, 
        type: 'group',
        level: 0,
        users: [],
        children: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    mockOnUserEdit = vi.fn();
    mockOnUserDelete = vi.fn();
  });
  
  afterEach(() => {
    // Clean up
    if (target && target.parentNode) {
      target.parentNode.removeChild(target);
    }
    cleanup();
  });

  it('renders user table with correct data', () => {
    const { container, getByText, getAllByRole } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });
    
    // Check if headers are present using getByRole for column headers
    expect(getAllByRole('columnheader', { name: /Name/i })[0]).toBeTruthy();
    expect(getAllByRole('columnheader', { name: /Email/i })[0]).toBeTruthy();
    expect(getAllByRole('columnheader', { name: /Group/i })[0]).toBeTruthy();
    expect(getAllByRole('columnheader', { name: /Created/i })[0]).toBeTruthy();
    expect(getAllByRole('columnheader', { name: /Actions/i })[0]).toBeTruthy();

    // Check if user data is displayed
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
    expect(getByText('Jane Smith')).toBeTruthy();
    expect(getByText('jane@example.com')).toBeTruthy();
  });

  it('sorts users by name when clicking name header', async () => {
    const { container, getByText } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });
    
    // Find and click the name header using more flexible text matching
    const nameHeader = getByText(/Name/i);
    await fireEvent.click(nameHeader);

    // Get all user names in the table
    const userNames = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:first-child')?.textContent?.trim());

    // Check if names are sorted alphabetically (descending by default)
    expect(userNames).toEqual(['John Doe', 'Jane Smith']);

    // Click again to sort in ascending order
    await fireEvent.click(nameHeader);
    const userNamesAsc = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:first-child')?.textContent?.trim());
    expect(userNamesAsc).toEqual(['Jane Smith', 'John Doe']);
  });

  it('sorts users by creation date', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Click the created header to sort
    const createdHeader = container.querySelector('.sortable:nth-child(4)');
    if (!createdHeader) throw new Error('Created header not found');
    await fireEvent.click(createdHeader);
    await tick();

    // Check ascending order
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Jane Smith');
    expect(rows[1].textContent).toContain('John Doe');

    // Click again to sort descending
    await fireEvent.click(createdHeader);
    await tick();

    // Check descending order
    expect(rows[0].textContent).toContain('John Doe');
    expect(rows[1].textContent).toContain('Jane Smith');
  });

  it('displays group name for users in a group', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });

    // Check if group name is displayed for John Doe
    const groupCells = container.querySelectorAll('tbody tr td:nth-child(3)');
    expect(groupCells[0]?.textContent?.trim()).toBe('Group 2');

    // Check if group name is displayed for Jane Smith
    expect(groupCells[1]?.textContent?.trim()).toBe('Group 1');
  });

  it('shows edit form when edit button is clicked', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });

    // Find and click the edit button for John Doe
    const editButton = container.querySelector('button[data-testid="edit-user-1"]');
    if (!editButton) throw new Error('Edit button not found');
    await fireEvent.click(editButton);

    // Check if the edit form is displayed with correct values
    const nameInput = container.querySelector('input[data-testid="edit-name-1"]');
    const emailInput = container.querySelector('input[data-testid="edit-email-1"]');
    const groupSelect = container.querySelector('select[data-testid="edit-group-1"]');

    if (!nameInput || !emailInput || !groupSelect) throw new Error('Edit form fields not found');

    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(groupSelect).toHaveValue('1');
  });

  it('dispatches edit event', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Click edit button for first user
    const editButton = container.querySelector('[data-testid="edit-user-1"]');
    if (!editButton) throw new Error('Edit button not found');
    await fireEvent.click(editButton);
    await tick();

    // Fill in edit form
    const nameInput = container.querySelector('[data-testid="edit-name-1"]');
    const emailInput = container.querySelector('[data-testid="edit-email-1"]');
    if (!nameInput || !emailInput) throw new Error('Edit inputs not found');

    await fireEvent.input(nameInput, { target: { value: 'Updated Name' } });
    await fireEvent.input(emailInput, { target: { value: 'updated@example.com' } });
    await tick();

    // Click save button
    const saveButton = container.querySelector('[data-testid="save-edit-1"]');
    if (!saveButton) throw new Error('Save button not found');
    await fireEvent.click(saveButton);
    await tick();

    // Check that the event was dispatched with correct data
    expect(mockOnUserEdit).toHaveBeenCalledWith({
      userId: '1',
      name: 'Updated Name',
      email: 'updated@example.com',
      groupId: null
    });
  });

  it('dispatches delete event', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Click delete button for first user
    const deleteButton = container.querySelector('[data-testid="delete-user-1"]');
    if (!deleteButton) throw new Error('Delete button not found');
    await fireEvent.click(deleteButton);
    await tick();

    // Check that the event was dispatched with correct data
    expect(mockOnUserDelete).toHaveBeenCalledWith({ userId: '1' });
  });

  it('cancels edit mode when cancel button is clicked', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });

    // Enter edit mode
    const editButton = container.querySelector('button[data-testid="edit-user-1"]');
    if (!editButton) throw new Error('Edit button not found');
    await fireEvent.click(editButton);

    // Click cancel button
    const cancelButton = container.querySelector('button[data-testid="cancel-edit-1"]');
    if (!cancelButton) throw new Error('Cancel button not found');
    await fireEvent.click(cancelButton);

    // Wait for state updates
    await tick();

    // Check if edit form is hidden
    const nameInput = container.querySelector('input[data-testid="edit-name-1"]');
    expect(nameInput).not.toBeInTheDocument();

    // Check if original data is displayed
    const nameCell = container.querySelector('tbody tr:first-child td:first-child');
    expect(nameCell).toHaveTextContent('Jane Smith');
  });

  it('displays empty state message when no users exist', () => {
    const { getByText } = render(UserTable, {
      props: {
        users: [],
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });

    expect(getByText('No users found. Create your first user above!')).toBeTruthy();
  });

  it('maintains table structure in responsive view', () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });

    // Check if table has responsive container
    const tableContainer = container.querySelector('.table-section');
    expect(tableContainer).toBeTruthy();

    // Check if table has SMUI DataTable class
    const table = container.querySelector('.mdc-data-table');
    expect(table).toBeTruthy();
  });
}); 
