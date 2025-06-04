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
    
    // Find and click the name header
    const nameHeader = getByText(/Name/i);
    await fireEvent.click(nameHeader);
    await tick();

    // Get all user names in the table
    const userNames = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:first-child')?.textContent?.trim());

    // Check if names are sorted alphabetically (descending by default)
    expect(userNames).toEqual(['John Doe', 'Jane Smith']);

    // Click again to sort in ascending order
    await fireEvent.click(nameHeader);
    await tick();
    
    const userNamesAsc = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:first-child')?.textContent?.trim());
    expect(userNamesAsc).toEqual(['Jane Smith', 'John Doe']);
  });

  it('sorts users by email when clicking email header', async () => {
    const { container, getByText } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });
    
    // Find and click the email header
    const emailHeader = getByText(/Email/i);
    await fireEvent.click(emailHeader);
    await tick();

    // Get all user emails in the table
    const userEmails = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:nth-child(2)')?.textContent?.trim());

    // Check if emails are sorted alphabetically (descending by default)
    expect(userEmails).toEqual(['jane@example.com', 'john@example.com']);

    // Click again to sort in ascending order
    await fireEvent.click(emailHeader);
    await tick();
    
    const userEmailsAsc = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:nth-child(2)')?.textContent?.trim());
    expect(userEmailsAsc).toEqual(['john@example.com', 'jane@example.com']);
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

    // Check descending order (default)
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('Jane Smith');
    expect(rows[1].textContent).toContain('John Doe');

    // Click again to sort ascending
    await fireEvent.click(createdHeader);
    await tick();

    // Check ascending order
    expect(rows[0].textContent).toContain('John Doe');
    expect(rows[1].textContent).toContain('Jane Smith');
  });

  it('displays group name for users in a group', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Check if group name is displayed for John Doe
    const groupCells = container.querySelectorAll('tbody tr td:nth-child(3)');
    expect(groupCells[0]?.textContent?.trim()).toBe('None');

    // Check if group name is displayed for Jane Smith
    expect(groupCells[1]?.textContent?.trim()).toBe('None');
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
    const editButton = container.querySelector('.edit-button');
    if (!editButton) throw new Error('Edit button not found');
    await fireEvent.click(editButton);
    await tick();

    // Check if the edit form is displayed with correct values
    const nameInput = container.querySelector('input[type="text"]');
    const emailInput = container.querySelector('input[type="email"]');
    const groupSelect = container.querySelector('select.group-select');

    if (!nameInput || !emailInput || !groupSelect) throw new Error('Edit form fields not found');

    expect(nameInput).toHaveValue('Jane Smith');
    expect(emailInput).toHaveValue('jane@example.com');
    expect(groupSelect).toHaveValue(''); // Should be empty since user has no group
  });

  it('dispatches edit event with updated values', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });

    // Click edit button for first user
    const editButton = container.querySelector('.edit-button');
    if (!editButton) throw new Error('Edit button not found');
    await fireEvent.click(editButton);
    await tick();

    // Fill in edit form
    const nameInput = container.querySelector('input[type="text"]');
    const emailInput = container.querySelector('input[type="email"]');
    const groupSelect = container.querySelector('select.group-select');
    if (!nameInput || !emailInput || !groupSelect) throw new Error('Edit inputs not found');

    await fireEvent.input(nameInput, { target: { value: 'Updated Name' } });
    await fireEvent.input(emailInput, { target: { value: 'updated@example.com' } });
    await fireEvent.change(groupSelect, { target: { value: '2' } });
    await tick();

    // Click save button
    const saveButton = container.querySelector('.edit-button');
    if (!saveButton) throw new Error('Save button not found');
    await fireEvent.click(saveButton);
    await tick();

    // Check that the event was dispatched with correct data
    expect(mockOnUserEdit).toHaveBeenCalledWith({
      userId: '1',
      name: 'Updated Name',
      email: 'updated@example.com',
      groupId: '2'
    });
  });

  it('dispatches delete event with confirmation', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups,
        onUserEdit: mockOnUserEdit,
        onUserDelete: mockOnUserDelete
      }
    });

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    // Click delete button for first user
    const deleteButton = container.querySelector('.delete-button');
    if (!deleteButton) throw new Error('Delete button not found');
    await fireEvent.click(deleteButton);
    await tick();

    // Verify confirmation dialog was shown
    expect(window.confirm).toHaveBeenCalled();

    // Verify delete event was dispatched with correct user ID
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

    // Enter edit mode
    const editButton = container.querySelector('.edit-button');
    if (!editButton) throw new Error('Edit button not found');
    await fireEvent.click(editButton);
    await tick();

    // Click cancel button
    const cancelButton = container.querySelector('.delete-button');
    if (!cancelButton) throw new Error('Cancel button not found');
    await fireEvent.click(cancelButton);
    await tick();

    // Check if edit form is hidden
    const nameInput = container.querySelector('input[type="text"]');
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
