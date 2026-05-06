'use strict';

module.exports = {
  space: true,
  ignores: [
    'index.d.ts',
    'test/fixtures/*'
  ],
  rules: {
    'arrow-body-style': 'off',
    'capitalized-comments': 'off',
    'comma-dangle': [
      'error',
      'never'
    ],
    curly: [
      'error',
      'multi-line'
    ],
    'operator-linebreak': [
      'error',
      'after'
    ],
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'space-before-function-paren': [
      'error',
      'never'
    ],
    'unicorn/prefer-module': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/prevent-abbreviations': 'off'
  }
};
