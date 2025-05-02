<script lang="ts">
  import type { Group, User } from '../types';
  import { createEventDispatcher, onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';
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
  let searchTerm: string = '';
  let expandedGroups: Set<string> = new Set();
  let filteredGroups: Group[] = [];
  let isLoading: boolean = false;
  let showMemberCount: boolean = true;

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
      filteredGroups = [...groups];
    } else {
      const term = searchTerm.toLowerCase();
      // Filter groups that match the search term
      filteredGroups = groups.filter(group => {
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
      {#each filteredGroups.filter(g => !g.parent_id) as group (group.id)}
        <div class="group-item" transition:fade={{ duration: 200 }}>
          <div class="group-header">
            <button 
              class="expand-btn" 
              on:click={() => toggleExpand(group.id)}
              aria-label={expandedGroups.has(group.id) ? 'Collapse group' : 'Expand group'}
            >
              <span class="expand-icon">{expandedGroups.has(group.id) ? '▼' : '▶'}</span>
            </button>
            
            <div class="group-name">
              {#if editingGroupId === group.id}
                <input 
                  type="text" 
                  bind:value={editingGroupName} 
                  on:keydown={(e) => e.key === 'Enter' && handleSave(group)}
                />
                <div class="edit-actions">
                  <button class="save-btn" on:click={() => handleSave(group)}>Save</button>
                  <button class="cancel-btn" on:click={handleCancel}>Cancel</button>
                </div>
              {:else}
                <span class="name">{group.name}</span>
                {#if showMemberCount}
                  <span class="member-count" title="Total members in this group">
                    {countAllMembers(group.id)}
                  </span>
                {/if}
                <div class="actions">
                  <button class="edit-btn" on:click={() => handleEdit(group)}>Edit</button>
                  <button class="delete-btn" on:click={() => handleDelete(group)}>Delete</button>
                </div>
              {/if}
            </div>
          </div>
          
          {#if expandedGroups.has(group.id)}
            <div class="group-children" transition:slide={{ duration: 200 }}>
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
                expandedGroups={expandedGroups}
                toggleExpand={toggleExpand}
                showMemberCount={showMemberCount}
                countAllMembers={countAllMembers}
                on:userEdit={handleUserEdit}
              />
            </div>
          {/if}
        </div>
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
  .group-list {
    position: relative;
    margin-top: 48px;
    margin-bottom: 48px;
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    color: #800020; /* Burgundy red */
    margin: 0;
    font-size: 2rem;
    font-weight: 300;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .controls {
    display: flex;
    gap: 8px;
  }
  
  .control-btn {
    background: #f0f0f0;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .control-btn:hover {
    background: #e0e0e0;
  }
  
  .search-container {
    position: relative;
    margin-bottom: 16px;
  }
  
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .clear-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
  }
  
  .tree-view {
    margin-top: 16px;
  }
  
  .group-item {
    margin-bottom: 8px;
  }
  
  .group-header {
    display: flex;
    align-items: center;
  }
  
  .expand-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    margin-right: 4px;
    color: #555;
  }
  
  .expand-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    text-align: center;
    line-height: 16px;
    font-size: 10px;
  }
  
  .group-name {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 4px;
  }
  
  .name {
    flex: 1;
    font-weight: 500;
  }
  
  .member-count {
    background: #e0e0e0;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 12px;
    margin-left: 8px;
  }
  
  .actions, .edit-actions {
    display: flex;
    gap: 8px;
  }
  
  .edit-btn, .delete-btn, .save-btn, .cancel-btn {
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .edit-btn {
    background: #e0e0e0;
  }
  
  .delete-btn {
    background: #ffebee;
    color: #d32f2f;
  }
  
  .save-btn {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  .cancel-btn {
    background: #e0e0e0;
  }
  
  .group-children {
    margin-left: 24px;
    border-left: 1px dashed #ddd;
    padding-left: 16px;
  }
  
  .no-results {
    padding: 16px;
    text-align: center;
    color: #757575;
    font-style: italic;
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
