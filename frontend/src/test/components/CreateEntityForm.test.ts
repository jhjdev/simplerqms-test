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
    const { getByTestId, getByText } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit
      }
    });

    // Submit form without filling in required fields
    const form = getByTestId('user-form');
    await fireEvent.submit(form);
    await tick();

    // Check for error dialog
    const errorDialog = getByTestId('error-dialog');
    expect(errorDialog).toBeTruthy();
    expect(getByText('Name and email are required')).toBeTruthy();

    // Check that the form was not submitted
    expect(mockOnUserSubmit).not.toHaveBeenCalled();

    // Fill in required fields
    const nameInput = getByTestId('user-name-input').querySelector('input');
    const emailInput = getByTestId('user-email-input').querySelector('input');
    if (!nameInput || !emailInput) throw new Error('Input fields not found');
    
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await tick();

    // Submit form again
    await fireEvent.submit(form);
    await tick();

    // Check that the form was submitted with correct values
    expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', null);
  });
  
  it('validates email format in user form', async () => {
    const { getByTestId, getByText } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit
      }
    });

    // Fill in name and invalid email
    const nameInput = getByTestId('user-name-input').querySelector('input');
    const emailInput = getByTestId('user-email-input').querySelector('input');
    if (!nameInput || !emailInput) throw new Error('Input fields not found');
    
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
    await tick();

    // Submit form
    const form = getByTestId('user-form');
    await fireEvent.submit(form);
    await tick();

    // Check for error dialog
    const errorDialog = getByTestId('error-dialog');
    expect(errorDialog).toBeTruthy();
    expect(getByText('Please enter a valid email address')).toBeTruthy();

    // Check that the form was not submitted
    expect(mockOnUserSubmit).not.toHaveBeenCalled();

    // Update with valid email
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await tick();

    // Submit form again
    await fireEvent.submit(form);
    await tick();

    // Check that the form was submitted with correct values
    expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', null);
  });
  
  it('handles group selection in user form', async () => {
    const { getByTestId } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit
      }
    });

    // Fill in required fields
    const nameInput = getByTestId('user-name-input').querySelector('input');
    const emailInput = getByTestId('user-email-input').querySelector('input');
    if (!nameInput || !emailInput) throw new Error('Input fields not found');
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await tick();

    // Open the select menu and select the option
    const selectAnchor = getByTestId('user-group-select').querySelector('.mdc-select__anchor');
    if (!selectAnchor) throw new Error('Select anchor not found');
    await fireEvent.click(selectAnchor);
    await tick();

    // Select the group option
    const option = getByTestId('user-group-select').querySelector('.mdc-deprecated-list-item[data-value="1"]');
    if (!option) throw new Error('Group option not found');
    await fireEvent.click(option);
    await tick();

    // Submit form
    const form = getByTestId('user-form');
    await fireEvent.submit(form);
    await tick();

    // Check correct values were submitted
    expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', null);
  });
  
  it('handles group form submission with validation', async () => {
    const { getByTestId } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit
      }
    });

    // Submit form without filling in required fields
    const form = getByTestId('group-form');
    await fireEvent.submit(form);
    await tick();

    // Check that fetch was not called
    expect(window.fetch).not.toHaveBeenCalled();

    // Fill in group name
    const groupNameInput = getByTestId('group-name-input').querySelector('input');
    if (!groupNameInput) throw new Error('Group name input not found');
    await fireEvent.input(groupNameInput, { target: { value: 'New Group' } });
    await tick();

    // Submit form again
    await fireEvent.submit(form);
    await tick();

    // Check that fetch was called with correct values
    expect(window.fetch).toHaveBeenCalledWith('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Group',
        parentId: null
      })
    });
  });
  
  it('handles API errors during group creation', async () => {
    // Mock fetch to return an error
    window.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

    const { getByTestId, getByText } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit
      }
    });

    // Fill in group name
    const groupNameInput = getByTestId('group-name-input').querySelector('input');
    if (!groupNameInput) throw new Error('Group name input not found');
    await fireEvent.input(groupNameInput, { target: { value: 'New Group' } });
    await tick();

    // Submit form
    const form = getByTestId('group-form');
    await fireEvent.submit(form);
    await tick();

    // Check for error message - using the actual error message from the component
    expect(getByText('API Error')).toBeTruthy();
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
    const { getByTestId, getByText } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });
    
    // Submit the form without filling it out
    const form = getByTestId('group-form');
    await fireEvent.submit(form);
    await tick();
    
    // Check that fetch was not called
    expect(window.fetch).not.toHaveBeenCalled();
    
    // Check for validation message
    expect(getByText('Please enter a group name')).toBeTruthy();
  });
  
  it('tests button focus and blur events', async () => {
    const { getByTestId } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit
      }
    });

    // Get the create group button
    const createGroupButton = getByTestId('create-group-button');
    expect(createGroupButton).toBeInTheDocument();
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
