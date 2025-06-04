import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { tick } from 'svelte';
import CreateEntityForm from '../../components/CreateEntityForm.svelte';
import type { Group } from '../../types';

// Mock CSS import
vi.mock('../../styles/components/CreateEntityForm.css', () => ({}));

// Declare global fetch for TypeScript
declare global {
  interface Window {
    fetch: typeof fetch;
  }
}

describe('CreateEntityForm', () => {
  const mockGroups: Group[] = [{
    id: '1',
    name: 'Test Group',
    parent_id: null,
    children: [],
    users: [],
    type: 'group',
    level: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }];

  const mockOnUserSubmit = vi.fn();
  const mockDispatch = vi.fn().mockImplementation(() => {});
  
  beforeEach(() => {
    vi.clearAllMocks();
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '2', name: 'New Group' })
    });
  });

  it('renders form sections', () => {
    const { container, getByText } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });

    expect(container.querySelector('.form-section')).toBeTruthy();
    expect(getByText('Create a new group')).toBeTruthy();
    expect(getByText('Create a new user')).toBeTruthy();
  });

  it('shows loading state and individual fields are disabled', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: true
      }
    });
    
    // Check if the submit buttons are disabled
    const userSubmitButton = container.querySelector('[data-testid="create-user-button"]');
    const groupSubmitButton = container.querySelector('[data-testid="create-group-button"]');
    expect(userSubmitButton).toHaveAttribute('disabled');
    expect(groupSubmitButton).toHaveAttribute('disabled');
    
    // Check if the input fields are disabled
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      expect(input).toHaveAttribute('disabled');
    });
    
    // Check if the select fields are disabled
    const selects = container.querySelectorAll('.mdc-select__anchor');
    selects.forEach(select => {
      expect(select).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('handles user form submission', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });

    // Get the user form
    const form = container.querySelector('[data-testid="user-form"]');
    if (!form) throw new Error('Form not found');
    await fireEvent.submit(form);

    expect(mockOnUserSubmit).toHaveBeenCalled();
  });
  
  it('handles input field changes', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    // Find the name input field
    const nameInput = container.querySelector('[data-testid="user-name-input"] input');
    const emailInput = container.querySelector('[data-testid="user-email-input"] input');
    if (!nameInput || !emailInput) throw new Error('Input fields not found');
    
    // Simulate user typing
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Submit the form
    const form = container.querySelector('[data-testid="user-form"]');
    if (!form) throw new Error('Form not found');
    await fireEvent.submit(form);
    
    // Check that onUserSubmit was called with the correct values
    expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', null);
  });
  
  it('validates required fields in user form', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    // Try to submit the form without filling in required fields
    const form = container.querySelector('[data-testid="user-form"]');
    if (!form) throw new Error('User form not found');
    
    // Prevent the default form submission
    form.addEventListener('submit', (e) => e.preventDefault());
    await fireEvent.submit(form);
    
    // Check that the form validation prevented submission
    expect(mockOnUserSubmit).not.toHaveBeenCalled();
    
    // Fill in required fields
    const nameInput = container.querySelector('[data-testid="user-name-input"] input');
    const emailInput = container.querySelector('[data-testid="user-email-input"] input');
    if (!nameInput || !emailInput) throw new Error('Input fields not found');
    
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Submit the form again
    await fireEvent.submit(form);
    
    // Now the form should submit
    expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', null);
  });
  
  it('handles group selection in user form', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    // Fill in the form fields
    const nameInput = container.querySelector('[data-testid="user-name-input"] input');
    const emailInput = container.querySelector('[data-testid="user-email-input"] input');
    const groupSelect = container.querySelector('[data-testid="user-group-select"] .mdc-select__anchor');
    
    if (!nameInput || !emailInput || !groupSelect) throw new Error('Form fields not found');
    
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Click the select to open the menu
    await fireEvent.click(groupSelect);
    await tick();
    
    // Select the first group option
    const option = container.querySelector('[data-testid="user-group-select"] .mdc-deprecated-list-item[data-value="1"]');
    if (!option) throw new Error('Group option not found');
    await fireEvent.click(option);
    
    // Wait for the select to update
    await tick();
    await tick(); // Add another tick to ensure all state updates are processed
    
    // Submit the form
    const form = container.querySelector('[data-testid="user-form"]');
    if (!form) throw new Error('User form not found');
    await fireEvent.submit(form);
    
    // Check correct values were submitted
    expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', '1');
  });
  
  it('handles group form submission', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    // Fill in the form fields
    const nameInput = container.querySelector('[data-testid="group-name-input"] input');
    const parentSelect = container.querySelector('[data-testid="parent-group-select"] .mdc-select__anchor');
    
    if (!nameInput || !parentSelect) throw new Error('Form fields not found');
    
    await fireEvent.input(nameInput, { target: { value: 'New Group' } });
    
    // Click the select to open the menu
    await fireEvent.click(parentSelect);
    await tick();
    
    // Select the first group option
    const option = container.querySelector('[data-testid="parent-group-select"] .mdc-deprecated-list-item[data-value="1"]');
    if (!option) throw new Error('Parent group option not found');
    await fireEvent.click(option);
    
    // Wait for the select to update
    await tick();
    await tick(); // Add another tick to ensure all state updates are processed
    
    // Submit the form
    const form = container.querySelector('[data-testid="group-form"]');
    if (!form) throw new Error('Group form not found');
    await fireEvent.submit(form);
    
    // Check that fetch was called with correct values
    expect(window.fetch).toHaveBeenCalledWith('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Group',
        parentId: '1'
      })
    });
  });
  
  it('resets form after successful submission', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    // Find input fields
    const nameInput = container.querySelector('[data-testid="user-name-input"] input');
    const emailInput = container.querySelector('[data-testid="user-email-input"] input');
    
    if (!nameInput || !emailInput) throw new Error('Form fields not found');
    
    // Fill out the form
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Submit the form
    const form = container.querySelector('[data-testid="user-form"]');
    if (!form) throw new Error('Form not found');
    await fireEvent.submit(form);
    
    // Check that fields are reset
    expect(nameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
  });
  
  it('handles network errors when creating a group', async () => {
    // Mock a network error
    window.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    // Find input field
    const groupNameInput = container.querySelector('[data-testid="group-name-input"] input');
    if (!groupNameInput) throw new Error('Group name input not found');
    
    // Fill out the form
    await fireEvent.input(groupNameInput, { target: { value: 'New Group' } });
    
    // Submit the form
    const form = container.querySelector('[data-testid="group-form"]');
    if (!form) throw new Error('Form not found');
    await fireEvent.submit(form);
    
    // Check that error dialog is shown
    const errorDialog = container.querySelector('[data-testid="error-dialog"]');
    expect(errorDialog).toBeTruthy();
  });
  
  it('handles server-side errors when creating a group', async () => {
    // Mock a server error response
    window.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid group name' })
    });
    
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    // Find input field
    const groupNameInput = container.querySelector('[data-testid="group-name-input"] input');
    if (!groupNameInput) throw new Error('Group name input not found');
    
    // Fill out the form
    await fireEvent.input(groupNameInput, { target: { value: 'New Group' } });
    
    // Submit the form
    const form = container.querySelector('[data-testid="group-form"]');
    if (!form) throw new Error('Form not found');
    await fireEvent.submit(form);
    
    // Check that error dialog is shown
    const errorDialog = container.querySelector('[data-testid="error-dialog"]');
    expect(errorDialog).toBeTruthy();
  });
  
  it('handles validation errors in group form', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    // Submit the form without filling it out
    const form = container.querySelector('[data-testid="group-form"]');
    if (!form) throw new Error('Form not found');
    await fireEvent.submit(form);
    
    // Check that fetch was not called
    expect(window.fetch).not.toHaveBeenCalled();
    
    // Check that error dialog is shown
    const errorDialog = container.querySelector('[data-testid="error-dialog"]');
    expect(errorDialog).toBeTruthy();
  });
  
  it('tests button focus and blur events', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    const createGroupButton = container.querySelector('[data-testid="create-group-button"]') as HTMLButtonElement;
    if (!createGroupButton) throw new Error('Create group button not found');
    
    // Focus the button
    createGroupButton.focus();
    await tick();
    
    // Check if the button is focused
    expect(document.activeElement).toBe(createGroupButton);
    
    // Blur the button
    createGroupButton.blur();
    await tick();
    
    // Check if the button is not focused
    expect(document.activeElement).not.toBe(createGroupButton);
  });
  
  it('tests button mouseenter and mouseleave events', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    const createGroupButton = container.querySelector('[data-testid="create-group-button"]');
    if (!createGroupButton) throw new Error('Create group button not found');
    
    await fireEvent.mouseEnter(createGroupButton);
    await fireEvent.mouseLeave(createGroupButton);
    
    // No specific assertions needed, just checking that the events don't throw errors
  });
});
