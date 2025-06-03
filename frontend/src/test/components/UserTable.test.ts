import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UserTable from '../../components/UserTable.svelte';
import type { User, Group } from '../../types';
import { tick } from 'svelte';

// Mock CSS imports
vi.mock('../../styles/components/UserTable.css', () => ({}));
vi.mock('material-icons/iconfont/material-icons.css', () => ({}));

// Mock SMUI components with proper $$render functions
vi.mock('@smui/data-table', () => ({
  default: {
    $$render: (_: any, props: any = {}) => {
      const { class: className } = props;
      const classAttr = className ? `class="${className}"` : '';
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<div ${classAttr} role="table">${content}</div>`;
    }
  },
  Head: {
    $$render: (_: any, props: any = {}) => {
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<div role="rowgroup" class="mdc-data-table__header-row">${content}</div>`;
    }
  },
  Body: {
    $$render: (_: any, props: any = {}) => {
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<div role="rowgroup" class="mdc-data-table__content">${content}</div>`;
    }
  },
  Row: {
    $$render: (_: any, props: any = {}) => {
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<div role="row" class="mdc-data-table__row">${content}</div>`;
    }
  },
  Cell: {
    $$render: (_: any, props: any = {}) => {
      const { class: className, on_click } = props;
      const classAttr = className ? `class="${className}"` : '';
      const clickable = on_click ? 'onclick="function() {}"' : '';
      const role = props.role || (className?.includes('header') ? 'columnheader' : 'cell');
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<div role="${role}" ${classAttr} ${clickable}>${content}</div>`;
    }
  }
}));

vi.mock('@smui/button', () => ({
  default: {
    $$render: (_: any, props: any = {}) => {
      const { variant, on_click, class: className } = props;
      const variantClass = variant === 'raised' ? 'mdc-button--raised' : '';
      const classAttr = className ? `class="${className} ${variantClass}"` : `class="${variantClass}"`;
      const content = props.children || props.$$slots?.default?.(props.$$scope) || 'Button';
      return `<button ${classAttr} role="button">${content}</button>`;
    }
  }
}));

vi.mock('@smui/icon-button', () => ({
  default: {
    $$render: (_: any, props: any = {}) => {
      const { class: className, on_click } = props;
      const classAttr = className ? `class="${className}"` : '';
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<button ${classAttr} role="button">${content}</button>`;
    }
  }
}));

vi.mock('@smui/select', () => ({
  default: {
    $$render: (_: any, props: any = {}) => {
      const { bind_value, value, class: className } = props;
      const classAttr = className ? `class="${className}"` : '';
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      // Handle two-way binding by setting the value on change
      const onChange = `onchange="this.value = '${value || ''}';"`;
      return `<div ${classAttr} class="mdc-select">
        <select class="mdc-select__native-control" ${onChange} value="${value || ''}">${content}</select>
      </div>`;
    }
  },
  Option: {
    $$render: (_: any, props: any = {}) => {
      const { value } = props;
      const valueAttr = value !== undefined ? `value="${value}"` : '';
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<option ${valueAttr}>${content}</option>`;
    }
  }
}));

describe('UserTable', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      type: 'user',
      groupId: null,
      created_at: '2024-03-20T10:00:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      type: 'user',
      groupId: '1',
      created_at: '2024-03-21T10:00:00Z'
    }
  ];

  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Test Group',
      type: 'group',
      parent_id: null,
      level: 0,
      users: [],
      children: [],
      created_at: '2024-03-20T10:00:00Z',
      updated_at: '2024-03-20T10:00:00Z'
    }
  ];
  
  // Mock event dispatch handlers
  const mockUserEdit = vi.fn();
  const mockUserDelete = vi.fn();
  
  // Target DOM element that will be shared across tests
  let target: HTMLDivElement;
  
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    
    // Create a fresh target for each test
    target = document.createElement('div');
    document.body.appendChild(target);
    
    // Mock confirm method to always return true for tests
    window.confirm = vi.fn(() => true);
    
    // Add table-related ARIA roles to jsdom
    document.body.setAttribute('role', 'document');
  });
  
  afterEach(() => {
    // Clean up
    if (target && target.parentNode) {
      target.parentNode.removeChild(target);
    }
    cleanup();
  });

  it('renders user table with correct data', () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      },
      target
    });
    
    // Check if user names are displayed
    expect(container.textContent).toContain('John Doe');
    expect(container.textContent).toContain('Jane Smith');
    
    // Check if emails are displayed
    expect(container.textContent).toContain('john@example.com');
    expect(container.textContent).toContain('jane@example.com');
    
    // Check if headers are displayed
    expect(container.textContent).toContain('Name');
    expect(container.textContent).toContain('Email');
    expect(container.textContent).toContain('Group');
  });

  it('sorts users by name when clicking name header', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      },
      target
    });
    
    // Find the name header cell and click it
    const headers = container.querySelectorAll('[role="columnheader"]');
    const nameHeader = Array.from(headers).find(header => header.textContent.includes('Name'));
    
    // First click to sort ascending
    await fireEvent.click(nameHeader);
    // Second click to sort descending
    await fireEvent.click(nameHeader);
    
    // Wait for the component to update
    await tick();
    
    // Check that the component contains names in the expected order after sorting
    const html = container.innerHTML;
    // Since we're using string content checking, verify that Jane appears before John in the HTML
    const janeIndex = html.indexOf('Jane Smith');
    const johnIndex = html.indexOf('John Doe');
    expect(janeIndex).toBeLessThan(johnIndex);
  });

  it('sorts users by creation date when clicking created header', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      },
      target
    });
    
    // Find the created date header cell and click it
    const headers = container.querySelectorAll('[role="columnheader"]');
    const createdHeader = Array.from(headers).find(header => header.textContent.includes('Created'));
    
    // Click to sort ascending
    await fireEvent.click(createdHeader);
    
    // Wait for the component to update
    await tick();
    
    // Check that the component contains names in the expected order after sorting
    const html = container.innerHTML;
    // Since we're using string content checking, verify that John appears before Jane in the HTML
    const johnIndex = html.indexOf('John Doe');
    const janeIndex = html.indexOf('Jane Smith');
    expect(johnIndex).toBeLessThan(janeIndex);
  });

  it('displays group name for users in a group', () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      },
      target
    });
    
    // Check if group name is displayed
    expect(container.textContent).toContain('Test Group');
  });

  it('shows edit form when edit button is clicked', async () => {
    const { container } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      },
      target
    });
    
    // Find and click the edit button for the first user
    const buttons = container.querySelectorAll('[role="button"]');
    const editButtons = Array.from(buttons).filter(button => button.textContent.includes('edit'));
    
    // Click the first edit button (for John Doe)
    await fireEvent.click(editButtons[0]);
    
    // Wait for state updates (double tick to ensure all updates are processed)
    await tick();
    await tick(); // Sometimes needs two ticks for all updates
    
    // Check if edit form is visible by looking for input fields with user data
    const nameInput = container.querySelector('input[type="text"]');
    const emailInput = container.querySelector('input[type="email"]');
    const groupSelect = container.querySelector('select');
    
    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(groupSelect).toBeTruthy();
    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
  });
  
  it('dispatches userEdit event when save is clicked', async () => {
    const { container, component } = render(UserTable, {
      props: {
        users: mockUsers,
        groups: mockGroups
      },
      target
    });
    
    // Listen for the userEdit event
    component.$on('userEdit', mockUserEdit);
    
    // Find and click the edit button for the first user
    const buttons = container.querySelectorAll('[role="button"]');
    const editButtons = Array.from(buttons).filter(button => button.textContent.includes('edit'));
    await fireEvent.click(editButtons[0]);
    
    // Wait for the form to appear with multiple ticks
    await tick();
    await tick(); 
    
    // Find the input fields and update them
    const inputs = container.querySelectorAll('input');
    const nameInput = container.querySelector('input[type="text"]');
    const emailInput = container.querySelector('input[type="email"]');
    
    // Update the input values
    await fireEvent.input(nameInput, { target: { value: 'John Updated' } });
    await fireEvent.input(emailInput, { target: { value: 'john.updated@example.com' } });
    
    // Find the group select and update it
    const groupSelect = container.querySelector('select');
    await fireEvent.change(groupSelect, { target: { value: '1' } });
    
    // Wait for value updates to propagate
    await tick();
    
    // Find and click the save button
    const saveButton = Array.from(container.querySelectorAll('[role="button"]'))
      .find(button => button.textContent.includes('save'));
    await fireEvent.click(saveButton);
    
    // Wait for the component to update with multiple ticks
    await tick();
    await tick();
    
    // Check if userEdit event was dispatched with correct data
    expect(mockUserEdit).toHaveBeenCalledWith(expect.objectContaining({
      detail: {
        userId: '1',
        name: 'John Updated',
        email: 'john.updated@example.com',
        groupId: '1'
      }
    }));
  });
}); 
