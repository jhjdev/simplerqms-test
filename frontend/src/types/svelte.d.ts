/// <reference types="svelte" />
declare module "*.svelte" {
  import type { ComponentType, SvelteComponentTyped } from "svelte";
  
  const component: ComponentType<SvelteComponentTyped>;
  export default component;
}

interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}
