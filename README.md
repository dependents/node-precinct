# precinct

[![CI](https://img.shields.io/github/actions/workflow/status/dependents/node-precinct/ci.yml?branch=main&label=CI&logo=github)](https://github.com/dependents/node-precinct/actions/workflows/ci.yml?query=branch%3Amain)
[![npm version](https://img.shields.io/npm/v/precinct?logo=npm&logoColor=fff)](https://www.npmjs.com/package/precinct)
[![npm downloads](https://img.shields.io/npm/dm/precinct)](https://www.npmjs.com/package/precinct)

> Unleash the detectives

Uses the appropriate detective to find the dependencies of a file or its AST.

Supports:

- JavaScript modules: AMD, CommonJS, ES6
- TypeScript
- CSS preprocessors: Sass, Scss, Less, Stylus
- CSS (PostCSS)
- Vue

## Install

```sh
npm install precinct
```

## Quick start

```js
const fs = require('node:fs');
const precinct = require('precinct');

const content = fs.readFileSync('myFile.js', 'utf8');

// From source content or an AST
const deps = precinct(content);

// Or directly from a file path
const deps2 = precinct.paperwork('styles.scss');
```

## API

### `precinct(content, options?)`

Returns an array of dependency strings discovered in `content`. `content` may be a source string or an already-parsed AST.

| Option | Type | Default | Notes |
|---|---|---|---|
| `type` | `string` | inferred from source | Forces a specific detective. See [Supported types](#supported-types). |
| `walker` | `object` | - | Passed through to the underlying [node-source-walk](https://github.com/dependents/node-source-walk) instance - e.g. `{ allowImportExportEverywhere: true }`, or `{ parser: myCustomParser }` to swap in a parser with a `.parse(src, opts)` method. |
| `amd.skipLazyLoaded` | `boolean` | `false` | Omit lazy-loaded (inner-`require`) dependencies in AMD files. |
| `es6.mixedImports` | `boolean` | `false` | Return both ES6 and CommonJS imports from a file that mixes the two. Works for any format that contains an ES6 import. |
| `css.url` | `boolean` | `false` | Include `url()` references (images, fonts, etc.) in CSS output. |
| `[type]` | `object` | - | Any other key matching a module type is forwarded to that detective as its options bag. |

Side channel: `precinct.ast` holds the last AST produced (or `null` when parsing failed).

#### Example

```js
precinct(content, {
  type: 'amd',
  amd: {
    skipLazyLoaded: true
  }
});

precinct(content, {
  walker: {
    allowImportExportEverywhere: true
  }
});

// Non-JS content
precinct(scssSource, { type: 'scss' });
precinct(stylusSource, { type: 'stylus' });
```

### `precinct.paperwork(filename, options?)`

Reads the file at `filename` and returns an array of its dependencies. The module type is inferred from the file extension (see below). Accepts every option `precinct()` does, plus the two below.

| Option | Type | Default | Notes |
|---|---|---|---|
| `includeCore` | `boolean` | `true` | Set to `false` to strip Node.js core modules (`fs`, `path`, `node:fs`, ...) from the result. |
| `fileSystem` | `{ readFileSync(path, encoding): string }` | `node:fs` | An alternative `fs` implementation used to read `filename`. Only `readFileSync(path, 'utf8')` is required. |
| `walker`, `amd`, `es6`, `css`, `[type]` | - | - | Same as `precinct()` - all detective options are forwarded. |

#### Example

```js
const { paperwork } = require('precinct');

const deps = paperwork('myFile.js');
const deps2 = paperwork('styles.scss');
const deps3 = paperwork('app.ts', { includeCore: false });
```

## Supported types

Accepted values for the `type` option:

| Value | Detective |
|---|---|
| `amd` | [detective-amd](https://github.com/dependents/node-detective-amd) |
| `cjs`, `commonjs` | [detective-cjs](https://github.com/dependents/node-detective-cjs) |
| `css` | [detective-postcss](https://github.com/dependents/node-detective-postcss) |
| `es6`, `esm`, `mjs` | [detective-es6](https://github.com/dependents/node-detective-es6) |
| `less` | [@dependents/detective-less](https://github.com/dependents/node-detective-less) |
| `sass` | [detective-sass](https://github.com/dependents/node-detective-sass) |
| `scss` | [detective-scss](https://github.com/dependents/node-detective-scss) |
| `stylus` | [detective-stylus](https://github.com/dependents/node-detective-stylus) |
| `ts` | [detective-typescript](https://github.com/dependents/detective-typescript) |
| `tsx` | [detective-typescript](https://github.com/dependents/detective-typescript) (tsx variant) |
| `vue` | [detective-vue2](https://github.com/dependents/detective-vue2) |

`paperwork()` infers the type from the filename extension; `.styl` maps to `stylus` and `.cjs` maps to `commonjs`. Any other extension becomes the type with the leading dot stripped. `.js` and `.jsx` are sniffed at the source level rather than by extension.

## CLI

```sh
npm install -g precinct
precinct [options] <filename>
```

| Flag | Description |
|---|---|
| `-t, --type <type>` | Force a module type (see [Supported types](#supported-types)). |
| `--es6-mixed-imports` | Collect both ES6 and CommonJS imports in the same file. |
| `-V, --version` | Print version. |
| `-h, --help` | Print help. |

## License

[MIT](LICENSE)
