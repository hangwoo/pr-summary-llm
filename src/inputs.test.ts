import { describe, expect, it } from 'vitest';
import { assertRequired, resolveInputValue } from './inputs';

describe('resolveInputValue', () => {
  it('returns trimmed input when present', () => {
    const originalValue = process.env.INPUT_SAMPLE;
    process.env.INPUT_SAMPLE = '  value  ';

    try {
      expect(resolveInputValue('sample', 'fallback')).toBe('value');
    } finally {
      if (originalValue === undefined) {
        delete process.env.INPUT_SAMPLE;
      } else {
        process.env.INPUT_SAMPLE = originalValue;
      }
    }
  });

  it('falls back when input is missing', () => {
    const originalValue = process.env.INPUT_MISSING;
    delete process.env.INPUT_MISSING;

    try {
      expect(resolveInputValue('missing', 0)).toBe('0');
      expect(resolveInputValue('missing', undefined)).toBe('');
    } finally {
      if (originalValue === undefined) {
        delete process.env.INPUT_MISSING;
      } else {
        process.env.INPUT_MISSING = originalValue;
      }
    }
  });
});

describe('assertRequired', () => {
  it('throws when value is empty', () => {
    expect(() => assertRequired('token', '')).toThrow('token 입력이 필요합니다.');
  });

  it('does not throw when value is present', () => {
    expect(() => assertRequired('token', 'value')).not.toThrow();
  });
});
