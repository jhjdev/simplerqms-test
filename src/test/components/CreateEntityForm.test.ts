import { render, fireEvent, waitFor } from '@testing-library/svelte';
import CreateEntityForm from '../../components/CreateEntityForm.svelte';
import type { Group } from '../../types';

const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Group 1',
    parent_id: null,
    children: [],
    users: [],
    type: 'group',
    level: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockOnUserSubmit = vi.fn();

describe('CreateEntityForm', () => {
  it('displays success message in dialog and clears form after successful submission', async () => {
    const { component, container } = render(CreateEntityForm, {
      props: {
        groups: mockGroups,
        onUserSubmit: mockOnUserSubmit,
        isLoading: false,
        errorMessage: '',
        successMessage: '',
      },
    });

    const nameInput = container.querySelectorAll('.mdc-text-field input')[0];
    const emailInput = container.querySelectorAll('.mdc-text-field input')[1];
    const submitButton = container.querySelectorAll(
      '.form-section:last-child .mdc-button'
    )[0];

    if (nameInput && emailInput && submitButton) {
      await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
      await fireEvent.input(emailInput, {
        target: { value: 'john@example.com' },
      });
      await fireEvent.click(submitButton);

      // Simulate parent updating successMessage prop after submit
      await component.$set({ successMessage: 'User created successfully' });

      await waitFor(
        () => {
          const successDialog = container.querySelector('.success-dialog');
          expect(successDialog).toBeTruthy();
          expect(successDialog).toHaveTextContent('User created successfully');
        },
        { timeout: 2000 }
      );

      // Wait for form to clear
      await waitFor(
        () => {
          expect(nameInput).toHaveValue('');
          expect(emailInput).toHaveValue('');
        },
        { timeout: 2000 }
      );
    }
  });
});
