import { writable } from 'svelte/store';

export const page = writable({ url: { pathname: '/' } });
export const navigating = writable(null);
export const session = writable(null);
export const updated = writable(false); 