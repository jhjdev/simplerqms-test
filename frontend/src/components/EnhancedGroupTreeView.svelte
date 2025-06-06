<script lang="ts">
  import type { Group, User } from '../types';
  import { createEventDispatcher, onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import TreeNode from './TreeNode.svelte';
  import '../styles/components/EnhancedGroupTreeView.css';

  export let groups: Group[];
  export let users: User[] = [];

  const dispatch = createEventDispatcher<{
    groupUpdated: void;
    groupDeleted: Group;
    userEdit: { userId: string; name: string; email: string; groupId: string | null };
  }>();

  let editingGroupId: string | null = null;
  let editingGroupName: string = '';
  let searchTerm: string = '';
  let expandedGroups: Set<string> = new Set();
  let filteredGroups: Group[] = [];
  let isLoading: boolean = false;
  let showMemberCount: boolean = true;

  // User editing state
  let editingUserId: string | null = null;
  let editingUserName: string = '';
  let editingUserEmail: string = '';
  let editingUserGroupId: string | null = null;

  // Function to count all members (users and groups) within a group hierarchy
  function countAllMembers(groupId: string): number {
    const group = groups.find(g => g.id === groupId);
    if (!group) return 0;

    let totalMembers = 0;
    
    // Count direct users
    if (group.users) {
      totalMembers += group.users.length;
    }
    
    // Count child groups and their members
    if (group.children) {
      for (const child of group.children) {
        // Count the child group itself
        totalMembers += 1;
        // Count all members in the child group
        totalMembers += countAllMembers(child.id);
      }
    }
    
    return totalMembers;
  }

  // Filter groups based on search term
  $: {
    if (searchTerm.trim() === '') {
      // Only show root groups (groups without parent_id)
      filteredGroups = groups.filter(g => !g.parent_id);
    } else {
      const term = searchTerm.toLowerCase();
      // Filter groups that match the search term
      filteredGroups = groups.filter(group => {
        // Check if the group name matches
        if (group.name.toLowerCase().includes(term)) return true;
        
        // Check if any user in the group matches
        if (group.users && group.users.some(u => 
          u.name.toLowerCase().includes(term) || 
          u.email.toLowerCase().includes(term)
        )) return true;
        
        // Check if any child group matches
        if (group.children && group.children.some(g => g.name.toLowerCase().includes(term))) return true;
        
        return false;
      });
    }
  }

  // Add a function to check if a group is a valid root group
  function isValidRootGroup(group: Group): boolean {
    return !group.parent_id;
  }

  // Add a function to check if a group should be rendered
  function shouldRenderGroup(group: Group): boolean {
    // For root groups, always render
    if (!group.parent_id) return true;
    
    // For child groups, only render if their parent exists
    return groups.some(g => g.id === group.parent_id);
  }

  function handleEdit(group: Group): void {
    editingGroupId = group.id;
    editingGroupName = group.name;
  }

  function handleCancel(): void {
    editingGroupId = null;
    editingGroupName = '';
  }

  function handleUserEdit(event: CustomEvent<{ userId: string; name: string; email: string; groupId: string | null }>) {
    dispatch('userEdit', event.detail);
  }

  function handleEditUser(user: User): void {
    editingUserId = user.id;
    editingUserName = user.name;
    editingUserEmail = user.email;
    editingUserGroupId = user.group_id || null;
  }

  function handleCancelUserEdit(): void {
    editingUserId = null;
  }

  async function handleSaveUser(user: User): Promise<void> {
    if (editingUserName && editingUserEmail) {
      try {
        dispatch('userEdit', {
          userId: user.id,
          name: editingUserName,
          email: editingUserEmail,
          groupId: editingUserGroupId
        });
        editingUserId = null;
      } catch (error) {
        console.error('Error saving user:', error);
      }
    }
  }

  async function handleSave(group: Group): Promise<void> {
    try {
      isLoading = true;
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
    } finally {
      isLoading = false;
    }
  }

  async function handleDelete(group: Group): Promise<void> {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      return;
    }

    try {
      isLoading = true;
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      dispatch('groupDeleted', group);
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      isLoading = false;
    }
  }

  function toggleExpand(groupId: string) {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupId)) {
      newExpandedGroups.delete(groupId);
    } else {
      newExpandedGroups.add(groupId);
    }
    expandedGroups = newExpandedGroups;
  }

  function toggleMemberCount() {
    showMemberCount = !showMemberCount;
  }

  function expandAll() {
    const newExpandedGroups = new Set<string>();
    groups.forEach(group => {
      newExpandedGroups.add(group.id);
    });
    expandedGroups = newExpandedGroups;
  }

  function collapseAll() {
    expandedGroups = new Set<string>();
  }

  // Initialize with all root groups expanded
  onMount(() => {
    const initialExpandedGroups = new Set<string>();
    groups
      .filter(g => !g.parent_id)
      .forEach(g => initialExpandedGroups.add(g.id));
    expandedGroups = initialExpandedGroups;
  });
</script>

<div class="group-list" class:loading={isLoading}>
  <div class="header">
    <h2>Groups</h2>
    <div class="controls">
      <button class="control-btn" on:click={expandAll}>Expand All</button>
      <button class="control-btn" on:click={collapseAll}>Collapse All</button>
      <button class="control-btn" on:click={toggleMemberCount}>
        {showMemberCount ? 'Hide' : 'Show'} Member Count
      </button>
    </div>
  </div>
  
  <div class="search-container">
    <input 
      type="text" 
      placeholder="Search groups and members..." 
      bind:value={searchTerm}
      class="search-input"
    />
    {#if searchTerm.trim() !== ''}
      <button class="clear-btn" on:click={() => searchTerm = ''}>×</button>
    {/if}
  </div>
  
  <div class="tree-view">
    {#if filteredGroups && filteredGroups.length > 0}
      {#each filteredGroups.filter(isValidRootGroup) as group (group.id)}
        <TreeNode
          group={group}
          editingGroupId={editingGroupId}
          editingGroupName={editingGroupName}
          handleEdit={handleEdit}
          handleSave={handleSave}
          handleDelete={handleDelete}
          handleCancel={handleCancel}
          expandedGroups={expandedGroups}
          toggleExpand={toggleExpand}
          showMemberCount={showMemberCount}
          countAllMembers={countAllMembers}
          groups={groups}
          users={users}
          on:userEdit={handleUserEdit}
        />
      {/each}
    {:else}
      <div class="no-results">No groups found</div>
    {/if}
  </div>
</div>

<style>
  /* Styles moved to EnhancedGroupTreeView.css */
</style>
