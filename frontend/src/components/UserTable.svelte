<script lang="ts">
  import type { User, Group } from '../types';
  import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
  import Button from '@smui/button';
  import Select, { Option } from '@smui/select';
  import IconButton from '@smui/icon-button';
  import TextField from '@smui/textfield';
  import { createEventDispatcher } from 'svelte';
  import '../styles/components/UserTable.css';
  import type { SvelteComponentTyped } from 'svelte';

  export let users: User[] = [];
  export let groups: Group[] = [];

  // Sorting state
  let sortField: 'name' | 'email' | 'created_at' = 'name';
  let sortDirection: 'asc' | 'desc' = 'asc';

  // Sort users based on current sort field and direction
  $: sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortField === 'created_at') {
      const aDate = new Date(aValue || '').getTime();
      const bDate = new Date(bValue || '').getTime();
      return sortDirection === 'asc' ? bDate - aDate : aDate - bDate;
    }
    
    const comparison = String(aValue).localeCompare(String(bValue));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  function handleSort(field: 'name' | 'email' | 'created_at') {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'desc';
    }
  }

  const dispatch = createEventDispatcher<{
    userEdit: { userId: string; name: string; email: string; groupId: string | null };
    userDelete: { userId: string };
    userUpdate: { user: User };
  }>();

  let editingUserId: string | null = null;
  let editName = '';
  let editEmail = '';
  let editGroupId: string | null = null;

  $: console.log('State changed:', { editingUserId, editName, editEmail, editGroupId });

  // Get user's current group
  function getUserGroup(userId: string): Group | null {
    const user = users.find(u => u.id === userId);
    if (!user || !user.group_id) return null;
    return groups.find(g => g.id === user.group_id) || null;
  }

  $: currentGroup = editingUserId ? getUserGroup(editingUserId) : null;

  function handleEdit(user: User): void {
    console.log('Starting edit for user:', user);
    editingUserId = user.id;
    editName = user.name;
    editEmail = user.email;
    editGroupId = user.group_id || null;
    console.log('Edit form initialized with:', { editName, editEmail, editGroupId });
  }

  async function handleSave(user: User) {
    try {
      console.log('Saving user:', { editName, editEmail, editGroupId });
      
      // Update user details
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          type: user.type,
          group_id: editGroupId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      
      // Dispatch events before updating state
      dispatch('userEdit', { 
        userId: user.id, 
        name: editName, 
        email: editEmail, 
        groupId: editGroupId 
      });
      
      dispatch('userUpdate', { user: updatedUser });

      // Update local state after events are dispatched
      users = users.map(u => u.id === user.id ? { ...u, ...updatedUser } : u);
      
      // Reset edit state last
      editingUserId = null;
      editName = '';
      editEmail = '';
      editGroupId = null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  let showDeleteDialog = false;
  let userToDelete: User | null = null;

  function handleDelete(user: User) {
    userToDelete = user;
    showDeleteDialog = true;
  }

  async function confirmDelete() {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      dispatch('userDelete', { userId: userToDelete.id });
      showDeleteDialog = false;
      userToDelete = null;
    } catch (error) {
      console.error('Error deleting user:', error);
      showDeleteDialog = false;
      userToDelete = null;
    }
  }

  function cancelDelete() {
    showDeleteDialog = false;
    userToDelete = null;
  }

  function handleCancel(): void {
    editingUserId = null;
  }
</script>

<div class="user-list">
  <div class="user-table-container">
    <h2>Users</h2>
    {#if users.length === 0}
      <p>No users found. Create your first user above!</p>
    {:else}
      <div class="table-section">
        <DataTable class="user-table">
          <Head>
            <Row>
              <Cell class="sortable" on:click={() => handleSort('name')}>
                Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </Cell>
              <Cell class="sortable" on:click={() => handleSort('email')}>
                Email {sortField === 'email' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </Cell>
              <Cell>Group</Cell>
              <Cell class="sortable" on:click={() => handleSort('created_at')}>
                Created {sortField === 'created_at' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </Cell>
              <Cell class="actions-header">Actions</Cell>
            </Row>
          </Head>
          <Body>
            {#each sortedUsers as user}
              <Row>
                <Cell>
                  {#if editingUserId === user.id}
                    <div class="edit-form">
                      <input
                        type="text"
                        bind:value={editName}
                        placeholder="Name"
                        class="edit-input"
                      />
                      <input
                        type="email"
                        bind:value={editEmail}
                        placeholder="Email"
                        class="edit-input"
                      />
                      <select
                        bind:value={editGroupId}
                        class="edit-input"
                      >
                        <option value={null}>No Group</option>
                        {#each groups as group}
                          <option value={group.id}>{group.name}</option>
                        {/each}
                      </select>
                    </div>
                  {:else}
                    {user.name}
                  {/if}
                </Cell>
                <Cell>
                  {#if editingUserId === user.id}
                    <input
                      type="email"
                      bind:value={editEmail}
                      class="edit-input"
                      on:keydown|preventDefault={(e) => {
                        if (e.key === 'Enter') handleSave(user);
                      }}
                    />
                  {:else}
                    {user.email}
                  {/if}
                </Cell>
                <Cell>
                  {#if editingUserId === user.id}
                    <select
                      bind:value={editGroupId}
                      class="group-select"
                    >
                      <option value="">None</option>
                      {#each groups as group}
                        <option value={group.id}>{group.name}</option>
                      {/each}
                    </select>
                  {:else}
                    {user.group_name || 'None'}
                  {/if}
                </Cell>
                <Cell>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Cell>
                <Cell class="actions-cell">
                  <div class="actions">
                    {#if editingUserId === user.id}
                      <Button
                        variant="raised"
                        on:click={() => handleSave(user)}
                        class="edit-button mdc-button--raised"
                      >
                        <i class="material-icons">save</i>
                        <span>Save</span>
                      </Button>
                      <Button
                        variant="raised"
                        on:click={handleCancel}
                        class="delete-button mdc-button--raised"
                      >
                        <i class="material-icons">close</i>
                      </Button>
                    {:else}
                      <Button
                        variant="raised"
                        on:click={() => handleEdit(user)}
                        class="edit-button mdc-button--raised"
                      >
                        <i class="material-icons">edit</i>
                      </Button>
                      <Button
                        variant="raised"
                        on:click={() => handleDelete(user)}
                        class="delete-button mdc-button--raised"
                      >
                        <i class="material-icons">delete</i>
                      </Button>
                    {/if}
                  </div>
                </Cell>
              </Row>
            {/each}
          </Body>
        </DataTable>
      </div>
    {/if}
  </div>
</div>

{#if showDeleteDialog}
<div class="dialog-overlay" on:click={cancelDelete} on:keydown={(e) => e.key === 'Escape' && cancelDelete()} tabindex="0" role="dialog" aria-modal="true" data-testid="delete-dialog-overlay">
  <div class="dialog delete-dialog" on:click|stopPropagation on:keydown={() => {}} data-testid="delete-dialog">
    <div class="dialog-header">
      <h3>Confirm Delete</h3>
    </div>
    <div class="dialog-content">
      <p>Are you sure you want to delete {userToDelete?.name}?</p>
    </div>
    <div class="dialog-actions">
      <Button variant="text" on:click={cancelDelete}>Cancel</Button>
      <Button variant="raised" class="danger" on:click={confirmDelete}>Delete</Button>
    </div>
  </div>
</div>
{/if}

<style>
  .sortable {
    cursor: pointer;
    user-select: none;
  }

  .sortable:hover {
    background-color: var(--color-primary-light);
  }
</style>
