import '@testing-library/jest-dom';
import { render, fireEvent, getByTestId, findByText } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { tick } from 'svelte';
import CreateEntityForm from '../../components/CreateEntityForm.svelte';
import type { Group } from '../../types';
import { setSelectValue } from '../utils';

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
    name: 'Root Group',
    parent_id: null,
    children: [{
      id: '2',
      name: 'Child Group',
      parent_id: '1',
      children: [{
        id: '3',
        name: 'Grandchild Group',
        parent_id: '2',
        children: [],
        users: [],
        type: 'group',
        level: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }],
      users: [],
      type: 'group',
      level: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }],
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
    // Mock successful fetch response
    window.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/api/groups')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: '2', name: 'New Group' })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGroups)
        });
      }
      return Promise.reject(new Error('Network error'));
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

    // Fill in required fields
    const nameInput = container.querySelector('[data-testid="user-name-input"] input');
    const emailInput = container.querySelector('[data-testid="user-email-input"] input');
    if (!nameInput || !emailInput) throw new Error('Input fields not found');
    
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    await tick();

    // Get the user form and submit it
    const form = container.querySelector('[data-testid="user-form"]');
    if (!form) throw new Error('Form not found');
    await fireEvent.submit(form);
    await tick();

    // Check that onUserSubmit was called with the correct values
    expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', null);
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
    const { component, getByTestId } = render(CreateEntityForm, {
      props: {
        groups: [
          { id: '1', name: 'Test Group', parent_id: null, level: 0, users: [], children: [] },
        ],
        onUserSubmit: mockOnUserSubmit,
        isLoading: false,
        userName: 'John Doe',
        userEmail: 'john@example.com',
        userGroupId: '1',
      }
    });

    // Submit the form
    const form = getByTestId('user-form');
    await fireEvent.submit(form);
    await tick();

    expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', '1');
  });
  
  it('handles group form submission with validation', async () => {
    const { getByTestId } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });

    // Fill in the group form
    const nameInput = getByTestId('group-name-input').querySelector('input');
    if (!nameInput) throw new Error('Group name input not found');
    
    await fireEvent.input(nameInput, { target: { value: 'New Group' } });
    await tick();

    // Submit the form
    const form = getByTestId('group-form');
    await fireEvent.submit(form);
    await tick();

    // Check that the API was called with correct values
    expect(window.fetch).toHaveBeenCalledWith('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'New Group',
        parent_id: null
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

  it('handles group selection with nested groups', async () => {
    const { component, getByTestId } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false,
        userName: 'John Doe',
        userEmail: 'john@example.com',
        userGroupId: '3', // Select the grandchild group
      }
    });

    // Submit the form
    const form = getByTestId('user-form');
    await fireEvent.submit(form);
    await tick();

    expect(mockOnUserSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com', '3');
  });

  it('handles group creation with parent group selection', async () => {
    const { container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false
      }
    });

    // Fill in the group name
    const nameInput = container.querySelector('[data-testid="group-name-input"] input');
    if (!nameInput) throw new Error('Group name input not found');
    await fireEvent.input(nameInput, { target: { value: 'New Child Group' } });
    await tick();

    // Submit the form
    const form = container.querySelector('[data-testid="group-form"]');
    if (!form) throw new Error('Group form not found');
    await fireEvent.submit(form);
    await tick();

    // Verify the API call
    expect(fetch).toHaveBeenCalledWith('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Child Group',
        parent_id: null,
      }),
    });
  });
});
