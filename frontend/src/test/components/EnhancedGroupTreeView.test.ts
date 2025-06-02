import { render, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EnhancedGroupTreeView from '../../components/EnhancedGroupTreeView.svelte';
import type { Group, User } from '../../types';

describe('EnhancedGroupTreeView', () => {
  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Root Group',
      parent_id: null,
      children: [],
      users: [],
      type: 'group',
      level: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Child Group',
      parent_id: '1',
      children: [],
      users: [],
      type: 'group',
      level: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      type: 'user',
      groupId: '1',
      group_id: '1',
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockFetch = vi.fn();
  const mockConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('confirm', mockConfirm);
  });

  it('renders the component with groups', () => {
    const { container } = render(EnhancedGroupTreeView, {
      props: {
        groups: mockGroups,
        users: mockUsers
      }
    });

    expect(container.querySelector('.group-list')).toBeTruthy();
    expect(container.querySelector('h2')).toHaveTextContent('Groups');
    expect(container.querySelector('.search-input')).toBeTruthy();
  });

  it('filters groups based on search term', async () => {
    const { container } = render(EnhancedGroupTreeView, {
      props: {
        groups: mockGroups,
        users: mockUsers
      }
    });

    const searchInput = container.querySelector('.search-input');
    if (searchInput) {
      await fireEvent.input(searchInput, { target: { value: 'Root' } });
      expect(container.querySelector('.tree-view')).toBeTruthy();
      expect(container.querySelector('.node-label')).toHaveTextContent('Root Group');
    }
  });

  it('expands and collapses all groups', async () => {
    const { container } = render(EnhancedGroupTreeView, {
      props: {
        groups: mockGroups,
        users: mockUsers
      }
    });

    const expandAllButton = container.querySelector('.control-btn');
    const collapseAllButton = container.querySelectorAll('.control-btn')[1];

    if (expandAllButton && collapseAllButton) {
      // Initially, only root groups should be expanded
      expect(container.querySelector('.tree-view')).toBeTruthy();

      // Collapse all
      await fireEvent.click(collapseAllButton);
      expect(container.querySelector('.tree-node.expanded')).toBeFalsy();

      // Expand all
      await fireEvent.click(expandAllButton);
      expect(container.querySelector('.tree-node')).toBeTruthy();
    }
  });

  it('toggles member count visibility', async () => {
    const { container } = render(EnhancedGroupTreeView, {
      props: {
        groups: mockGroups,
        users: mockUsers
      }
    });

    const toggleButton = container.querySelectorAll('.control-btn')[2];
    if (toggleButton) {
      // Initially, member count should be visible
      expect(container.querySelector('.member-count')).toBeTruthy();

      // Toggle off
      await fireEvent.click(toggleButton);
      expect(container.querySelector('.member-count')).toBeFalsy();

      // Toggle on
      await fireEvent.click(toggleButton);
      expect(container.querySelector('.member-count')).toBeTruthy();
    }
  });

  it('handles group deletion', async () => {
    const { container } = render(EnhancedGroupTreeView, {
      props: {
        groups: mockGroups,
        users: mockUsers
      }
    });

    // Mock confirm dialog
    mockConfirm.mockReturnValue(true);
    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({ ok: true });

    const deleteButton = container.querySelector('.delete-btn');
    if (deleteButton) {
      await fireEvent.click(deleteButton);
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete the group "Root Group"?');
      expect(mockFetch).toHaveBeenCalledWith('/api/groups/1', {
        method: 'DELETE'
      });
    }
  });

  it('handles group editing', async () => {
    const { container } = render(EnhancedGroupTreeView, {
      props: {
        groups: mockGroups,
        users: mockUsers
      }
    });

    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({ ok: true });

    const editButton = container.querySelector('.edit-btn');
    if (editButton) {
      await fireEvent.click(editButton);
      expect(container.querySelector('.edit-field')).toBeTruthy();
      expect(container.querySelector('input')).toHaveValue('Root Group');
    }
  });

  it('clears search term when clear button is clicked', async () => {
    const { container } = render(EnhancedGroupTreeView, {
      props: {
        groups: mockGroups,
        users: mockUsers
      }
    });

    const searchInput = container.querySelector('.search-input');
    if (searchInput) {
      await fireEvent.input(searchInput, { target: { value: 'Test' } });
      expect(container.querySelector('.clear-btn')).toBeTruthy();

      const clearButton = container.querySelector('.clear-btn');
      if (clearButton) {
        await fireEvent.click(clearButton);
        expect(searchInput).toHaveValue('');
      }
    }
  });
}); 