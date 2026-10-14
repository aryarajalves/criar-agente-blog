import { renderHook } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { useLockBodyScroll } from '../src/hooks/useLockBodyScroll';

describe('useLockBodyScroll Hook', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.body.className = '';
  });

  test('trava o scroll do body (overflow: hidden e classe modal-open) quando isLocked é true', () => {
    const { unmount } = renderHook(() => useLockBodyScroll(true));

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.classList.contains('modal-open')).toBe(true);

    unmount();

    expect(document.body.style.overflow).toBe('');
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  test('não altera o body quando isLocked é false', () => {
    renderHook(() => useLockBodyScroll(false));

    expect(document.body.style.overflow).toBe('');
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });
});
