import { vi } from 'vitest';

// Helper to create a more comprehensive Svelte component mock
// This approach properly handles slots, scope, events, and props
const createMockComponent = (name: string) => ({
  default: {
    render: (props: any) => ({
      $$slots: { default: () => props?.children },
      $$scope: {},
      $$events: {},
      ...props
    })
  }
});

// Helper to create a module with multiple exports (like DataTable, Head, Row, etc.)
const createMockModule = (components: string[]) => {
  const module: Record<string, any> = {};
  
  // Create the default export
  module.default = {
    render: (props: any) => ({
      $$slots: { default: () => props?.children },
      $$scope: {},
      $$events: {},
      ...props
    })
  };
  
  // Create each named export
  components.forEach(name => {
    module[name] = {
      render: (props: any) => ({
        $$slots: { default: () => props?.children },
        $$scope: {},
        $$events: {},
        ...props
      })
    };
  });
  
  return module;
};

// Mock SMUI components
vi.mock('@smui/data-table', () => 
  createMockModule(['DataTable', 'Head', 'Body', 'Row', 'Cell'])
);

vi.mock('@smui/button', () => 
  createMockComponent('Button')
);

vi.mock('@smui/icon-button', () => 
  createMockComponent('IconButton')
);

vi.mock('@smui/select', () => 
  createMockComponent('Select')
);

vi.mock('@smui/textfield', () => 
  createMockComponent('TextField')
);

vi.mock('@smui/card', () => 
  createMockModule(['Card', 'Content', 'Actions', 'Media'])
);

vi.mock('@smui/dialog', () => 
  createMockModule(['Dialog', 'Title', 'Content', 'Actions'])
);

// Additional SMUI components that might be needed
vi.mock('@smui/list', () => 
  createMockModule(['List', 'Item', 'Text'])
);

vi.mock('@smui/checkbox', () => 
  createMockComponent('Checkbox')
);

vi.mock('@smui/radio', () => 
  createMockComponent('Radio')
);

vi.mock('@smui/tab', () => 
  createMockModule(['Tab', 'Label'])
);

vi.mock('@smui/tab-bar', () => 
  createMockComponent('TabBar')
);

vi.mock('@smui/layout-grid', () => 
  createMockModule(['LayoutGrid', 'Cell'])
);
