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
  // Find and click the select anchor to open the menu
  const anchor = element.querySelector('.mdc-select__anchor');
  if (!anchor) throw new Error('No select anchor found');
  await fireEvent.click(anchor);
  
  // Wait for the menu to be fully opened
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Find and click the option with the matching value
  const option = element.querySelector(`.mdc-deprecated-list-item[data-value="${value}"]`);
  if (!option) throw new Error('No option found with value: ' + value);
  await fireEvent.click(option);
  
  // Wait for the selection to be processed
  await new Promise(resolve => setTimeout(resolve, 0));
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