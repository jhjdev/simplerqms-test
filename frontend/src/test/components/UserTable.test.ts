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
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      group_id: '1',
      created_at: '2024-03-20T00:00:00Z',
      type: 'user',
      groupId: '1'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      group_id: null,
      created_at: '2024-03-21T00:00:00Z',
      type: 'user',
      groupId: null
    }
  ];

  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Test Group',
      parent_id: null,
      children: [],
      users: [],
      type: 'group',
      level: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];
  
  // Mock event dispatch handlers
  const mockOnUserEdit = vi.fn();
  const mockOnUserDelete = vi.fn();
  
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

    // Check if names are sorted alphabetically (ascending by default)
    expect(userNames).toEqual(['Jane Smith', 'John Doe']);

    // Click again to sort in descending order
    await fireEvent.click(nameHeader);
    const userNamesDesc = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:first-child')?.textContent?.trim());
    expect(userNamesDesc).toEqual(['John Doe', 'Jane Smith']);
  });

  it('sorts users by creation date when clicking created header', async () => {
    const { container, getByText } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });
    
    // Find and click the created header using more flexible text matching
    const createdHeader = getByText(/Created/i);
    await fireEvent.click(createdHeader);

    // Get all user names in the table
    const userNames = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:first-child')?.textContent?.trim());

    // Check if names are sorted by creation date (ascending by default)
    expect(userNames).toEqual(['John Doe', 'Jane Smith']);

    // Click again to sort in descending order
    await fireEvent.click(createdHeader);
    const userNamesDesc = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:first-child')?.textContent?.trim());
    expect(userNamesDesc).toEqual(['Jane Smith', 'John Doe']);
  });

  it('displays group name for users in a group', () => {
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
    expect(groupCells[1]?.textContent?.trim()).toBe('Test Group');

    // Check if "None" is displayed for Jane Smith
    expect(groupCells[0]?.textContent?.trim()).toBe('None');
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

    // Find the row for John Doe
    const rows = Array.from(container.querySelectorAll('tbody tr'));
    const johnRow = rows.find(row => row.textContent?.includes('John Doe'));
    if (!johnRow) throw new Error('John Doe row not found');
    const editButton = johnRow.querySelector('button.edit-button');
    if (!editButton) throw new Error('Edit button not found');
    await fireEvent.click(editButton);

    // Check if edit form is shown
    const nameInput = container.querySelector('input.edit-input[type="text"]');
    const emailInput = container.querySelector('input.edit-input[type="email"]');
    const groupSelect = container.querySelector('select.group-select');

    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(groupSelect).toBeTruthy();

    // Check if form is pre-filled with user data
    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(groupSelect).toHaveValue('1');
  });

  it('dispatches userEdit event when save is clicked', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });

    // Find the row for John Doe
    const rows = Array.from(container.querySelectorAll('tbody tr'));
    const johnRow = rows.find(row => row.textContent?.includes('John Doe'));
    if (!johnRow) throw new Error('John Doe row not found');
    const editButton = johnRow.querySelector('button.edit-button');
    if (!editButton) throw new Error('Edit button not found');
    await fireEvent.click(editButton);

    // Find and fill edit form
    const nameInput = container.querySelector('input.edit-input[type="text"]');
    const emailInput = container.querySelector('input.edit-input[type="email"]');
    const groupSelect = container.querySelector('select.group-select');

    if (!nameInput || !emailInput || !groupSelect) throw new Error('Edit form fields not found');

    await fireEvent.input(nameInput, { target: { value: 'John Updated' } });
    await fireEvent.input(emailInput, { target: { value: 'john.updated@example.com' } });
    await fireEvent.change(groupSelect, { target: { value: '1' } });

    // Find and click save button
    const saveButton = container.querySelector('button.edit-button i.material-icons');
    if (!saveButton) throw new Error('Save button not found');
    await fireEvent.click(saveButton);

    // Check if onUserEdit was called with correct data
    expect(mockOnUserEdit).toHaveBeenCalledWith('1', 'John Updated', 'john.updated@example.com', '1');
  });

  it('dispatches userDelete event when delete button is clicked', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });

    // Find the row for John Doe
    const rows = Array.from(container.querySelectorAll('tbody tr'));
    const johnRow = rows.find(row => row.textContent?.includes('John Doe'));
    if (!johnRow) throw new Error('John Doe row not found');
    const deleteButton = johnRow.querySelector('button.delete-button');
    if (!deleteButton) throw new Error('Delete button not found');
    await fireEvent.click(deleteButton);

    // Check if onUserDelete was called with correct user ID
    expect(mockOnUserDelete).toHaveBeenCalledWith('1');
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

    // Find the row for John Doe
    const rows = Array.from(container.querySelectorAll('tbody tr'));
    const johnRow = rows.find(row => row.textContent?.includes('John Doe'));
    if (!johnRow) throw new Error('John Doe row not found');
    const editButton = johnRow.querySelector('button.edit-button');
    if (!editButton) throw new Error('Edit button not found');
    await fireEvent.click(editButton);

    // Check if edit form is shown
    const nameInput = container.querySelector('input.edit-input[type="text"]');
    expect(nameInput).toBeTruthy();

    // Find and click cancel button
    const cancelButton = container.querySelector('button.delete-button i.material-icons');
    if (!cancelButton) throw new Error('Cancel button not found');
    await fireEvent.click(cancelButton);

    // Check if edit form is hidden
    const nameInputAfterCancel = container.querySelector('input.edit-input[type="text"]');
    expect(nameInputAfterCancel).toBeFalsy();

    // Check if original data is displayed in John Doe's row
    const johnRowAfter = Array.from(container.querySelectorAll('tbody tr')).find(row => row.textContent?.includes('John Doe'));
    expect(johnRowAfter?.querySelector('td:first-child')?.textContent?.trim()).toBe('John Doe');
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
