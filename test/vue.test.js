import { describe, it, expect } from 'vitest';
import precinct from '../index.js';
import { fixturePath } from './helpers.js';

describe('Vue', () => {
  it('grabs dependencies from typescript/scss files', () => {
    const result = precinct.paperwork(fixturePath('ts.vue'));
    expect(result).toStrictEqual(['./typescript', 'styles.scss']);
  });

  it('grabs dependencies from javascript/sass files', () => {
    const result = precinct.paperwork(fixturePath('js.vue'));
    expect(result).toStrictEqual(['./typescript', 'styles.scss']);
  });
});
