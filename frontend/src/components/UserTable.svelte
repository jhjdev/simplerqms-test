<script lang="ts">
  import type { User, Group } from '../types';
  import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
  import Button from '@smui/button';
  import Select, { Option } from '@smui/select';
  import IconButton from '@smui/icon-button';
  import { createEventDispatcher } from 'svelte';
  import '../styles/components/UserTable.css';

  export let users: User[] = [];
  export let groups: Group[] = [];


  const dispatch = createEventDispatcher<{
    userEdit: { userId: string; name: string; email: string; groupId: string | null };
    userDelete: { userId: string };
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

  function startEdit(user: User): void {
    editingUserId = user.id;
    editName = user.name;
    editEmail = user.email;
    const group = getUserGroup(user.id);
    editGroupId = group ? group.id : null;
  }

  function handleDelete(user: User): void {
    dispatch('userDelete', { userId: user.id });
  }

  function handleSave(user: User): void {
    if (editName && editEmail) {
      dispatch('userEdit', {
        userId: user.id,
        name: editName,
        email: editEmail,
        groupId: editGroupId,
      });
      editingUserId = null;
    }
  }

  function handleCancel(): void {
    editingUserId = null;
  }

  async function saveEditApi(user: User): Promise<void> {
    console.log('Saving user:', { editName, editEmail, editGroupId });
    try {
      // Update user details
      const userResponse = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update user');
      }

      // Update user's group if changed
      const currentGroupId = getUserGroup(user.id)?.id || null;
      if (editGroupId !== currentGroupId) {
        const groupResponse = await fetch(`/api/users/${user.id}/group`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            groupId: editGroupId,
          }),
        });

        if (!groupResponse.ok) {
          throw new Error('Failed to update user group');
        }
      }

      // Dispatch event to update UI
      dispatch('userEdit', {
        userId: user.id,
        name: editName,
        email: editEmail,
        groupId: editGroupId,
      });

      editingUserId = null;
    } catch (error) {
      console.error('Error updating user:', error);
      // Handle error (show notification, etc.)
    }
  }

  async function deleteUser(userId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      dispatch('userDelete', { userId });
      window.location.reload(); // Refresh the page to update the list
    } catch (error) {
      console.error('Error deleting user:', error);
    }
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
              <Cell>Name</Cell>
              <Cell>Email</Cell>
              <Cell>Group</Cell>
              <Cell class="actions-header">Actions</Cell>
            </Row>
          </Head>
          <Body>
            {#each users as user}
              <Row>
                <Cell>
                  {#if editingUserId === user.id}
                    <input
                      type="text"
                      bind:value={editName}
                      class="edit-input"
                      on:keydown|preventDefault={(e) => {
                        if (e.key === 'Enter') saveEditApi(user);
                      }}
                    />
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
                        if (e.key === 'Enter') saveEditApi(user);
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
                      <option value={null}>None</option>
                      {#each groups as group}
                        <option value={group.id}>{group.name}</option>
                      {/each}
                    </select>
                  {:else}
                    {getUserGroup(user.id)?.name || 'None'}
                  {/if}
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
                        on:click={() => startEdit(user)}
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

<style>
  /* Remove all inline styles as they are now in UserTable.css */
</style>
