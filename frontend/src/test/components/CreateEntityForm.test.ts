import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CreateEntityForm from '../../components/CreateEntityForm.svelte';
import type { Group } from '../../types';
import { tick } from 'svelte';

// Mock SMUI components with improved value binding
vi.mock('@smui/button', () => ({
  default: (props: any) => {
    const onClick = props.onClick || (() => {});
    return {
      $$slots: { default: () => props.children },
      $$scope: {},
      $$events: { click: onClick },
      disabled: props.disabled || false,
      variant: props.variant || '',
      ...props
    };
  }
}));

vi.mock('@smui/textfield', () => ({
  default: (props: any) => {
    // Create a reactive value binding that works with fireEvent
    const input = document.createElement('input');
    input.value = props.value || '';
    input.type = props.type || 'text';
    input.disabled = props.disabled || false;
    input.required = props.required || false;
    
    if (props['data-testid']) {
      input.setAttribute('data-testid', props['data-testid']);
    }
    
    input.className = 'mdc-text-field__input';
    
    // Handle value binding
    input.addEventListener('input', (event) => {
      if (props.bind && props.bind.value !== undefined) {
        const value = (event.target as HTMLInputElement).value;
        props.bind.value = value;
      }
    });
    
    return {
      $$slots: { default: () => props.children },
      $$scope: {},
      $$events: {},
      input,
      ...props
    };
  }
}));

vi.mock('@smui/select', () => ({
  default: (props: any) => {
    // Create a reactive select element
    const select = document.createElement('select');
    select.value = props.value || '';
    select.disabled = props.disabled || false;
    
    if (props['data-testid']) {
      select.setAttribute('data-testid', props['data-testid']);
    }
    
    select.className = 'mdc-select';
    
    // Handle value binding
    select.addEventListener('change', (event) => {
      if (props.bind && props.bind.value !== undefined) {
        const value = (event.target as HTMLSelectElement).value;
        props.bind.value = value;
      }
    });
    
    return {
      $$slots: { default: () => props.children },
      $$scope: {},
      $$events: {},
      select,
      ...props
    };
  },
  Option: (props: any) => {
    const option = document.createElement('option');
    option.value = props.value || '';
    option.textContent = props.children || '';
    return {
      $$slots: { default: () => props.children },
      $$scope: {},
      $$events: {},
      option,
      ...props
    };
  }
}));

vi.mock('@smui/card', () => ({
  default: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  }),
  Content: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  }),
  Actions: (props: any) => ({
    $$slots: { default: () => props.children },
    $$scope: {},
    $$events: {},
    ...props
  })
}));

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
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    
    // Mock the setTimeout function to execute immediately in tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
    vi.clearAllTimers();
    vi.resetAllMocks();
    
    // Clean up any lingering event listeners
    document.body.innerHTML = '';
  });

  it('renders both user and group forms', () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
    });

    const submitButton = getByTestId('create-group-button');
    
    // The button should be disabled if group name is empty
    expect(submitButton).toBeDisabled();
  });
});
