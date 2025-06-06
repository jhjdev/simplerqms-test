/// <reference types="svelte" />
declare module "*.svelte" {
  import type { ComponentType, SvelteComponentTyped } from "svelte";
  
  const component: ComponentType<SvelteComponentTyped>;
  export default component;
}

interface User {
  id: string;
  name: string;
  email: string;
  type: string;
  groupId?: string;
  group_id?: string;
  group_name?: string;
  created_at?: string;
  updated_at?: string;
}
