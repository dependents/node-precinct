### Precinct [![npm](http://img.shields.io/npm/v/module-definition.svg)](https://npmjs.org/package/precinct) [![npm](http://img.shields.io/npm/dm/precinct.svg)](https://npmjs.org/package/precinct)

> Unleash the detectives

`npm install precinct`

Uses the appropriate detective to find the dependencies of a file.
Supports: AMD, CommonJS, and ES6 modules.

### Usage

```js
var precinct = require('precinct');

// Pass in the file's content
var deps = precinct(fs.readFileSync('myFile.js', 'utf8')); // array containing dependencies
```

### License

MIT
