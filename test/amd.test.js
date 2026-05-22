import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { readFixture } from './helpers.js';

describe('AMD', () => {
  it('grabs dependencies', async() => {
    const fixture = await readFixture('amd.js');
    const result = precinct(fixture);
    expect(result.includes('./a')).toBe(true);
    expect(result.includes('./b')).toBe(true);
    expect(result.length).toBe(2);
  });
});
