<script lang="ts">
  import type { Group, User } from '../types';
  import { slide } from 'svelte/transition';
  // @ts-ignore - SMUI imports
  import Textfield from '@smui/textfield';
  // @ts-ignore - SMUI imports
  import IconButton from '@smui/icon-button';
  // @ts-ignore - Type definitions
  import type { SvelteComponentTyped } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import '../styles/components/TreeNode.css';

  export let group: Group;
  export let editingGroupId: string | null;
  export let editingGroupName: string;
  export let handleEdit: (group: Group) => void;
  export let handleSave: (group: Group) => Promise<void>;
  export let handleDelete: (group: Group) => void;
  export let handleCancel: () => void;
  export let expandedGroups: Set<string>;
  export let toggleExpand: (groupId: string) => void;
  export let showMemberCount: boolean;
  export let countAllMembers: (groupId: string) => number;
  export let groups: Group[];
  export let users: User[];

  // User editing state
  let editingUserId: string | null = null;
  let editingUserName: string = '';
  let editingUserEmail: string = '';
  let editingUserGroupId: string | null = null;
  
  const dispatch = createEventDispatcher<{
    userEdit: { userId: string; name: string; email: string; groupId: string | null };
    groupUpdated: void;
  }>();

  // Remove the local isExpanded state and use expandedGroups directly
  $: isExpanded = expandedGroups.has(group.id);

  // Add a computed property to get users in this group
  $: groupUsers = users.filter(user => user.groupId === group.id);
  
  // Combine group.users with users that have this group as their groupId
  $: allGroupUsers = [...(group.users || []), ...groupUsers].filter((user, index, self) => 
    index === self.findIndex(u => u.id === user.id)
  );

  function toggleNodeExpand() {
    toggleExpand(group.id);
  }

  function getChildGroups(group: Group): Group[] {
    return group.children || [];
  }
  
  // Add a check to prevent self-referencing
  function isValidChild(child: Group, parent: Group): boolean {
    return child.id !== parent.id && child.parent_id === parent.id;
  }
  
  // Add a check to prevent duplicate rendering
  function shouldRenderGroup(group: Group): boolean {
    return !group.parent_id || groups.some(g => g.id === group.parent_id);
  }
  
  function handleEditUser(user: User): void {
    editingUserId = user.id;
    editingUserName = user.name;
    editingUserEmail = user.email;
    editingUserGroupId = group.id;
  }
  
  function handleCancelUserEdit(): void {
    editingUserId = null;
  }
  
  function handleUserEdit(event: CustomEvent<{ userId: string; name: string; email: string; groupId: string | null }>) {
    dispatch('userEdit', event.detail);
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

  function handleKeyDown(event: CustomEvent<KeyboardEvent>) {
    if (event.detail.key === 'Enter') {
      handleSave(group).catch(error => {
        console.error('Error saving group:', error);
      });
    }
    if (event.detail.key === 'Escape') handleCancel();
  }
</script>

<div class="tree-node">
  <div class="tree-node-content">
    <IconButton class="material-icons" on:click={toggleNodeExpand} data-testid="toggle-expand-button">
      {isExpanded ? 'expand_more' : 'chevron_right'}
    </IconButton>

    <div class="label-container">
      {#if editingGroupId === group.id}
        <div class="edit-field">
          <Textfield
            bind:value={editingGroupName}
            on:keydown={handleKeyDown}
          />
        </div>
      {:else}
        <span class="node-label">
          <span class="material-icons">folder</span>
          {group.name} (Group)
          {#if showMemberCount}
            <span class="member-count" title="Total members in this group">
              ({group.totalCount})
            </span>
          {/if}
        </span>
      {/if}
    </div>
  </div>
  <div class="tree-node-actions">
    {#if editingGroupId === group.id}
      <IconButton class="material-icons success" on:click={() => handleSave(group)}>
        check
      </IconButton>
      <IconButton class="material-icons danger" on:click={handleCancel}>
        close
      </IconButton>
    {:else}
      <IconButton class="material-icons" on:click={() => handleEdit(group)} data-testid="edit-button">
        edit
      </IconButton>
      <IconButton class="material-icons danger" on:click={() => handleDelete(group)} data-testid="delete-button">
        delete
      </IconButton>
    {/if}
  </div>
</div>

{#if isExpanded}
  <div class="tree-node-children" transition:slide={{ duration: 150, delay: 0 }}>
    {#each getChildGroups(group) as child (child.id)}
      <svelte:self
        group={child}
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
    {#if allGroupUsers.length > 0}
      <div class="user-items-container">
        {#each allGroupUsers as user (user.id)}
          <div class="user-item" transition:slide={{ duration: 150, delay: 0 }}>
            <span class="material-icons">person</span>
            <span class="user-name">{user.name}</span>
            <span class="user-email">({user.email})</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Styles moved to TreeNode.css */
</style>
