import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { fixturePath } from './helpers.js';

describe('Vue', () => {
  it('grabs dependencies from typescript/scss files', () => {
    const result = precinct.paperwork(fixturePath('ts.vue'));
    expect(result[0]).toBe('./typescript');
    expect(result[1]).toBe('styles.scss');
    expect(result.length).toBe(2);
  });

  it('grabs dependencies from javascript/sass files', () => {
    const result = precinct.paperwork(fixturePath('js.vue'));
    expect(result[0]).toBe('./typescript');
    expect(result[1]).toBe('styles.scss');
    expect(result.length).toBe(2);
  });
});
