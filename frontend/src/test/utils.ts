import { fireEvent } from '@testing-library/svelte';

/**
 * Helper function to handle SMUI TextField input changes
 */
export async function setTextFieldValue(element: HTMLElement, value: string) {
  const input = element.querySelector('input');
  if (!input) throw new Error('No input element found in TextField');
  await fireEvent.input(input, { target: { value } });
  await fireEvent.blur(input);
}

/**
 * Helper function to handle SMUI Select changes
 */
export async function setSelectValue(element: HTMLElement, value: string) {
  const select = element.querySelector('select');
  if (!select) throw new Error('No select element found');
  await fireEvent.change(select, { target: { value } });
}

/**
 * Helper function to check if a TextField is invalid
 */
export function isTextFieldInvalid(element: HTMLElement): boolean {
  const input = element.querySelector('input');
  return input?.getAttribute('aria-invalid') === 'true';
}

/**
 * Helper function to get TextField helper text
 */
export function getTextFieldHelperText(element: HTMLElement): string | null {
  const helperText = element.querySelector('.mdc-text-field-helper-text');
  return helperText?.textContent || null;
}

/**
 * Helper function to check if a component is disabled
 */
export function isComponentDisabled(element: HTMLElement): boolean {
  return element.hasAttribute('disabled') || 
         element.classList.contains('mdc-text-field--disabled');
} 