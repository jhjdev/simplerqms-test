import { render, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EnhancedGroupTreeView from '../../components/EnhancedGroupTreeView.svelte';
import type { Group, User } from '../../types';

describe('EnhancedGroupTreeView', () => {
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

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      type: 'user',
      groupId: '1',
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockConfirm = vi.fn();
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = mockConfirm;
    global.fetch = mockFetch.mockImplementation((url, options) => {
      if (url.includes('/api/groups/1') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      if (url.includes('/api/groups/1') && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      return Promise.reject(new Error('Network error'));
    });
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

  it('displays users in groups', async () => {
    const { container } = render(EnhancedGroupTreeView, {
      props: {
        groups: mockGroups,
        users: mockUsers
      }
    });

    // Expand the root group
    const expandButton = container.querySelector('[data-testid="toggle-expand-button"]');
    if (expandButton) {
      await fireEvent.click(expandButton);
    }

    // Wait for the expansion to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check if user is displayed
    const userItem = container.querySelector('.user-item');
    expect(userItem).toBeTruthy();
    expect(userItem?.textContent).toContain('John Doe');
    expect(userItem?.textContent).toContain('john@example.com');
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
      await fireEvent.input(searchInput, { target: { value: 'Test' } });
      expect(container.querySelector('.tree-view')).toBeTruthy();
      expect(container.querySelector('.node-label')).toHaveTextContent('Test Group');
    }
  });

  it('filters users based on search term', async () => {
    const { container } = render(EnhancedGroupTreeView, {
      props: {
        groups: mockGroups,
        users: mockUsers
      }
    });

    // Expand the root group
    const expandButton = container.querySelector('[data-testid="toggle-expand-button"]');
    if (expandButton) {
      fireEvent.click(expandButton);
    }

    const searchInput = container.querySelector('.search-input');
    if (searchInput) {
      await fireEvent.input(searchInput, { target: { value: 'John Doe' } });
      expect(container.querySelector('.user-item')).toBeTruthy();
      expect(container.querySelector('.user-name')).toHaveTextContent('John Doe');
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
      // Initially visible
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

    // Mock successful delete response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    });

    const deleteButton = container.querySelector('[data-testid="delete-button"]');
    if (deleteButton) {
      await fireEvent.click(deleteButton);
      expect(mockConfirm).toHaveBeenCalled();
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

    // Mock successful edit response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    });

    const editButton = container.querySelector('[data-testid="edit-button"]');
    if (editButton) {
      await fireEvent.click(editButton);
      expect(container.querySelector('.edit-field')).toBeTruthy();
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
      // Enter search term
      await fireEvent.input(searchInput, { target: { value: 'Test' } });
      expect(searchInput).toHaveValue('Test');

      // Click clear button
      const clearButton = container.querySelector('.clear-btn');
      if (clearButton) {
        await fireEvent.click(clearButton);
        expect(searchInput).toHaveValue('');
      }
    }
  });
}); 