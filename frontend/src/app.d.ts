/// <reference types="svelte" />

declare module "*.svelte" {
	const component: import("svelte").SvelteComponent;
	export default component;
}

declare module "*.css" {
	const content: string;
	export default content;
}

export {};
