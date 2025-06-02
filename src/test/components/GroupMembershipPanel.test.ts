import { render, fireEvent, waitFor } from '@testing-library/svelte';
import GroupMembershipPanel from '../../components/GroupMembershipPanel.svelte';
import type { Group, User } from '../../types';

const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Group 1',
    parent_id: null,
    children: [],
    users: [],
    type: 'group',
    level: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice',
    email: 'alice@example.com',
    group_id: '1',
    type: 'user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockFetch = vi.fn();

describe('GroupMembershipPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.clearAllMocks();
  });

  it('checks membership when form is submitted', async () => {
    const { container, getByRole } = render(GroupMembershipPanel, {
      props: {
        groups: mockGroups,
        users: mockUsers,
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ isMember: true, path: [] }),
    });

    const groupSelect = container.querySelector('select');
    const userRadio = container.querySelector('input[value="user"]');
    const memberSelect = container.querySelectorAll('select')[1];
    const submitButton = getByRole('button', { name: /Check Membership/i });

    if (groupSelect && userRadio && memberSelect && submitButton) {
      await fireEvent.change(groupSelect, { target: { value: '1' } });
      await fireEvent.click(userRadio);
      await fireEvent.change(memberSelect, { target: { value: '1' } });

      expect(submitButton).not.toBeDisabled();

      await fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith(
            '/api/groups/1/check-membership',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                memberId: '1',
                memberType: 'user',
              }),
            }
          );
        },
        { timeout: 2000 }
      );

      await waitFor(
        () => {
          expect(
            container.querySelector('.result-container')
          ).toHaveTextContent('Is a member');
        },
        { timeout: 2000 }
      );
    } else {
      throw new Error('Required form elements not found');
    }
  });

  it('fetches all members when view all members button is clicked', async () => {
    const { container, getByRole } = render(GroupMembershipPanel, {
      props: {
        groups: mockGroups,
        users: mockUsers,
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ users: mockUsers, groups: [] }),
    });

    const groupSelect = container.querySelectorAll('select')[2];
    const submitButton = getByRole('button', { name: /Get All Members/i });

    if (groupSelect && submitButton) {
      await fireEvent.change(groupSelect, { target: { value: '1' } });
      expect(submitButton).not.toBeDisabled();
      await fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith('/api/groups/1/all-members');
        },
        { timeout: 2000 }
      );
    } else {
      throw new Error('Required form elements not found');
    }
  });
});
