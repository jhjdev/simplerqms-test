<script lang="ts">
  import UserTable from "./components/UserTable.svelte";
  import GroupTreeView from "./components/GroupTreeView.svelte";
  import CreateEntityForm from "./components/CreateEntityForm.svelte";
  import GroupMembershipPanel from "./components/GroupMembershipPanel.svelte";
  import Button from '@smui/button';
  import { onMount } from 'svelte';
  import type { User, Group } from './types';

  let users: User[] = [];
  let groups: Group[] = [];
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let currentPage = window.location.pathname === '/about' ? 'about' : 'home';
  
  // Dialog state
  let showSuccessDialog = false;
  let showErrorDialog = false;
  let dialogMessage = '';

  const API_URL = '/api'; // Define API_URL constant

  // Functions for checking group membership and getting all members
  async function checkMembership(groupId: string, memberId: string, memberType: 'user' | 'group') {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/check-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ memberId, memberType })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to check membership: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking membership:', error);
      return { isMember: false, path: [] };
    }
  }
  
  async function getAllMembers(groupId: string) {
    try {
      const response = await fetch(`${API_URL}/groups/${groupId}/all-members`);
      
      if (!response.ok) {
        throw new Error(`Failed to get all members: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting all members:', error);
      return { users: [], groups: [] };
    }
  }

  function navigate(page: string) {
    currentPage = page;
    window.history.pushState({}, '', page === 'home' ? '/' : '/about');
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      currentPage = window.location.pathname === '/about' ? 'about' : 'home';
    });
  }

  // Function to show dialog
  function showDialog(type: 'success' | 'error', message: string) {
    dialogMessage = message;
    if (type === 'success') {
      showSuccessDialog = true;
      // Auto-close success dialog after 3 seconds
      setTimeout(() => {
        showSuccessDialog = false;
      }, 3000);
    } else {
      showErrorDialog = true;
    }
  }

  async function fetchUsers() {
    try {
      isLoading = true;
      errorMessage = '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/users', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      users = data;
    } catch (error) {
      console.error('Error fetching users:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    fetchUsers();
  });

  async function fetchGroups() {
    try {
      isLoading = true;
      errorMessage = '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/groups/hierarchy', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      groups = await response.json();
    } catch (error) {
      console.error('Error fetching groups:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to fetch groups';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  async function handleUserSubmit(name: string, email: string, groupId: string | null) {
    isLoading = true;
    errorMessage = "";
    successMessage = "";

    try {
      // Make sure we're sending all required fields including type
      const userData = { name, email, type: 'user', groupId: groupId || null };
      console.log('Submitting user data:', userData);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to create user');
      }

      successMessage = 'User created successfully!';
      showDialog('success', successMessage);
      await fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error creating user:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  async function handleUserDelete(event: CustomEvent<{ userId: string }>) {
    const { userId } = event.detail;
    isLoading = true;
    errorMessage = "";
    successMessage = "";

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      successMessage = 'User deleted successfully!';
      showDialog('success', successMessage);
      await fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      errorMessage = 'Failed to delete user';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  async function handleUserEdit(event: CustomEvent<{ userId: string; name: string; email: string; groupId: string | null }>) {
    console.log('App component received userEdit event:', event.detail);
    const { userId, name, email, groupId } = event.detail;
    console.log('Extracted user edit details:', { userId, name, email, groupId });
    
    isLoading = true;
    errorMessage = "";
    successMessage = "";

    try {
      console.log(`Making PATCH request to /api/users/${userId}`);
      console.log('Request payload:', { name, email, groupId });
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, groupId }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server returned error:', errorData);
        throw new Error(errorData.error || `Failed to update user (status: ${response.status})`);
      }

      const responseData = await response.json();
      console.log('User update successful, server response:', responseData);
      
      successMessage = 'User updated successfully!';
      showDialog('success', successMessage);
      console.log('Refreshing user list...');
      await fetchUsers(); // Refresh the user list
      console.log('User list refreshed');
    } catch (error) {
      console.error('Error updating user:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      showDialog('error', errorMessage);
    } finally {
      isLoading = false;
    }
  }

  // Fetch data when the component mounts
  fetchUsers();
  fetchGroups();
</script>

<div class="app">
  <header>
    <div class="header-content">
      <h1>Simpler QMS</h1>
      <p class="subtitle">Requirements Management System</p>
    </div>
  </header>

  <nav>
    <ul>
      <li>
        <a 
          href="/" 
          class:active={currentPage === 'home'}
          on:click|preventDefault={() => navigate('home')}
        >
          Home
        </a>
      </li>
      <li>
        <a 
          href="/about" 
          class:active={currentPage === 'about'}
          on:click|preventDefault={() => navigate('about')}
        >
          About
        </a>
      </li>
    </ul>
  </nav>

  <main>
    {#if currentPage === 'home'}
      <div class="main-content" on:click={() => {}} on:keydown={() => {}}>
        <CreateEntityForm
          {groups}
          {isLoading}
          {errorMessage}
          {successMessage}
          onUserSubmit={handleUserSubmit}
          on:groupSubmit={() => fetchGroups()}
        />

        <GroupTreeView {groups} {users} on:userEdit={handleUserEdit} on:groupUpdated={() => fetchGroups()} />

        <UserTable
          {users}
          {groups}
        />
        
        <GroupMembershipPanel
          {users}
          {groups}
        />
      </div>
    {:else}
      <div class="about-content">
        <h2>About Simpler QMS</h2>
        <p>A simple and efficient Quality Management System designed to help organizations manage their requirements effectively.</p>
      </div>
    {/if}
  </main>
</div>

<!-- Custom Success Dialog -->
{#if showSuccessDialog}
  <div class="dialog-overlay" role="dialog" aria-modal="true" on:click={() => showSuccessDialog = false} on:keydown={(e) => e.key === 'Escape' && (showSuccessDialog = false)}>
    <div class="dialog success-dialog" on:click|stopPropagation on:keydown={() => {}}>
      <div class="dialog-header">
        <h3>Success</h3>
      </div>
      <div class="dialog-content" on:click={() => {}} on:keydown={() => {}}>
        {dialogMessage}
      </div>
      <div class="dialog-actions">
        <Button on:click={() => showSuccessDialog = false}>Close</Button>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Error Dialog -->
{#if showErrorDialog}
  <div class="dialog-overlay" role="dialog" aria-modal="true" on:click={() => showErrorDialog = false} on:keydown={(e) => e.key === 'Escape' && (showErrorDialog = false)}>
    <div class="dialog error-dialog" on:click|stopPropagation on:keydown={() => {}}>
      <div class="dialog-header">
        <h3>Error</h3>
      </div>
      <div class="dialog-content" on:click={() => {}} on:keydown={() => {}}>
        {dialogMessage}
    </div>
    <div class="dialog-actions">
      <Button on:click={() => showErrorDialog = false}>Close</Button>
    </div>
  </div>
</div>
{/if}

<style>
  .app {
    min-height: 100vh;
    background-color: #f5f7fa;
  }

  header {
    background-color: white;
    padding: 24px 0;
    margin-bottom: 24px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 500;
    color: #b71c1c;
  }

  .subtitle {
    margin: 8px 0 24px;
    font-size: 1.2rem;
    color: #757575;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  nav {
    background-color: white;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 24px;
  }

  nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    max-width: 1200px;
    margin: 0 auto;
  }

  nav li {
    margin: 0;
  }

  nav a {
    display: block;
    padding: 16px 24px;
    color: #757575;
    text-decoration: none;
    transition: color 0.2s;
  }

  nav a:hover {
    color: #2e7d32;
  }

  nav a.active {
    color: #2e7d32;
    border-bottom: 2px solid #4a148c;
  }

  .about-content {
    background: white;
    border-radius: 8px;
    padding: 24px;
    margin: 0 auto;
    max-width: 1200px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .about-content h2 {
    color: #1976d2;
    margin-bottom: 16px;
  }

  .about-content p {
    color: #757575;
    line-height: 1.6;
  }

  .main-content {
    background: white;
    border-radius: 8px;
    margin: 0 auto;
    max-width: 1200px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .dialog {
    background-color: white;
    border-radius: 4px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
  }
  
  .success-dialog {
    border-left: 4px solid #2e7d32;
  }
  
  .error-dialog {
    border-left: 4px solid #d32f2f;
  }
  
  .dialog-header {
    padding: 16px 24px;
    border-bottom: 1px solid #eee;
  }
  
  .dialog-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 500;
  }
  
  .success-dialog .dialog-header h3 {
    color: #2e7d32;
  }
  
  .error-dialog .dialog-header h3 {
    color: #d32f2f;
  }
  
  .dialog-content {
    padding: 16px 24px;
    flex-grow: 1;
  }
  
  .dialog-actions {
    padding: 8px 16px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid #eee;
  }
</style>
