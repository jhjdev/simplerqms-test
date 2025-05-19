<script lang="ts">
  import { page } from '$app/stores';
  import '../styles/components/Navigation.css';
  let currentPath = window.location.pathname;

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    currentPath = path;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      currentPath = window.location.pathname;
    });
  }
</script>

<nav>
  <ul>
    <li>
      <a 
        href="/" 
        class:active={currentPath === '/' || currentPath === ''}
        on:click|preventDefault={() => navigate('/')}
      >
        Dashboard
      </a>
    </li>
    <li>
      <a 
        href="/users" 
        class:active={currentPath === '/users'}
        on:click|preventDefault={() => navigate('/users')}
      >
        Users
      </a>
    </li>
    <li>
      <a 
        href="/groups" 
        class:active={currentPath === '/groups'}
        on:click|preventDefault={() => navigate('/groups')}
      >
        Groups
      </a>
    </li>
  </ul>
</nav>

<style>
  /* Remove all inline styles as they are now in Navigation.css */
</style>
