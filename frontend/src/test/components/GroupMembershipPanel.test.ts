import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GroupMembershipPanel from '../../components/GroupMembershipPanel.svelte';
import type { User, Group } from '../../types';

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

  // Mock fetch API for API calls
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          isMember: true,
          path: ['Group 1', 'Group 2']
        })
      })
    );
  });

  it('renders the panel with correct sections', () => {
    const { getByRole, getByText, getByTestId, getAllByRole } = render(GroupMembershipPanel, { 
      props: { users: mockUsers, groups: mockGroups },
      target: document.createElement('div')
    });
    
    // Check if panel headers are present using specific selectors
    const title = getByRole('heading', { name: 'Group Membership Tools' });
    expect(title).toBeTruthy();
    
    // Check for panel sections using role and name to be specific
    const headings = getAllByRole('heading');
    const checkMembershipHeader = headings.find(h => h.textContent.includes('Check Membership') && h.tagName.toLowerCase() === 'h3');
    expect(checkMembershipHeader).toBeTruthy();
    
    const viewAllMembersHeader = headings.find(h => h.textContent.includes('View All Members') && h.tagName.toLowerCase() === 'h3');
    expect(viewAllMembersHeader).toBeTruthy();
    
    // Verify buttons are rendered using data-testid which is more specific
    const checkMembershipButton = getByTestId('check-membership-button');
    expect(checkMembershipButton).toBeTruthy();
    
    const getAllMembersButton = getByTestId('get-all-members-button');
    expect(getAllMembersButton).toBeTruthy();
  });

  it('displays group selection dropdowns', () => {
    const { getByTestId } = render(GroupMembershipPanel, { 
      props: { users: mockUsers, groups: mockGroups },
      target: document.createElement('div')
    });
    
    // Check if both group selection dropdowns are present using data-testid
    const checkMembershipSelect = getByTestId('check-membership-group-select');
    const allMembersSelect = getByTestId('all-members-group-select');
    
    expect(checkMembershipSelect).toBeTruthy();
    expect(allMembersSelect).toBeTruthy();
    
    // Use getAttribute to verify the right type of element
    expect(checkMembershipSelect.tagName.toLowerCase()).toBe('select');
    expect(allMembersSelect.tagName.toLowerCase()).toBe('select');
  });

  it('displays member type radio buttons', () => {
    const { getByLabelText, getByText } = render(GroupMembershipPanel, { 
      props: { users: mockUsers, groups: mockGroups },
      target: document.createElement('div')
    });
    
    // Check if radio buttons are present using aria-label
    const userRadio = getByLabelText('User');
    const groupRadio = getByLabelText('Group');
    
    expect(userRadio).toBeTruthy();
    expect(groupRadio).toBeTruthy();
    
    // Verify the radio values
    expect(userRadio.getAttribute('value')).toBe('user');
    expect(groupRadio.getAttribute('value')).toBe('group');
    
    // Check the text is rendered
    expect(getByText('User')).toBeTruthy();
    expect(getByText('Group')).toBeTruthy();
  });

  it('shows check membership button', () => {
    const { getByTestId } = render(GroupMembershipPanel, { 
      props: { users: mockUsers, groups: mockGroups },
      target: document.createElement('div')
    });
    
    // Check if the button is present using data-testid
    const checkButton = getByTestId('check-membership-button');
    expect(checkButton).toBeTruthy();
    expect(checkButton.textContent.trim()).toBe('Check Membership');
  });

  it('shows get all members button', () => {
    const { getByTestId } = render(GroupMembershipPanel, { 
      props: { users: mockUsers, groups: mockGroups },
      target: document.createElement('div')
    });
    
    // Check if the button is present using data-testid
    const getAllButton = getByTestId('get-all-members-button');
    expect(getAllButton).toBeTruthy();
    expect(getAllButton.textContent.trim()).toBe('Get All Members');
  });

  it('checks membership correctly when form is submitted', async () => {
    const { getByTestId, getByLabelText } = render(GroupMembershipPanel, { 
      props: { users: mockUsers, groups: mockGroups },
      target: document.createElement('div')
    });
    
    // Select a group using data-testid
    const groupSelect = getByTestId('check-membership-group-select');
    expect(groupSelect).toBeTruthy();
    
    // Select member type
    const userRadio = getByLabelText('User');
    expect(userRadio).toBeTruthy();
    
    // Set group selection
    await fireEvent.change(groupSelect, { target: { value: '1' } });
    
    // Select user type
    await fireEvent.click(userRadio);
    
    // Get member select element
    const memberSelect = getByTestId('check-membership-member-select');
    expect(memberSelect).toBeTruthy();
    
    // Set member selection
    await fireEvent.change(memberSelect, { target: { value: '1' } });
    
    // Find and click check button
    const checkButton = getByTestId('check-membership-button');
    expect(checkButton).toBeTruthy();
    
    await fireEvent.click(checkButton);
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/groups/1/check-membership',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          memberId: '1',
          memberType: 'user'
        })
      })
    );
  });

  it('fetches all members when view all members button is clicked', async () => {
    const { getByTestId } = render(GroupMembershipPanel, { 
      props: { users: mockUsers, groups: mockGroups },
      target: document.createElement('div')
    });
    
    // Select a group using data-testid
    const groupSelect = getByTestId('all-members-group-select');
    expect(groupSelect).toBeTruthy();
    
    // Set group selection
    await fireEvent.change(groupSelect, { target: { value: '1' } });
    
    // Find and click get all members button
    const getAllButton = getByTestId('get-all-members-button');
    expect(getAllButton).toBeTruthy();
    
    await fireEvent.click(getAllButton);
    
    // Verify fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith('/api/groups/1/all-members');
  });
}); 
