import { vi } from 'vitest';
import { create_ssr_component } from 'svelte/internal';

// Helper to create a minimal Svelte component
const createMockComponent = (name: string) => {
  return create_ssr_component(() => '');
};

// Mock SMUI components
vi.mock('@smui/data-table', () => ({
  default: createMockComponent('DataTable'),
  Head: createMockComponent('Head'),
  Body: createMockComponent('Body'),
  Row: createMockComponent('Row'),
  Cell: createMockComponent('Cell')
}));

vi.mock('@smui/button', () => ({
  default: createMockComponent('Button')
}));

vi.mock('@smui/icon-button', () => ({
  default: createMockComponent('IconButton')
}));

vi.mock('@smui/select', () => ({
  default: createMockComponent('Select')
}));

vi.mock('@smui/textfield', () => ({
  default: createMockComponent('TextField')
}));

vi.mock('@smui/card', () => ({
  default: createMockComponent('Card')
}));

vi.mock('@smui/dialog', () => ({
  default: createMockComponent('Dialog')
})); 