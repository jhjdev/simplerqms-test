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
      group_id: '1',
      group_name: 'Group 1',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      type: 'user',
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
  let mockOnUserUpdate: ReturnType<typeof vi.fn>;
  
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
    mockOnUserUpdate = vi.fn();

    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/users/2') && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: '2',
            name: 'Updated Name',
            email: 'updated@example.com',
            type: 'user',
            group_id: '1',
            created_at: '2024-01-02T00:00:00Z'
          })
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
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });
    
    // Check if headers are present using role selectors
    const headers = container.querySelectorAll('th[role="columnheader"]');
    expect(headers[0].textContent?.trim()).toBe('Name ↑');
    expect(headers[1].textContent?.trim()).toBe('Email');
    expect(headers[2].textContent?.trim()).toBe('Group');
    expect(headers[3].textContent?.trim()).toBe('Created');
    expect(headers[4].textContent?.trim()).toBe('Actions');

    // Check if user data is displayed
    const cells = container.querySelectorAll('td');
    expect(cells[0].textContent?.trim()).toBe('Jane Smith');
    expect(cells[1].textContent?.trim()).toBe('jane@example.com');
    expect(cells[2].textContent?.trim()).toBe('Group 2');
  });

  it('sorts users by name when clicking name header', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });
    
    // Find and click the name header
    const nameHeader = container.querySelector('th[role="columnheader"]');
    if (!nameHeader) throw new Error('Name header not found');
    await fireEvent.click(nameHeader);
    await tick();

    // Get all user names in the table
    const userNames = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:first-child')?.textContent?.trim());

    // Check if names are sorted alphabetically (descending by default)
    expect(userNames).toEqual(['John Doe', 'Jane Smith']);

    // Click again to sort ascending
    await fireEvent.click(nameHeader);
    await tick();
    
    const userNamesAsc = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:first-child')?.textContent?.trim());
    expect(userNamesAsc).toEqual(['Jane Smith', 'John Doe']);
  });

  it('sorts users by email when clicking email header', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });
    
    // Find and click the email header
    const emailHeader = container.querySelectorAll('th[role="columnheader"]')[1];
    if (!emailHeader) throw new Error('Email header not found');
    await fireEvent.click(emailHeader);
    await tick();

    // Get all user emails in the table
    const userEmails = Array.from(container.querySelectorAll('tbody tr'))
      .map(row => row.querySelector('td:nth-child(2)')?.textContent?.trim());

    // Check if emails are sorted alphabetically (descending by default)
    expect(userEmails).toEqual(['john@example.com', 'jane@example.com']);

    // Click again to sort ascending
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
    const createdHeader = container.querySelectorAll('th[role="columnheader"]')[3];
    if (!createdHeader) throw new Error('Created header not found');
    await fireEvent.click(createdHeader);
    await tick();

    // Get all rows and check their order
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0].textContent).toContain('John Doe');
    expect(rows[1].textContent).toContain('Jane Smith');

    // Click again to sort ascending
    await fireEvent.click(createdHeader);
    await tick();
    
    const rowsAsc = container.querySelectorAll('tbody tr');
    expect(rowsAsc[0].textContent).toContain('Jane Smith');
    expect(rowsAsc[1].textContent).toContain('John Doe');
  });

  it('displays group name for users in a group', () => {
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
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Find the row for Jane Smith
    const janeRow = Array.from(container.querySelectorAll('tbody tr')).find(row => row.textContent?.includes('Jane Smith'));
    expect(janeRow).toBeTruthy();
    // Click edit button within Jane Smith's row
    const editButton = janeRow?.querySelector('.edit-button');
    expect(editButton).toBeTruthy();
    await fireEvent.click(editButton!);
    await tick();

    // Check if edit form is shown
    const editForm = container.querySelector('.edit-form');
    expect(editForm).toBeTruthy();

    // Check if form fields are populated with user data
    const nameInput = editForm?.querySelector('input[type="text"]') as HTMLInputElement;
    const emailInput = editForm?.querySelector('input[type="email"]') as HTMLInputElement;
    const groupSelect = editForm?.querySelector('select') as HTMLSelectElement;

    expect(nameInput?.value).toBe('Jane Smith');
    expect(emailInput?.value).toBe('jane@example.com');
    expect(groupSelect?.value).toBe('2');
  });

  it('updates user when save is clicked', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Find the row for Jane Smith
    const janeRow = Array.from(container.querySelectorAll('tbody tr')).find(row => row.textContent?.includes('Jane Smith'));
    expect(janeRow).toBeTruthy();
    // Click edit button within Jane Smith's row
    const editButton = janeRow?.querySelector('.edit-button');
    expect(editButton).toBeTruthy();
    await fireEvent.click(editButton!);
    await tick();

    // Update form fields
    const editForm = container.querySelector('.edit-form');
    const nameInput = editForm?.querySelector('input[type="text"]') as HTMLInputElement;
    const emailInput = editForm?.querySelector('input[type="email"]') as HTMLInputElement;
    const groupSelect = editForm?.querySelector('select') as HTMLSelectElement;

    await fireEvent.input(nameInput, { target: { value: 'Updated Name' } });
    await fireEvent.input(emailInput, { target: { value: 'updated@example.com' } });
    await fireEvent.change(groupSelect, { target: { value: '1' } });
    await tick();

    // Try to find the save button in the same row as the edit form
    let saveButton = janeRow?.querySelector('.edit-button');
    if (!saveButton) {
      // eslint-disable-next-line no-console
      console.log('Row HTML:', janeRow?.outerHTML);
    }
    expect(saveButton).toBeTruthy();
    await fireEvent.click(saveButton!);
    await tick();

    // Verify API call
    expect(fetch).toHaveBeenCalledWith('/api/users/2', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Updated Name',
        email: 'updated@example.com',
        type: 'user',
        group_id: '1'
      }),
    });
  });

  it('deletes user when delete is confirmed', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      }
    });

    // Find the row for Jane Smith
    const janeRow = Array.from(container.querySelectorAll('tbody tr')).find(row => row.textContent?.includes('Jane Smith'));
    expect(janeRow).toBeTruthy();
    // Click delete button within Jane Smith's row
    const deleteButton = janeRow?.querySelector('.delete-button');
    expect(deleteButton).toBeTruthy();
    await fireEvent.click(deleteButton!);
    await tick();

    // Find and click the confirm button in the dialog (look for button with text 'Delete')
    const confirmButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.trim() === 'Delete');
    expect(confirmButton).toBeTruthy();
    await fireEvent.click(confirmButton!);
    await tick();

    // Verify API call
    expect(fetch).toHaveBeenCalledWith('/api/users/2', {
      method: 'DELETE',
    });
  });
}); 
