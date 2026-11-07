import {describe, it, expect} from 'vitest';
import {
  getMethodBadgeClass,
  getMethodSelectClass,
  getMethodTextColorClass,
  getMethodShort
} from './method-colors';

describe('method-colors utility', () => {
  it('should return correct badge classes for known HTTP methods', () => {
    expect(getMethodBadgeClass('GET')).toContain('emerald');
    expect(getMethodBadgeClass('POST')).toContain('amber');
    expect(getMethodBadgeClass('PUT')).toContain('blue');
    expect(getMethodBadgeClass('DELETE')).toContain('rose');
    expect(getMethodBadgeClass('PATCH')).toContain('purple');
    expect(getMethodBadgeClass('HEAD')).toContain('cyan');
    expect(getMethodBadgeClass('OPTIONS')).toContain('pink');
    expect(getMethodBadgeClass('TRACE')).toContain('indigo');
    expect(getMethodBadgeClass('CONNECT')).toContain('teal');
    expect(getMethodBadgeClass('UNKNOWN')).toContain('slate');
    expect(getMethodBadgeClass(null)).toContain('slate');
  });

  it('should return correct select classes for known HTTP methods', () => {
    expect(getMethodSelectClass('GET')).toContain('emerald');
    expect(getMethodSelectClass('POST')).toContain('amber');
    expect(getMethodSelectClass('PUT')).toContain('blue');
    expect(getMethodSelectClass('DELETE')).toContain('rose');
    expect(getMethodSelectClass('PATCH')).toContain('purple');
    expect(getMethodSelectClass('HEAD')).toContain('cyan');
    expect(getMethodSelectClass('OPTIONS')).toContain('pink');
    expect(getMethodSelectClass('UNKNOWN')).toContain('slate');
  });

  it('should return correct text color classes', () => {
    expect(getMethodTextColorClass('GET')).toBe('text-emerald-400');
    expect(getMethodTextColorClass('POST')).toBe('text-amber-400');
    expect(getMethodTextColorClass('PUT')).toBe('text-blue-400');
    expect(getMethodTextColorClass('DELETE')).toBe('text-rose-400');
    expect(getMethodTextColorClass('PATCH')).toBe('text-purple-400');
    expect(getMethodTextColorClass('UNKNOWN')).toBe('text-slate-400');
  });

  it('should return correct short labels for methods', () => {
    expect(getMethodShort('GET')).toBe('GET');
    expect(getMethodShort('POST')).toBe('POST');
    expect(getMethodShort('DELETE')).toBe('DEL');
    expect(getMethodShort('OPTIONS')).toBe('OPT');
    expect(getMethodShort('PATCH')).toBe('PAT');
    expect(getMethodShort(null)).toBe('REQ');
  });
});
