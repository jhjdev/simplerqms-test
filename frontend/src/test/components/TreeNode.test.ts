import { render, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TreeNode from '../../components/TreeNode.svelte';
import type { Group, User } from '../../types';

describe('TreeNode', () => {
  const mockGroup: Group = {
    id: '1',
    name: 'Test Group',
    parent_id: null,
    children: [
      {
        id: '2',
        name: 'Child Group',
        parent_id: '1',
        children: [],
        users: [],
        type: 'group',
        level: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        totalCount: 0
      }
    ],
    users: [
      {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        type: 'user',
        groupId: '1',
        group_id: '1',
        created_at: '2024-01-01T00:00:00Z'
      }
    ],
    type: 'group',
    level: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    totalCount: 1
  };

  const mockHandleEdit = vi.fn();
  const mockHandleSave = vi.fn();
  const mockHandleDelete = vi.fn();
  const mockHandleCancel = vi.fn();
  const mockToggleExpand = vi.fn();
  const mockCountAllMembers = vi.fn().mockReturnValue(1);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders group node correctly', () => {
    const { container, getByText } = render(TreeNode, {
      props: {
        group: mockGroup,
        editingGroupId: null,
        editingGroupName: '',
        handleEdit: mockHandleEdit,
        handleSave: mockHandleSave,
        handleDelete: mockHandleDelete,
        handleCancel: mockHandleCancel,
        expandedGroups: new Set<string>(),
        toggleExpand: mockToggleExpand,
        showMemberCount: true,
        countAllMembers: mockCountAllMembers,
        groups: [mockGroup],
        users: mockGroup.users
      }
    });

    expect(container.querySelector('.tree-node')).toBeTruthy();
    expect(getByText('Test Group (Group)')).toBeTruthy();
    expect(container.querySelector('.member-count')).toHaveTextContent('(1)');
  });

  it('shows edit form when editing group', () => {
    const { container } = render(TreeNode, {
      props: {
        group: mockGroup,
        editingGroupId: '1',
        editingGroupName: 'Test Group',
        handleEdit: mockHandleEdit,
        handleSave: mockHandleSave,
        handleDelete: mockHandleDelete,
        handleCancel: mockHandleCancel,
        expandedGroups: new Set<string>(),
        toggleExpand: mockToggleExpand,
        showMemberCount: true,
        countAllMembers: mockCountAllMembers,
        groups: [mockGroup],
        users: mockGroup.users
      }
    });

    expect(container.querySelector('.edit-field')).toBeTruthy();
    expect(container.querySelector('input')).toHaveValue('Test Group');
  });

  it('calls handleEdit when edit button is clicked', async () => {
    const { getByTestId } = render(TreeNode, {
      props: {
        group: mockGroup,
        editingGroupId: null,
        editingGroupName: '',
        handleEdit: mockHandleEdit,
        handleSave: mockHandleSave,
        handleDelete: mockHandleDelete,
        handleCancel: mockHandleCancel,
        expandedGroups: new Set<string>(),
        toggleExpand: mockToggleExpand,
        showMemberCount: true,
        countAllMembers: mockCountAllMembers,
        groups: [mockGroup],
        users: mockGroup.users
      }
    });

    const editButton = getByTestId('edit-button');
    await fireEvent.click(editButton);
    expect(mockHandleEdit).toHaveBeenCalledWith(mockGroup);
  });

  it('calls handleDelete when delete button is clicked', async () => {
    const { getByTestId } = render(TreeNode, {
      props: {
        group: mockGroup,
        editingGroupId: null,
        editingGroupName: '',
        handleEdit: mockHandleEdit,
        handleSave: mockHandleSave,
        handleDelete: mockHandleDelete,
        handleCancel: mockHandleCancel,
        expandedGroups: new Set<string>(),
        toggleExpand: mockToggleExpand,
        showMemberCount: true,
        countAllMembers: mockCountAllMembers,
        groups: [mockGroup],
        users: mockGroup.users
      }
    });

    const deleteButton = getByTestId('delete-button');
    await fireEvent.click(deleteButton);
    expect(mockHandleDelete).toHaveBeenCalledWith(mockGroup);
  });

  it('toggles expansion when expand button is clicked', async () => {
    const { getByTestId } = render(TreeNode, {
      props: {
        group: mockGroup,
        editingGroupId: null,
        editingGroupName: '',
        handleEdit: mockHandleEdit,
        handleSave: mockHandleSave,
        handleDelete: mockHandleDelete,
        handleCancel: mockHandleCancel,
        expandedGroups: new Set<string>(),
        toggleExpand: mockToggleExpand,
        showMemberCount: true,
        countAllMembers: mockCountAllMembers,
        groups: [mockGroup],
        users: mockGroup.users
      }
    });

    const expandButton = getByTestId('toggle-expand-button');
    await fireEvent.click(expandButton);
    expect(mockToggleExpand).toHaveBeenCalledWith(mockGroup.id);
  });

  it('renders child groups when expanded', () => {
    const { container, getByText } = render(TreeNode, {
      props: {
        group: mockGroup,
        editingGroupId: null,
        editingGroupName: '',
        handleEdit: mockHandleEdit,
        handleSave: mockHandleSave,
        handleDelete: mockHandleDelete,
        handleCancel: mockHandleCancel,
        expandedGroups: new Set<string>(['1']),
        toggleExpand: mockToggleExpand,
        showMemberCount: true,
        countAllMembers: mockCountAllMembers,
        groups: [mockGroup],
        users: mockGroup.users
      }
    });

    expect(container.querySelector('.tree-node-children')).toBeTruthy();
    expect(getByText('expand_more')).toBeTruthy();
  });

  it('renders users in the group', () => {
    const { container, getByText } = render(TreeNode, {
      props: {
        group: mockGroup,
        editingGroupId: null,
        editingGroupName: '',
        handleEdit: mockHandleEdit,
        handleSave: mockHandleSave,
        handleDelete: mockHandleDelete,
        handleCancel: mockHandleCancel,
        expandedGroups: new Set<string>(['1']),
        toggleExpand: mockToggleExpand,
        showMemberCount: true,
        countAllMembers: mockCountAllMembers,
        groups: [mockGroup],
        users: mockGroup.users
      }
    });

    expect(container.querySelector('.tree-node-children')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('(test@example.com)')).toBeTruthy();
  });
}); 