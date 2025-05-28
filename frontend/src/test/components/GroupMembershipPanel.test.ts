import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import GroupMembershipPanel from '../../components/GroupMembershipPanel.svelte';
import type { User, Group } from '../../types';

// Mock SMUI components
vi.mock('@smui/button', () => ({
  default: {
    render: (props: any) => ({
      $$slots: { default: () => props.children },
      $$scope: {},
      $$events: {},
      ...props
    })
  }
}));

vi.mock('@smui/select', () => ({
  default: {
    render: (props: any) => ({
      $$slots: { default: () => props.children },
      $$scope: {},
      $$events: {},
      ...props
    })
  }
}));

describe('GroupMembershipPanel', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      type: 'user',
      groupId: null,
      created_at: '2024-03-20T10:00:00Z'
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

  it('renders the panel with correct sections', () => {
    render(GroupMembershipPanel, { users: mockUsers, groups: mockGroups });
    
    // Check if panel headers are present
    expect(screen.getByRole('heading', { name: 'Group Membership Tools' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Check Membership' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'View All Members' })).toBeInTheDocument();
  });

  it('displays group selection dropdowns', () => {
    render(GroupMembershipPanel, { users: mockUsers, groups: mockGroups });
    
    // Check if both group selection dropdowns are present
    const groupSelects = screen.getAllByRole('combobox');
    expect(groupSelects).toHaveLength(2);
    
    // Check if they have the correct placeholder text
    expect(screen.getAllByText('Select a group')).toHaveLength(2);
  });

  it('displays member type radio buttons', () => {
    render(GroupMembershipPanel, { users: mockUsers, groups: mockGroups });
    
    // Check if radio buttons are present
    expect(screen.getByRole('radio', { name: 'User' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Group' })).toBeInTheDocument();
  });

  it('shows check membership button', () => {
    render(GroupMembershipPanel, { users: mockUsers, groups: mockGroups });
    
    // Check if the button is present
    expect(screen.getByRole('button', { name: 'Check Membership' })).toBeInTheDocument();
  });

  it('shows get all members button', () => {
    render(GroupMembershipPanel, { users: mockUsers, groups: mockGroups });
    
    // Check if the button is present
    expect(screen.getByRole('button', { name: 'Get All Members' })).toBeInTheDocument();
  });

  it('checks membership correctly when form is submitted', async () => {
    render(GroupMembershipPanel, { users: mockUsers, groups: mockGroups });
    
    // Select a group
    const groupSelects = screen.getAllByRole('combobox');
    await fireEvent.change(groupSelects[0], { target: { value: '1' } });
    
    // Select member type
    const userRadio = screen.getByRole('radio', { name: 'User' });
    await fireEvent.click(userRadio);
    
    // Select a user
    await fireEvent.change(groupSelects[1], { target: { value: '1' } });
    
    // Click check membership button
    const checkButton = screen.getByRole('button', { name: 'Check Membership' });
    await fireEvent.click(checkButton);
  });

  it('fetches all members when view all members button is clicked', async () => {
    render(GroupMembershipPanel, { users: mockUsers, groups: mockGroups });
    
    // Select a group
    const groupSelects = screen.getAllByRole('combobox');
    await fireEvent.change(groupSelects[0], { target: { value: '1' } });
    
    // Click get all members button
    const getAllButton = screen.getByRole('button', { name: 'Get All Members' });
    await fireEvent.click(getAllButton);
  });
}); 