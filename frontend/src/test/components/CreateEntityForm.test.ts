import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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

  it('shows loading state and individual fields are disabled', () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: true
      }
    });

    // Check SMUI textfield disabled state
    const textfields = container.querySelectorAll('.mdc-text-field');
    textfields.forEach(textfield => {
      expect(textfield).toHaveClass('mdc-text-field--disabled');
    });
    
    // Check SMUI select disabled state
    const selects = container.querySelectorAll('.mdc-select');
    selects.forEach(select => {
      expect(select).toHaveClass('mdc-select--disabled');
    });
    
    // Check specific fields by testid
    const userNameInput = container.querySelector('[data-testid="user-name-input"]');
    const userEmailInput = container.querySelector('[data-testid="user-email-input"]');
    const groupNameInput = container.querySelector('[data-testid="group-name-input"]');
    const parentGroupSelect = container.querySelector('[data-testid="parent-group-select"]');
    
    expect(userNameInput?.querySelector('.mdc-text-field')).toHaveClass('mdc-text-field--disabled');
    expect(userEmailInput?.querySelector('.mdc-text-field')).toHaveClass('mdc-text-field--disabled');
    expect(groupNameInput?.querySelector('.mdc-text-field')).toHaveClass('mdc-text-field--disabled');
    expect(parentGroupSelect?.querySelector('.mdc-select')).toHaveClass('mdc-select--disabled');
    
    // Check button states
    const createGroupButton = container.querySelector('[data-testid="create-group-button"]');
    const createUserButton = container.querySelector('[data-testid="create-user-button"]');
    
    expect(createGroupButton).toHaveAttribute('disabled');
    expect(createUserButton).toHaveAttribute('disabled');
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
    
    // Try to submit the form with empty fields
    const form = container.querySelector('[data-testid="user-form"]');
    if (!form) throw new Error('Form not found');
    await fireEvent.submit(form);
    
    // Check that the form validation prevented submission
    expect(mockOnUserSubmit).not.toHaveBeenCalled();
    
    // Check required attributes on the actual input elements
    const nameInput = container.querySelector('[data-testid="user-name-input"] input');
    const emailInput = container.querySelector('[data-testid="user-email-input"] input');
    if (!nameInput || !emailInput) throw new Error('Input fields not found');
    expect(nameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('required');
  });
  
  it('handles group selection in user form', async () => {
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
    const groupSelect = container.querySelector('[data-testid="user-group-select"] select');
    if (!nameInput || !emailInput || !groupSelect) throw new Error('Form fields not found');
    
    // Simulate user input
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    
    // Simulate group selection
    await fireEvent.change(groupSelect, { target: { value: '1' } });
    
    // Submit the form
    const form = container.querySelector('[data-testid="user-form"]');
    if (!form) throw new Error('Form not found');
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
    
    // Find input fields
    const groupNameInput = container.querySelector('[data-testid="group-name-input"] input');
    const parentGroupSelect = container.querySelector('[data-testid="parent-group-select"] select');
    if (!groupNameInput || !parentGroupSelect) throw new Error('Form fields not found');
    
    // Simulate user input
    await fireEvent.input(groupNameInput, { target: { value: 'New Group' } });
    await fireEvent.change(parentGroupSelect, { target: { value: '1' } });
    
    // Submit the form
    const form = container.querySelector('[data-testid="group-form"]');
    if (!form) throw new Error('Form not found');
    await fireEvent.submit(form);
    
    // Check that fetch was called with correct data
    expect(window.fetch).toHaveBeenCalledWith('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Group',
        parentId: '1',
      }),
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
    expect(document.activeElement).toBe(createGroupButton);
    
    // Blur the button
    createGroupButton.blur();
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
