### Precinct [![npm](http://img.shields.io/npm/v/module-definition.svg)](https://npmjs.org/package/precinct) [![npm](http://img.shields.io/npm/dm/precinct.svg)](https://npmjs.org/package/precinct)

> Unleash the detectives

`npm install precinct`

Uses the appropriate detective to find the dependencies of the file. 
Supports: AMD, CommonJS, and ES6 modules.

### Usage

```js
var precinct = require('precinct');

var deps = precinct('myFile.js'); // array containing dependencies
```

### License

MIT
