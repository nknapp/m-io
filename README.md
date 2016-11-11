# m-io 

[![NPM version](https://badge.fury.io/js/m-io.svg)](http://badge.fury.io/js/m-io)
[![Travis Build Status](https://travis-ci.org/nknapp/m-io.svg?branch=master)](https://travis-ci.org/nknapp/m-io)
[![Coverage Status](https://img.shields.io/coveralls/nknapp/m-io.svg)](https://coveralls.io/r/nknapp/m-io)


> (Incomplete) replacement for q-io

This package is a replacement for the functions of [q-io](https://npmjs.com/package/q-io) that I use in my projects. I have use `q-io/fs` a lot since it has functions
like `makeTree`, `listTree` and `removeTree`. Furthermore, its `read` and `write` function work with strings by default, which makes it easier to 
read text files.

Sadly, `q-io@1` depends on [collections](https://npmjs.com/package/collections)@1, which 
[overwrites the function `Array.prototype.find` with an implementation that does not match the ES6-spec](https://github.com/montagejs/collections/issues/139).
This causes problems in [jsdoc-parse](https://npmjs.com/package/jsdoc-parse). This is another example of why [modifying objects you don’t own][zakas dont modify]
is a bad practice.

This problem *could* be solved by using `q-io@2` instead of version 1. This version has [other problems](https://github.com/kriskowal/q-io/pull/155) which were
solved in version 1. It may be a silly feeling, but version 2 of `q-io` vseems not to receive too much care at the moment.

Since I do not use many functions, I have decided to write a drop-in replacement for my own purposes, and this is it: `m-io`.
If you like this and want to provide more methods for your needs, please go ahead and make a PR.




[zakas dont modify]: https://www.nczonline.net/blog/2010/03/02/maintainable-javascript-dont-modify-objects-you-down-own/
# Installation

```
npm install m-io
```

 
## Usage

The following example demonstrates how to use this module:

```js
var FS = require('m-io/fs')

// Create some files
FS.makeTree('city/germany')
  .then(() => FS.write('city/germany/darmstadt.md', 'Darmstadt is nice'))
  .then(() => FS.makeTree('city/usa'))
  .then(() => FS.write('city/usa/new-york.md', 'New York is huge'))
  .then(() => FS.makeTree('city/france'))
  .then(() => FS.write('city/france/paris.md', 'Olala'))

  // List files
  .then(() => FS.listTree('city', (filename, stats) => stats.isFile()))
  .then((filelist) => console.log('List files:', filelist.sort()))

  // List dirs and files
  .then(() => FS.listTree('city'))
  .then((list) => console.log('List dirs and files:', list.sort()))

  // Read file contents
  .then(() => FS.read('city/usa/new-york.md'))
  .then((nyc) => console.log('Read file contents:', nyc))

  // Remove subdir
  .then(() => FS.removeTree('city/usa'))
  .done(() => console.log('Done'))
```

This will generate the following output

```
List files: [ 'city/france/paris.md',
  'city/germany/darmstadt.md',
  'city/usa/new-york.md' ]
List dirs and files: [ 'city',
  'city/france',
  'city/france/paris.md',
  'city/germany',
  'city/germany/darmstadt.md',
  'city/usa',
  'city/usa/new-york.md' ]
Read file contents: New York is huge
Done
```

After deleting `city/usa`, the `city`-subtree looks liks this:

<pre><code>
city
├─┬ france
│ └── paris.md
└─┬ germany
  └── darmstadt.md
</code></pre>

##  API-reference 

### `require("m-io/fs")`

<a name="module_fs"></a>

### fs

* [fs](#module_fs)
    * [.listTree(directoryPath, filter)](#module_fs.listTree) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
    * [.makeTree(aPath, [mode])](#module_fs.makeTree)
    * [.read(aPath)](#module_fs.read)

<a name="module_fs.listTree"></a>

#### .listTree(directoryPath, filter) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
Custom implementation of [q-io/fs#listTree](http://documentup.com/kriskowal/q-io#listtreepath-guardpath-stat)
to avoid dependency on q-io

**Kind**: static method of <code>[fs](#module_fs)</code>  
**Returns**: <code>Promise.&lt;Array.&lt;string&gt;&gt;</code> - a promise for the collector, that is fulfilled after traversal  

| Param | Type | Description |
| --- | --- | --- |
| directoryPath | <code>string</code> | the base path |
| filter | <code>function</code> | a function that returns true, false or null to show that a file  should be included or ignored and that a directory should be ignored completely (null) |

<a name="module_fs.makeTree"></a>

#### .makeTree(aPath, [mode])
Replacement for [q-io/fs#makeTree](http://documentup.com/kriskowal/q-io#maketreepath-mode)

**Kind**: static method of <code>[fs](#module_fs)</code>  

| Param | Type | Description |
| --- | --- | --- |
| aPath | <code>string</code> | the directory to be created |
| [mode] | <code>number</code> | (e.g. 0644) |

<a name="module_fs.read"></a>

#### .read(aPath)
Replacement for [q-io/fs#read](http://documentup.com/kriskowal/q-io#readpath-options)

**Kind**: static method of <code>[fs](#module_fs)</code>  

| Param |
| --- |
| aPath | 




## License

`m-io` is published under the MIT-license. 
See [LICENSE.md](LICENSE.md) for details.

## Release-Notes
 
For release notes, see [CHANGELOG.md](CHANGELOG.md)
 
## Contributing guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md).