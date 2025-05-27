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
    const directUsers = users.filter(u => u.group_id === groupId).length;
    const directGroups = groups.filter(g => g.parent_id === groupId);
    
    let totalMembers = directUsers;
    
    // Recursively count members in child groups
    for (const childGroup of directGroups) {
      totalMembers += 1; // Count the group itself
      totalMembers += countAllMembers(childGroup.id);
    }
    
    return totalMembers;
  }

  // Filter groups based on search term
  $: {
    if (searchTerm.trim() === '') {
      // Only show root groups (groups without parent_id)
      filteredGroups = groups.filter(g => !g.parent_id);
      console.log('Root groups:', filteredGroups.map(g => ({ id: g.id, name: g.name, parent_id: g.parent_id })));
    } else {
      const term = searchTerm.toLowerCase();
      // Filter groups that match the search term
      filteredGroups = groups.filter(group => {
        // Only include root groups in the main view
        if (group.parent_id) return false;
        
        // Check if the group name matches
        if (group.name.toLowerCase().includes(term)) return true;
        
        // Check if any child group matches
        const childGroups = groups.filter(g => g.parent_id === group.id);
        if (childGroups.some(g => g.name.toLowerCase().includes(term))) return true;
        
        // Check if any user in the group matches
        const groupUsers = users.filter(u => u.group_id === group.id);
        return groupUsers.some(u => 
          u.name.toLowerCase().includes(term) || 
          u.email.toLowerCase().includes(term)
        );
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
    editingGroupName = '';  // Reset the name when canceling
  }

  function handleUserEdit(event: CustomEvent<{ userId: string; name: string; email: string; groupId: string | null }>) {
    // Forward the user edit event to the parent component
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
    if (expandedGroups.has(groupId)) {
      expandedGroups.delete(groupId);
    } else {
      expandedGroups.add(groupId);
    }
    expandedGroups = expandedGroups; // Trigger reactivity
  }

  function toggleMemberCount() {
    showMemberCount = !showMemberCount;
  }

  function expandAll() {
    groups.forEach(group => expandedGroups.add(group.id));
    expandedGroups = expandedGroups; // Trigger reactivity
  }

  function collapseAll() {
    expandedGroups.clear();
    expandedGroups = expandedGroups; // Trigger reactivity
  }

  // Initialize with all root groups expanded
  onMount(() => {
    groups
      .filter(g => !g.parent_id)
      .forEach(g => expandedGroups.add(g.id));
    expandedGroups = expandedGroups; // Trigger reactivity
  });
</script>

<div class="group-list" class:loading={isLoading}>
  <div class="header">
    <h1>Groups</h1>
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
    {:else if searchTerm.trim() !== ''}
      <p class="no-results">No groups match your search</p>
    {:else}
      <p class="no-results">No groups found</p>
    {/if}
  </div>
  
  {#if isLoading}
    <div class="loading-overlay" transition:fade={{ duration: 150 }}>
      <div class="spinner"></div>
    </div>
  {/if}
</div>

<style>
  /* Remove all inline styles as they are now in EnhancedGroupTreeView.css */
</style>
