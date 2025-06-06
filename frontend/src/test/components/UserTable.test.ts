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
      type: 'user',
      groupId: '1',
      group_id: '1',
      group_name: 'Group 1',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      type: 'user',
      groupId: '2',
      group_id: '2',
      group_name: 'Group 2',
      created_at: '2024-01-02T00:00:00Z'
    }
  ];

  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Group 1',
      type: 'group',
      parent_id: null,
      level: 0,
      users: [],
      children: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Group 2',
      type: 'group',
      parent_id: null,
      level: 0,
      users: [],
      children: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

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

    mockOnUserEdit = vi.fn();
    mockOnUserDelete = vi.fn();

    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/users/2') && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      if (url.includes('/api/users/2') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      return Promise.reject(new Error('Network error'));
    });
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
        groups: mockGroups
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
        groups: mockGroups
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
        groups: mockGroups
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
    expect(userEmails).toEqual(['john@example.com', 'jane@example.com']);

    // Click again to sort in ascending order
    await fireEvent.click(emailHeader);
    await tick();
    
    const userEmailsAsc = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:nth-child(2)')?.textContent?.trim());
    expect(userEmailsAsc).toEqual(['jane@example.com', 'john@example.com']);
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
    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0].textContent).toContain('John Doe');
      expect(rows[1].textContent).toContain('Jane Smith');
    });

    // Click again to sort ascending
    await fireEvent.click(createdHeader);
    await tick();
    await waitFor(() => {
      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0].textContent).toContain('Jane Smith');
      expect(rows[1].textContent).toContain('John Doe');
    });
  });

  it('displays group name for users in a group', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Get all group cells
    const groupCells = container.querySelectorAll('tbody tr td:nth-child(3)');
    
    // Find the cells by their content
    const johnDoeCell = Array.from(groupCells).find(cell => 
      cell.closest('tr')?.textContent?.includes('John Doe')
    );
    const janeSmithCell = Array.from(groupCells).find(cell => 
      cell.closest('tr')?.textContent?.includes('Jane Smith')
    );

    expect(johnDoeCell?.textContent?.trim()).toBe('Group 1');
    expect(janeSmithCell?.textContent?.trim()).toBe('Group 2');
  });

  it('shows edit form when edit button is clicked', async () => {
    const { container, getByText, component } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });
    // Click edit button for Jane Smith
    const editButtons = container.querySelectorAll('.edit-button');
    expect(editButtons.length).toBeGreaterThan(1);
    
    // Find the edit button for Jane Smith
    const janeSmithRow = Array.from(container.querySelectorAll('tbody tr')).find(row => 
      row.textContent?.includes('Jane Smith')
    );
    const janeSmithEditButton = janeSmithRow?.querySelector('.edit-button');
    expect(janeSmithEditButton).toBeTruthy();
    
    if (!janeSmithEditButton) throw new Error('Edit button for Jane Smith not found');
    await fireEvent.click(janeSmithEditButton);
    await tick();
    
    // Check that the form fields are populated
    const nameInput = container.querySelector('.edit-input[type="text"]') as HTMLInputElement | null;
    const emailInput = container.querySelector('.edit-input[type="email"]') as HTMLInputElement | null;
    const groupSelect = container.querySelector('.group-select') as HTMLSelectElement | null;
    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(groupSelect).toBeTruthy();
    if (!nameInput || !emailInput || !groupSelect) throw new Error('Edit form fields not found');
    expect(nameInput.value).toBe('Jane Smith');
    expect(emailInput.value).toBe('jane@example.com');
    // The group select should have value '2' for Jane Smith
    expect(groupSelect.value).toBe('2');
  });

  it('dispatches edit event with updated values', async () => {
    const { container, getByText, component } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });
    const userEditHandler = vi.fn();
    component.$on('userEdit', userEditHandler);
    
    // Find and click edit button for Jane Smith
    const janeSmithRow = Array.from(container.querySelectorAll('tbody tr')).find(row => 
      row.textContent?.includes('Jane Smith')
    );
    const janeSmithEditButton = janeSmithRow?.querySelector('.edit-button');
    expect(janeSmithEditButton).toBeTruthy();
    
    if (!janeSmithEditButton) throw new Error('Edit button for Jane Smith not found');
    await fireEvent.click(janeSmithEditButton);
    await tick();
    
    // Change name and email
    const nameInput = container.querySelector('.edit-input[type="text"]') as HTMLInputElement | null;
    const emailInput = container.querySelector('.edit-input[type="email"]') as HTMLInputElement | null;
    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    if (!nameInput || !emailInput) throw new Error('Edit form fields not found');
    await fireEvent.input(nameInput, { target: { value: 'Updated Name' } });
    await fireEvent.input(emailInput, { target: { value: 'updated@example.com' } });
    
    // Save
    const saveButton = container.querySelector('.edit-button i.material-icons')?.closest('button');
    expect(saveButton).toBeTruthy();
    if (!saveButton) throw new Error('Save button not found');
    await fireEvent.click(saveButton);
    await tick();
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async operations
    
    expect(userEditHandler).toHaveBeenCalled();
    const event = userEditHandler.mock.calls[0][0];
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.detail).toEqual({
      userId: '2',
      name: 'Updated Name',
      email: 'updated@example.com',
      groupId: '2',
    });
  });

  it('dispatches delete event with confirmation', async () => {
    const { container, component } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Set up event listener
    const userDeleteHandler = vi.fn();
    component.$on('userDelete', userDeleteHandler);

    // Find and click the delete button for the second user
    const deleteButtons = container.querySelectorAll('.delete-button');
    const sortedUsers = [...mockUsers].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const secondUserIndex = sortedUsers.findIndex(user => user.id === '2');
    if (!deleteButtons[secondUserIndex]) throw new Error('Delete button for second user not found');
    await fireEvent.click(deleteButtons[secondUserIndex]);
    await tick();

    // Wait for the dialog to be rendered
    await new Promise(resolve => setTimeout(resolve, 0));

    // Find and click the confirm button in the delete dialog
    const dialog = container.querySelector('[data-testid="delete-dialog"]');
    if (!dialog) throw new Error('Delete dialog not found');

    const confirmButton = dialog.querySelector('.mdc-button--raised.danger');
    if (!confirmButton) throw new Error('Confirm button not found');
    await fireEvent.click(confirmButton);
    await tick();

    // Wait for the fetch call to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check that the event was dispatched with the correct user ID
    expect(userDeleteHandler).toHaveBeenCalled();
    expect(userDeleteHandler.mock.calls[0][0].detail).toEqual({ userId: '2' });
  });

  it('cancels edit mode when cancel button is clicked', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
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
        groups: mockGroups
      }
    });

    expect(getByText('No users found. Create your first user above!')).toBeTruthy();
  });

  it('maintains table structure in responsive view', () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Check if table has responsive container
    const tableContainer = container.querySelector('.table-section');
    expect(tableContainer).toBeTruthy();

    // Check if table has SMUI DataTable class
    const table = container.querySelector('.mdc-data-table');
    expect(table).toBeTruthy();
  });

  it('handles user edit', async () => {
    const { container, getByText, component } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });
    const userEditHandler = vi.fn();
    component.$on('userEdit', userEditHandler);
    
    // Find and click edit button for Jane Smith
    const janeSmithRow = Array.from(container.querySelectorAll('tbody tr')).find(row => 
      row.textContent?.includes('Jane Smith')
    );
    const janeSmithEditButton = janeSmithRow?.querySelector('.edit-button');
    expect(janeSmithEditButton).toBeTruthy();
    
    if (!janeSmithEditButton) throw new Error('Edit button for Jane Smith not found');
    await fireEvent.click(janeSmithEditButton);
    await tick();
    
    // Change name and email
    const nameInput = container.querySelector('.edit-input[type="text"]') as HTMLInputElement | null;
    const emailInput = container.querySelector('.edit-input[type="email"]') as HTMLInputElement | null;
    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    if (!nameInput || !emailInput) throw new Error('Edit form fields not found');
    await fireEvent.input(nameInput, { target: { value: 'Updated Name' } });
    await fireEvent.input(emailInput, { target: { value: 'updated@example.com' } });
    
    // Save
    const saveButton = container.querySelector('.edit-button i.material-icons')?.closest('button');
    expect(saveButton).toBeTruthy();
    if (!saveButton) throw new Error('Save button not found');
    await fireEvent.click(saveButton);
    await tick();
    expect(userEditHandler).toHaveBeenCalled();
  });

  it('handles user delete', async () => {
    const { container, getByText, component } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });
    const userDeleteHandler = vi.fn();
    component.$on('userDelete', userDeleteHandler);
    
    // Find and click delete button for Jane Smith
    const janeSmithRow = Array.from(container.querySelectorAll('tbody tr')).find(row => 
      row.textContent?.includes('Jane Smith')
    );
    const janeSmithDeleteButton = janeSmithRow?.querySelector('.delete-button');
    expect(janeSmithDeleteButton).toBeTruthy();
    
    if (!janeSmithDeleteButton) throw new Error('Delete button for Jane Smith not found');
    await fireEvent.click(janeSmithDeleteButton);
    await tick();
    
    // Confirm deletion in dialog
    const confirmButton = getByText('Delete');
    expect(confirmButton).toBeTruthy();
    await fireEvent.click(confirmButton);
    await tick();
    expect(userDeleteHandler).toHaveBeenCalled();
  });

  it('handles group selection', async () => {
    const { container, getByText, component } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });
    const userEditHandler = vi.fn();
    component.$on('userEdit', userEditHandler);
    
    // Find and click edit button for Jane Smith
    const janeSmithRow = Array.from(container.querySelectorAll('tbody tr')).find(row => 
      row.textContent?.includes('Jane Smith')
    );
    const janeSmithEditButton = janeSmithRow?.querySelector('.edit-button');
    expect(janeSmithEditButton).toBeTruthy();
    
    if (!janeSmithEditButton) throw new Error('Edit button for Jane Smith not found');
    await fireEvent.click(janeSmithEditButton);
    await tick();
    
    // Select a group
    const groupSelect = container.querySelector('.group-select') as HTMLSelectElement | null;
    expect(groupSelect).toBeTruthy();
    if (!groupSelect) throw new Error('Group select not found');
    await fireEvent.change(groupSelect, { target: { value: '2' } });
    await tick();
    
    // Save
    const saveButton = container.querySelector('.edit-button i.material-icons')?.closest('button');
    expect(saveButton).toBeTruthy();
    if (!saveButton) throw new Error('Save button not found');
    await fireEvent.click(saveButton);
    await tick();
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async operations
    expect(userEditHandler).toHaveBeenCalled();
    const event = userEditHandler.mock.calls[0][0];
    expect(event.detail.groupId).toBe('2');
  });
}); 
