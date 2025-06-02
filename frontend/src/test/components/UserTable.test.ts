import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import UserTable from '../../components/UserTable.svelte';
import type { User, Group } from '../../types';

// Mock SMUI components
vi.mock('@smui/data-table', () => ({
  default: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  }),
  Head: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  }),
  Body: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  }),
  Row: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  }),
  Cell: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  })
}));

vi.mock('@smui/button', () => ({
  default: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  })
}));

vi.mock('@smui/icon-button', () => ({
  default: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  })
}));

vi.mock('@smui/select', () => ({
  default: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  }),
  Option: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  })
}));

describe('UserTable', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      type: 'user',
      groupId: null,
      created_at: '2024-03-20T10:00:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      type: 'user',
      groupId: '1',
      created_at: '2024-03-21T10:00:00Z'
    }
  ];

  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Test Group',
      type: 'group',
      parent_id: null,
      level: 0,
      users: [],
      children: [],
      created_at: '2024-03-20T10:00:00Z',
      updated_at: '2024-03-20T10:00:00Z'
    }
  ];

  it('renders user table with correct data', () => {
    render(UserTable, { users: mockUsers, groups: mockGroups });
    
    // Check if user names are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Check if emails are displayed
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('sorts users by name when clicking name header', async () => {
    render(UserTable, { users: mockUsers, groups: mockGroups });
    
    // Click name header to sort
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    await fireEvent.click(nameHeader);
    
    // Get all name cells
    const nameCells = screen.getAllByRole('cell').filter(cell => 
      cell.textContent === 'John Doe' || cell.textContent === 'Jane Smith'
    );
    
    // Check if names are sorted alphabetically
    expect(nameCells[0].textContent).toBe('Jane Smith');
    expect(nameCells[1].textContent).toBe('John Doe');
  });

  it('sorts users by creation date when clicking created header', async () => {
    render(UserTable, { users: mockUsers, groups: mockGroups });
    
    // Click created header to sort
    const createdHeader = screen.getByRole('columnheader', { name: 'Created' });
    await fireEvent.click(createdHeader);
    
    // Get all name cells to check order
    const nameCells = screen.getAllByRole('cell').filter(cell => 
      cell.textContent === 'John Doe' || cell.textContent === 'Jane Smith'
    );
    
    // Check if names are sorted by creation date (John created before Jane)
    expect(nameCells[0].textContent).toBe('John Doe');
    expect(nameCells[1].textContent).toBe('Jane Smith');
  });

  it('displays group name for users in a group', () => {
    render(UserTable, { users: mockUsers, groups: mockGroups });
    
    // Check if group name is displayed for Jane Smith
    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('shows edit form when edit button is clicked', async () => {
    render(UserTable, { users: mockUsers, groups: mockGroups });
    
    // Click edit button for first user
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await fireEvent.click(editButtons[0]);
    
    // Check if edit form is displayed
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
  });
}); 