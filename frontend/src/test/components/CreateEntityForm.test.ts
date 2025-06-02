import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateEntityForm from '../../components/CreateEntityForm.svelte';
import type { Group } from '../../types';
import { tick } from 'svelte';

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
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });

    // Target the user form section more reliably
    const userFormSection = container.querySelectorAll('.form-section')[1]; // Second form section is for users
    const userForm = userFormSection.querySelector('form');
    const nameInput = userFormSection.querySelectorAll('.mdc-text-field__input')[0];
    const emailInput = userFormSection.querySelectorAll('.mdc-text-field__input')[1];
    
    if (!nameInput || !emailInput || !userForm) {
      throw new Error('Required form elements not found');
    }

    // Set values for inputs
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Submit the form directly (more reliable than clicking the button)
    await fireEvent.submit(userForm);
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', '');
    });
  });

  it('handles group form submission', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });

    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: '2', name: 'New Group' }) });

    const groupNameInput = container.querySelector('.form-section:first-child .mdc-text-field__input') as HTMLInputElement;
    const submitButton = container.querySelector('.form-section:first-child .mdc-button');

    if (!groupNameInput || !submitButton) {
      throw new Error('Required form elements not found');
    }

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
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: true
      }
    });

    const submitButtons = container.querySelectorAll('.mdc-button');
    submitButtons.forEach(button => {
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent(/Creating/);
    });
  });

  it('displays error message in dialog', async () => {
    // Mock onUserSubmit to reject with an error
    const mockErrorUserSubmit = vi.fn().mockRejectedValue(new Error('Invalid input'));
    
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockErrorUserSubmit,
        isLoading: false
      }
    });
    
    // Target the user form section more reliably
    const userFormSection = container.querySelectorAll('.form-section')[1]; // Second form section is for users
    const userForm = userFormSection.querySelector('form');
    const nameInput = userFormSection.querySelectorAll('.mdc-text-field__input')[0];
    const emailInput = userFormSection.querySelectorAll('.mdc-text-field__input')[1];
    
    if (!nameInput || !emailInput || !userForm) {
      throw new Error('Required form elements not found');
    }
    
    // Set values for inputs
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Submit the form
    await fireEvent.submit(userForm);
    
    // Wait for the error dialog to appear
    await waitFor(() => {
      const errorDialog = container.querySelector('.error-dialog');
      expect(errorDialog).toBeTruthy();
      expect(errorDialog?.textContent).toContain('Invalid input');
    }, { timeout: 3000 });
  });

  it('displays success message in dialog and clears form after successful submission', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });

    // Target the user form section more reliably
    const userFormSection = container.querySelectorAll('.form-section')[1]; // Second form section is for users
    const userForm = userFormSection.querySelector('form');
    const nameInput = userFormSection.querySelectorAll('.mdc-text-field__input')[0];
    const emailInput = userFormSection.querySelectorAll('.mdc-text-field__input')[1];
    
    if (!nameInput || !emailInput || !userForm) {
      throw new Error('Required form elements not found');
    }
    
    // Set values for inputs
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Submit the form
    await fireEvent.submit(userForm);
    
    // Wait for the submit function to be called and success dialog to appear
    await waitFor(() => {
      expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', '');
      const successDialog = container.querySelector('.success-dialog');
      expect(successDialog).toBeTruthy();
      expect(successDialog?.textContent).toContain('User created successfully');
    }, { timeout: 3000 });
    
    // Run timers to auto-close success dialog
    vi.runAllTimers();
    
    // Verify form was cleared - inputs should be empty
    await waitFor(() => {
      const nameInputAfter = userFormSection.querySelectorAll('.mdc-text-field__input')[0] as HTMLInputElement;
      expect(nameInputAfter.value).toBe('');
    });
  });

  it('validates group name is required (button disabled)', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });

    const submitButton = container.querySelector('.form-section:first-child .mdc-button');
    if (submitButton) {
      // The button should be disabled if group name is empty
      expect(submitButton).toBeDisabled();
    }
  });
});
