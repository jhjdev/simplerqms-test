<script lang="ts">
  import { on } from "svelte/events";

  interface User {
    id: number;
    name: string;
    email: string;
  }

  let users: User[] = $state([]);

  async function loadUsers() {
    const response = await fetch("http://localhost:3000/api/users");

    users = await response.json();
  }

  async function addUsers() {
    const response = await fetch("http://localhost:3000/api/users/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
        name: (document.getElementById("name") as HTMLInputElement)?.value || "",
        email: (document.getElementById("email") as HTMLInputElement)?.value || "",
      }),
    });
  }

  loadUsers();
</script>

<main>
  <h1>Home</h1>
  <p>Welcome to the SvelteKit + Fastify + Prisma starter!</p>
    <input id="name" type="text" placeholder="Type something..." />
    <input id="email" type="text" placeholder="Type something..." />
    <button  onclick={addUsers}>Submit</button>  
</main>

<main>
  <h1>Users</h1>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
      </tr>
    </thead>

    <tbody>
      {#each users as user}
        <tr>
          <td>{user.id}</td>
          <td>{user.name}</td>
          <td>{user.email}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<style>
  table {
    border-collapse: collapse;
    border-spacing: 0;
    width: 100%;
    border: 1px solid #ddd;
  }
  tr {
    border-bottom: 1px solid #ddd;
  }

  td,
  th {
    display: table-cell;
    text-align: left;
    padding: 8px;
    vertical-align: top;
  }
</style>
