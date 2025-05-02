import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GroupMembershipPanel from './GroupMembershipPanel.svelte';

// Define proper types for the mock fetch
type MockResponse = {
  isMember?: boolean;
  users?: Array<{id: number | string, name: string, type: string}>;
  groups?: Array<{id: number | string, name: string, type: string}>;
} | Array<{id: number | string, name: string, type: string}>; // Allow array format for all-members response

// Mock fetch responses
const mockFetch = (mockResponse: MockResponse) => {
  // Use window.fetch instead of global.fetch
  window.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });
};

describe('GroupMembershipPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the component correctly', () => {
    render(GroupMembershipPanel);
    
    expect(screen.getByText('Group Membership Tools')).toBeInTheDocument();
    expect(screen.getByText('Check Membership')).toBeInTheDocument();
    expect(screen.getByText('View All Members')).toBeInTheDocument();
  });

  it('checks membership correctly when form is submitted', async () => {
    // Mock the fetch response for membership check
    mockFetch({ isMember: true });
    
    render(GroupMembershipPanel);
    
    // Select a group
    const groupSelect = screen.getByLabelText('Select Group');
    fireEvent.change(groupSelect, { target: { value: '1' } });
    
    // Select a member type
    const memberTypeSelect = screen.getByLabelText('Member Type');
    fireEvent.change(memberTypeSelect, { target: { value: 'user' } });
    
    // Select a member
    const memberSelect = screen.getByLabelText('Select Member');
    fireEvent.change(memberSelect, { target: { value: '2' } });
    
    // Submit the form
    const checkButton = screen.getByText('Check Membership');
    fireEvent.click(checkButton);
    
    // Wait for the fetch to complete and verify the success message
    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        '/api/groups/1/check-membership',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ memberId: '2', memberType: 'user' }),
        })
      );
    });
  });

  it('fetches all members when view all members button is clicked', async () => {
    // Mock the fetch response for all members
    mockFetch([
      { id: 1, name: 'User 1', type: 'user' },
      { id: 2, name: 'Group 2', type: 'group' },
    ]);
    
    render(GroupMembershipPanel);
    
    // Select a group
    const groupSelect = screen.getByLabelText('Select Group');
    fireEvent.change(groupSelect, { target: { value: '1' } });
    
    // Click the view all members button
    const viewButton = screen.getByText('View All Members');
    fireEvent.click(viewButton);
    
    // Wait for the fetch to complete
    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith('/api/groups/1/all-members');
    });
  });
});