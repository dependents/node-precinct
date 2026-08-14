import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

/**
 * Runs a snippet in a child process so module loading starts from a clean slate,
 * optionally making `typescript` unresolvable or a detective unloadable.
 *
 * @param {string} source
 * @param {{ hideTypeScript?: boolean, breakDetective?: string }} [options]
 * @returns {string}
 */
function runInChildProcess(source, options = {}) {
  let preamble = '';

  if (options.hideTypeScript) {
    preamble = `import Module from 'node:module';
     const originalResolve = Module._resolveFilename;
     Module._resolveFilename = function(request, ...rest) {
       if (request === 'typescript') {
         throw Object.assign(new Error("Cannot find module 'typescript'"), { code: 'MODULE_NOT_FOUND' });
       }

       return originalResolve.call(this, request, ...rest);
     };`;
  } else if (options.breakDetective) {
    preamble = `import Module from 'node:module';
     const originalLoad = Module._load;
     Module._load = function(request, ...rest) {
       if (request === '${options.breakDetective}') {
         throw new TypeError('ts.createSourceFile is not a function');
       }

       return originalLoad.call(this, request, ...rest);
     };`;
  }

  return execFileSync(process.execPath, ['--input-type=module', '--eval', preamble + source], {
    cwd: rootDir,
    encoding: 'utf8'
  }).trim();
}

describe('lazily loaded detectives', () => {
  it('does not load the typescript compiler when parsing JavaScript', () => {
    const output = runInChildProcess(`
      import Module from 'node:module';
      const loaded = [];
      const originalLoad = Module._load;
      Module._load = function(request, ...rest) {
        if (request === 'typescript') loaded.push(request);
        return originalLoad.call(this, request, ...rest);
      };

      const { default: precinct } = await import('./index.js');
      precinct('const foo = require("./bar");');
      console.log(loaded.length === 0 ? 'not-loaded' : 'loaded');
    `);

    expect(output).toBe('not-loaded');
  });

  it('loads the typescript detective on demand for ts files', () => {
    const output = runInChildProcess(`
      import Module from 'node:module';
      let loaded = false;
      const originalLoad = Module._load;
      Module._load = function(request, ...rest) {
        if (request === 'typescript') loaded = true;
        return originalLoad.call(this, request, ...rest);
      };

      const { default: precinct } = await import('./index.js');
      const dependencies = precinct('import foo from "./bar";', { type: 'ts' });
      console.log(JSON.stringify({ loaded, dependencies }));
    `);

    expect(JSON.parse(output)).toStrictEqual({ loaded: true, dependencies: ['./bar'] });
  });

  it('throws an actionable error for ts files when typescript is not installed', () => {
    const output = runInChildProcess(`
      const { default: precinct } = await import('./index.js');

      try {
        precinct('import foo from "./bar";', { type: 'ts' });
        console.log('no-error');
      } catch (error) {
        console.log(error.message);
      }
    `, { hideTypeScript: true });

    expect(output).toContain('requires the "typescript" peer dependency');
  });

  it('rewrites a detective that cannot load with the installed typescript', () => {
    const output = runInChildProcess(`
      const { default: precinct } = await import('./index.js');

      try {
        precinct('import foo from "./bar";', { type: 'ts' });
        console.log('no-error');
      } catch (error) {
        console.log(JSON.stringify({ code: error.code, message: error.message, cause: error.cause?.message }));
      }
    `, { breakDetective: 'detective-typescript' });

    const error = JSON.parse(output);
    expect(error.code).toBe('ERR_TYPESCRIPT_UNAVAILABLE');
    expect(error.message).toMatch(/could not be loaded with typescript@\d+\.\d+/v);
    expect(error.message).toContain('ts.createSourceFile is not a function');
    expect(error.cause).toBe('ts.createSourceFile is not a function');
  });

  it('throws an actionable error for vue files when typescript is not installed', () => {
    const output = runInChildProcess(`
      const { default: precinct } = await import('./index.js');

      try {
        precinct('<template></template>', { type: 'vue' });
        console.log('no-error');
      } catch (error) {
        console.log(error.message);
      }
    `, { hideTypeScript: true });

    expect(output).toContain('requires the "typescript" peer dependency');
  });
});
