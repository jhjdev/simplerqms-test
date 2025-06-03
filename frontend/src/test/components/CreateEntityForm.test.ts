import { render, fireEvent, waitFor, screen, cleanup } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CreateEntityForm from '../../components/CreateEntityForm.svelte';
import type { Group } from '../../types';
import { tick } from 'svelte';

// Mock SMUI components with improved value binding
// Mock CSS import
vi.mock('../../styles/components/CreateEntityForm.css', () => ({}));

// Mock SMUI components using the $$render approach that works with Svelte components
vi.mock('@smui/button', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$render: (_: any, props: any = {}) => {
      const { disabled, 'data-testid': dataTestId } = props;
      const disabledAttr = disabled ? 'disabled' : '';
      const dataTestIdAttr = dataTestId ? `data-testid="${dataTestId}"` : '';
      const content = props.children || props.$$slots?.default?.(props.$$scope) || 'Button';
      return `<button class="mdc-button" ${disabledAttr} ${dataTestIdAttr}>${content}</button>`;
    }
  }))
}));

vi.mock('@smui/textfield', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$render: (_: any, props: any = {}) => {
      const { value, type = 'text', disabled, required, 'data-testid': dataTestId } = props;
      const disabledAttr = disabled ? 'disabled' : '';
      const requiredAttr = required ? 'required' : '';
      const dataTestIdAttr = dataTestId ? `data-testid="${dataTestId}"` : '';
      const typeAttr = `type="${type || 'text'}"`;
      return `<div class="mdc-text-field">
        <input class="mdc-text-field__input" ${typeAttr} ${disabledAttr} ${requiredAttr} ${dataTestIdAttr} value="${value || ''}" />
      </div>`;
    }
  }))
}));

vi.mock('@smui/select', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$render: (_: any, props: any = {}) => {
      const { value, disabled, 'data-testid': dataTestId } = props;
      const disabledAttr = disabled ? 'disabled' : '';
      const dataTestIdAttr = dataTestId ? `data-testid="${dataTestId}"` : '';
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<div class="mdc-select">
        <select class="mdc-select__native-control" ${disabledAttr} ${dataTestIdAttr}>${content}</select>
      </div>`;
    }
  })),
  Option: vi.fn().mockImplementation(() => ({
    $$render: (_: any, props: any = {}) => {
      const { value } = props;
      const content = props.children || '';
      return `<option value="${value || ''}">${content}</option>`;
    }
  }))
}));

vi.mock('@smui/card', () => ({
  default: vi.fn().mockImplementation(() => ({
    $$render: (_: any, props: any = {}) => {
      const { class: className } = props;
      const classAttr = className ? `class="${className}"` : '';
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<div ${classAttr}>${content}</div>`;
    }
  })),
  Content: vi.fn().mockImplementation(() => ({
    $$render: (_: any, props: any = {}) => {
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<div class="mdc-card__content">${content}</div>`;
    }
  })),
  Actions: vi.fn().mockImplementation(() => ({
    $$render: (_: any, props: any = {}) => {
      const content = props.children || props.$$slots?.default?.(props.$$scope) || '';
      return `<div class="mdc-card__actions">${content}</div>`;
    }
  }))
}))

describe('CreateEntityForm', () => {
  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Test Group',
      parent_id: null,
      children: [],
      users: [],
      type: 'group',
      level: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockOnUserSubmit = vi.fn().mockImplementation(async () => {
    // Simulate successful submission
    return Promise.resolve();
  });
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ id: '2', name: 'New Group' })
  });
  
  // Target DOM element that will be shared across tests
  let target: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    
    // Create a fresh target for each test
    target = document.createElement('div');
    document.body.appendChild(target);
    
    // Mock the setTimeout function to execute immediately in tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
    vi.clearAllTimers();
    vi.resetAllMocks();
    
    // Clean up any lingering event listeners
    if (target && target.parentNode) {
      target.parentNode.removeChild(target);
    }
    
    // Additional cleanup
    document.body.innerHTML = '';
    cleanup();
  });

  it('renders both user and group forms', () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      },
      target
    });

    expect(container.querySelector('.mdc-card')).toBeTruthy();
    expect(container.querySelectorAll('.form-section')).toHaveLength(2);
    expect(container.querySelector('h2')).toHaveTextContent('Create a new group');
    expect(container.querySelectorAll('h2')[1]).toHaveTextContent('Create a new user');
  });

  it('handles user form submission', async () => {
    // Create a mock that resolves immediately
    const quickMockOnUserSubmit = vi.fn().mockResolvedValue(undefined);
    
    // Render with our custom success message
    const { getByTestId, component } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: quickMockOnUserSubmit,
        isLoading: false,
        successMessage: 'User created successfully'
      },
      target
    });

    // Get form elements using data-testid
    const userForm = getByTestId('user-form');
    const nameInput = getByTestId('user-name-input');
    const emailInput = getByTestId('user-email-input');
    
    // Set values for inputs
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Submit the form directly
    await fireEvent.submit(userForm);
    
    // Verify the submit function was called with the right values
    expect(quickMockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', '');
    
    // Wait for the dialog to appear
    await waitFor(() => {
      const successDialog = getByTestId('success-dialog');
      expect(successDialog).toBeTruthy();
      expect(successDialog.textContent).toContain('User created successfully');
    }, { timeout: 1000 });
  });

  it('handles group form submission', async () => {
    const { getByTestId } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      },
      target
    });

    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: '2', name: 'New Group' }) });

    // Get form elements using data-testid
    const groupNameInput = getByTestId('group-name-input');
    const submitButton = getByTestId('create-group-button');

    await fireEvent.input(groupNameInput, { target: { value: 'New Group' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Group',
          parentId: null,
        }),
      });
    });
  });

  it('shows loading state', () => {
    const { getByTestId } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: true
      },
      target
    });

    // Check both group and user buttons
    const groupButton = getByTestId('create-group-button');
    const userButton = getByTestId('create-user-button');
    
    expect(groupButton).toBeDisabled();
    expect(userButton).toBeDisabled();
    expect(groupButton).toHaveTextContent(/Creating/);
    expect(userButton).toHaveTextContent(/Creating/);
  });

  it('displays error message in dialog', async () => {
    // Create a mock that rejects immediately
    const mockErrorUserSubmit = vi.fn().mockRejectedValueOnce(new Error('Invalid input'));
    
    // Render with error message prop
    const { getByTestId, component } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockErrorUserSubmit,
        isLoading: false,
        errorMessage: 'Invalid input'
      },
      target
    });
    
    // Get form elements using data-testid
    const userForm = getByTestId('user-form');
    const nameInput = getByTestId('user-name-input');
    const emailInput = getByTestId('user-email-input');
    
    // Set values for inputs
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Submit the form
    await fireEvent.submit(userForm);
    
    // Verify the submit function was called with the right values
    expect(mockErrorUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', '');
    
    // Wait for the dialog to appear
    await waitFor(() => {
      const errorDialog = getByTestId('error-dialog');
      expect(errorDialog).toBeTruthy();
      expect(errorDialog.textContent).toContain('Invalid input');
    }, { timeout: 1000 });
  });

  it('displays success message in dialog and clears form after successful submission', async () => {
    // Create a mock that resolves immediately
    const quickMockOnUserSubmit = vi.fn().mockResolvedValue(undefined);
    
    // Render with our custom success message
    const { getByTestId, component } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: quickMockOnUserSubmit,
        isLoading: false,
        successMessage: 'User created successfully'
      },
      target
    });

    // Get form elements using data-testid
    const userForm = getByTestId('user-form');
    const nameInput = getByTestId('user-name-input');
    const emailInput = getByTestId('user-email-input');
    
    // Set values for inputs
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Submit the form
    await fireEvent.submit(userForm);
    
    // Verify the submit function was called with the right values
    expect(quickMockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', '');
    
    // Wait for the success dialog to appear
    await waitFor(() => {
      const successDialog = getByTestId('success-dialog');
      expect(successDialog).toBeTruthy();
      expect(successDialog.textContent).toContain('User created successfully');
    }, { timeout: 1000 });
    
    // Explicitly trigger the form clearing logic
    component.$set({ successMessage: 'User created successfully', errorMessage: '' });
    
    // Wait for the form to be cleared
    await waitFor(() => {
      // Check that inputs are cleared after successful submission
      expect((nameInput as HTMLInputElement).value).toBe('');
      expect((emailInput as HTMLInputElement).value).toBe('');
    }, { timeout: 1000 });
  });

  it('validates group name is required (button disabled)', async () => {
    const { getByTestId } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      },
      target
    });

    const submitButton = getByTestId('create-group-button');
    
    // The button should be disabled if group name is empty
    expect(submitButton).toBeDisabled();
  });
});
