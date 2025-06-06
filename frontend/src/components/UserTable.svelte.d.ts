import type { User, Group } from '../types';
import type { SvelteComponentTyped } from 'svelte';

export default class UserTable extends SvelteComponentTyped<
  { users: User[]; groups: Group[] },
  { userEdit: CustomEvent<{ userId: string; name: string; email: string; groupId: string | null }>; userDelete: CustomEvent<{ userId: string }> },
  {}
> {} 