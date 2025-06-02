import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Navigation from '../../components/Navigation.svelte';

describe('Navigation', () => {
  // Store original window.location
  const originalLocation = window.location;
  
  beforeEach(() => {
    // Mock window.location
    delete window.location;
    window.location = { 
      ...originalLocation,
      pathname: '/',
      href: 'http://localhost:3000/',
      assign: vi.fn(),
      replace: vi.fn()
    };
    
    // Mock window.history.pushState
    vi.spyOn(window.history, 'pushState').mockImplementation((state, title, url) => {
      window.location.pathname = typeof url === 'string' ? url : '/';
    });
  });
  
  afterEach(() => {
    // Restore window.location
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  it('renders navigation links', () => {
    const { container } = render(Navigation);

    // Check if all navigation links are present
    expect(container.querySelector('nav')).toBeTruthy();
    expect(container.querySelector('ul')).toBeTruthy();
    expect(container.querySelectorAll('li')).toHaveLength(3);
    expect(container.querySelector('a[href="/"]')).toHaveTextContent('Dashboard');
    expect(container.querySelector('a[href="/users"]')).toHaveTextContent('Users');
    expect(container.querySelector('a[href="/groups"]')).toHaveTextContent('Groups');
  });

  it('highlights active link based on current path', () => {
    // Set initial path to '/'
    window.location.pathname = '/';
    const { container } = render(Navigation);

    // Dashboard link should be active by default
    expect(container.querySelector('a[href="/"]')).toHaveClass('active');
    expect(container.querySelector('a[href="/users"]')).not.toHaveClass('active');
    expect(container.querySelector('a[href="/groups"]')).not.toHaveClass('active');
  });

  it('handles empty pathname as root path', () => {
    // Some browsers might return empty string for root path
    window.location.pathname = '';
    const { container } = render(Navigation);

    // Dashboard link should be active for empty pathname
    expect(container.querySelector('a[href="/"]')).toHaveClass('active');
  });

  it('navigates when clicking a link', async () => {
    const { container } = render(Navigation);

    // Click on Users link
    const usersLink = container.querySelector('a[href="/users"]');
    if (usersLink) {
      await fireEvent.click(usersLink);

      // Check if pushState was called with correct arguments
      expect(window.history.pushState).toHaveBeenCalledWith({}, '', '/users');
      
      // Check if currentPath was updated by checking active classes
      await waitFor(() => {
        expect(container.querySelector('a[href="/"]')).not.toHaveClass('active');
        expect(container.querySelector('a[href="/users"]')).toHaveClass('active');
        expect(container.querySelector('a[href="/groups"]')).not.toHaveClass('active');
      });
    }
  });

  it('updates active link on popstate', async () => {
    const { container } = render(Navigation);

    // Update pathname to simulate navigation
    window.location.pathname = '/users';
    
    // Dispatch popstate event
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Check if active class was updated
    await waitFor(() => {
      expect(container.querySelector('a[href="/"]')).not.toHaveClass('active');
      expect(container.querySelector('a[href="/users"]')).toHaveClass('active');
      expect(container.querySelector('a[href="/groups"]')).not.toHaveClass('active');
    });
  });
  
  it('prevents default behavior when clicking links', async () => {
    const { container } = render(Navigation);
    
    // Mock preventDefault
    const preventDefaultSpy = vi.fn();
    
    // Click on Groups link with mocked event
    const groupsLink = container.querySelector('a[href="/groups"]');
    if (groupsLink) {
      await fireEvent.click(groupsLink, {
        preventDefault: preventDefaultSpy
      });
      
      // Check if preventDefault was called
      expect(preventDefaultSpy).toHaveBeenCalled();
    }
  });

  it('works without window object during SSR', () => {
    // Temporarily remove window.location and window.history
    const tempWindow = { ...window };
    const tempLocation = { ...window.location };
    const tempHistory = { ...window.history };
    
    // @ts-ignore - Simulate SSR environment
    delete window.location;
    // @ts-ignore - Simulate SSR environment
    delete window.history;
    
    // Component should not throw error when window is undefined
    expect(() => render(Navigation)).not.toThrow();
    
    // Restore window objects
    window.location = tempLocation;
    window.history = tempHistory;
  });
});
