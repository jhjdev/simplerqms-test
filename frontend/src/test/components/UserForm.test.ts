import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UserForm from '../../components/UserForm.svelte';

// Mock CSS import
vi.mock('../../styles/components/UserForm.css', () => ({}));

describe('UserForm', () => {
  const mockOnSubmit = vi.fn();
  const mockGroups = [
    { id: '1', name: 'Group 1', parent_id: null },
    { id: '2', name: 'Group 2', parent_id: null }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    const { getByText, getByTestId } = render(UserForm, {
      props: {
        onSubmit: mockOnSubmit,
        isLoading: false
      }
    });

    // Check if labels are present
    expect(getByText('Full Name:')).toBeTruthy();
    expect(getByText('Email Address:')).toBeTruthy();

    // Check if form fields are present
    const nameInput = getByTestId('name-input').querySelector('input');
    const emailInput = getByTestId('email-input').querySelector('input');
    if (!nameInput || !emailInput) throw new Error('Input not found');
    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(getByTestId('submit-button')).toBeTruthy();
  });

  it('shows loading state correctly', () => {
    const { getByTestId } = render(UserForm, {
      props: {
        onSubmit: mockOnSubmit,
        isLoading: true
      }
    });

    // Check if form fields are disabled
    const nameInput = getByTestId('name-input').querySelector('input');
    const emailInput = getByTestId('email-input').querySelector('input');
    if (!nameInput || !emailInput) throw new Error('Input not found');
    const submitButton = getByTestId('submit-button');

    expect(nameInput).toHaveAttribute('disabled');
    expect(emailInput).toHaveAttribute('disabled');
    expect(submitButton).toHaveAttribute('disabled');
    expect(submitButton).toHaveTextContent('Saving...');
  });

  it('handles form submission', async () => {
    const { getByTestId } = render(UserForm, {
      props: {
        onSubmit: mockOnSubmit,
        isLoading: false
      }
    });

    // Get form fields
    const nameInput = getByTestId('name-input').querySelector('input');
    const emailInput = getByTestId('email-input').querySelector('input');
    if (!nameInput || !emailInput) throw new Error('Input not found');
    const form = getByTestId('user-form');

    // Fill out the form
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });

    // Submit the form
    await fireEvent.submit(form);

    // Check if onSubmit was called with correct data
    expect(mockOnSubmit).toHaveBeenCalledWith('John Doe', 'john@example.com');
  });

  it('handles successful submission', async () => {
    const { getByTestId } = render(UserForm, {
      props: {
        onSubmit: mockOnSubmit,
        isLoading: false,
        successMessage: 'User created successfully'
      }
    });

    // Get form fields
    const nameInput = getByTestId('name-input').querySelector('input');
    const emailInput = getByTestId('email-input').querySelector('input');
    if (!nameInput || !emailInput) throw new Error('Input not found');
    const form = getByTestId('user-form');

    // Fill out the form
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });

    // Submit the form
    await fireEvent.submit(form);

    // Check if form is cleared
    expect(nameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
  });

  it('validates required fields before submission', async () => {
    const { getByTestId } = render(UserForm, {
      props: {
        onSubmit: mockOnSubmit,
        isLoading: false
      }
    });

    // Get form fields
    const nameInput = getByTestId('name-input').querySelector('input');
    const emailInput = getByTestId('email-input').querySelector('input');
    if (!nameInput || !emailInput) throw new Error('Input not found');
    const form = getByTestId('user-form');

    // Try to submit without filling required fields
    await fireEvent.submit(form);

    // Check that onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Check required attributes
    expect(nameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('required');
  });

  it('validates email format', async () => {
    const { getByTestId } = render(UserForm, {
      props: {
        onSubmit: mockOnSubmit,
        isLoading: false
      }
    });

    // Get form fields
    const nameInput = getByTestId('name-input').querySelector('input');
    const emailInput = getByTestId('email-input').querySelector('input');
    if (!nameInput || !emailInput) throw new Error('Input not found');
    const form = getByTestId('user-form');

    // Fill out the form with invalid email
    await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });

    // Submit the form
    await fireEvent.submit(form);

    // Check that onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Check email type attribute
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('displays error message when provided', () => {
    const errorMessage = 'Failed to create user';
    const { getByText } = render(UserForm, {
      props: {
        onSubmit: mockOnSubmit,
        isLoading: false,
        errorMessage
      }
    });

    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('displays success message when provided', () => {
    const successMessage = 'User created successfully';
    const { getByText } = render(UserForm, {
      props: {
        onSubmit: mockOnSubmit,
        isLoading: false,
        successMessage
      }
    });

    expect(getByText(successMessage)).toBeTruthy();
  });
});
