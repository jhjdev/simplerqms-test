<script lang="ts">
  import type { Group, User } from '../types';
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  // @ts-ignore - TreeNode import
  import TreeNode from './TreeNode.svelte';

  export let groups: Group[];
  export let users: User[] = [];

  const dispatch = createEventDispatcher<{
    groupUpdated: void;
    groupDeleted: Group;
    userEdit: { userId: string; name: string; email: string; groupId: string | null };
  }>();

  let editingGroupId: string | null = null;
  let editingGroupName: string = '';

  function handleEdit(group: Group): void {
    editingGroupId = group.id;
    editingGroupName = group.name;
  }

  function handleCancel(): void {
    editingGroupId = null;
    editingGroupName = '';  // Reset the name when canceling
  }

  function handleUserEdit(event: CustomEvent<{ userId: string; name: string; email: string; groupId: string | null }>) {
    console.log('GroupTreeView received userEdit event:', event.detail);
    // Forward the user edit event to the parent component
    console.log('GroupTreeView forwarding userEdit event to App component');
    dispatch('userEdit', event.detail);
    console.log('GroupTreeView dispatched userEdit event');
  }

  async function handleSave(group: Group): Promise<void> {
    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingGroupName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update group');
      }

      dispatch('groupUpdated');
      editingGroupId = null;
      editingGroupName = '';
    } catch (error) {
      console.error('Error updating group:', error);
    }
  }

  async function handleDelete(group: Group): Promise<void> {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      dispatch('groupDeleted', group);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  }
</script>

<div class="group-list">
  <h2>Groups</h2>
  <div class="tree-view">
    {#if groups && groups.length > 0}
      {#each groups.filter(g => !g.parent_id) as group (group.id)}
        <TreeNode
          group={{
            ...group,
            children: groups.filter(g => g.parent_id === group.id),
            users: users.filter(u => u.group_id === group.id)
          }}
          editingGroupId={editingGroupId}
          editingGroupName={editingGroupName}
          handleEdit={handleEdit}
          handleSave={handleSave}
          handleDelete={handleDelete}
          handleCancel={handleCancel}
          on:userEdit={handleUserEdit}
        />
      {/each}
    {:else}
      <p>No groups found</p>
    {/if}
  </div>
</div>

<style>
  .group-list {
    margin-top: 48px;
    margin-bottom: 48px;
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .tree-view {
    margin-top: 16px;
  }
</style>
