/*!
 * promise-io <https://github.com/nknapp/promise-io>
 *
 * Copyright (c) 2016 Nils Knappmeier.
 * Released under the MIT license.
 */

'use strict'

var fs = require('fs')
var Q = require('q')
var path = require('path')

/**
 *
 * @module
 */
module.exports = {
  /**
   * Custom implementation of [q-io/fs#listTree](http://documentup.com/kriskowal/q-io#listtreepath-guardpath-stat)
   * to avoid dependency on q-io
   * @param {string} directoryPath the base path
   * @param {function(string,fs.Stats):boolean=} filter a function that returns true, false or null to show that a file
   *  should be included or ignored and that a directory should be ignored completely (null)
   * @returns {Promise<string[]>} a promise for the collector, that is fulfilled after traversal
   */
  listTree: function listTree (directoryPath, filter) {
    return walk(directoryPath, filter, [])
  },
  /**
   * Replacement for [q-io/fs#makeTree](http://documentup.com/kriskowal/q-io#maketreepath-mode)
   * @param {string} aPath the directory to be created
   * @param {number=} mode (e.g. 0644)
   */
  makeTree: function makeTree (aPath, mode) {
    return Q.nfcall(require('mkdirp'), aPath, {mode: mode})
  },
  removeTree: function removeTree (aPath) {
    return Q.nfcall(require('rimraf'), aPath)
  },
  /**
   * Replacement for [q-io/fs#read](http://documentup.com/kriskowal/q-io#readpath-options)
   * @param aPath
   */
  read: function read (aPath, options) {
    var flags = optionsFrom(options).flags
    return Q.ninvoke(fs, 'readFile', aPath, {
      encoding: flags === 'b' ? null : 'utf-8'
    })
  },

  write: function write (aPath, content) {
    return Q.ninvoke(fs, 'writeFile', aPath, content)
  },

  copy: function copy (source, target) {
    var defer = Q.defer()
    fs.createReadStream(source)
      .on('error', defer.reject.bind(defer))
      .pipe(fs.createWriteStream(target))
      .on('error', defer.reject.bind(defer))
      .on('finish', defer.fulfill.bind(defer))

    return defer.promise
  },

  stat: function stat (aPath) {
    return Q.ninvoke(fs, 'stat', aPath)
  }

}

/**
 * Coerce a flag-string `b` into an options-object `{ flags: 'ba' }` if necessary.
 * @param optionsOrFlags
 * @private
 * @returns {*}
 */
function optionsFrom (optionsOrFlags) {
  if (!optionsOrFlags) {
    return {}
  }
  if (typeof optionsOrFlags === 'string') {
    return {
      flags: optionsOrFlags
    }
  }
  return optionsOrFlags
}

/**
 * Walk a directory tree, collect paths of files in an Array and return a Promise for the fulfilled action
 * @param {string} directoryPath the base path
 * @param {function(string,fs.Stats):boolean} filter a function that returns true, false or null to show that a file
 *  should be included or ignored and that a directory should be ignored completely (null)
 * @param {string[]} collector array to collect the filenames into
 * @private
 * @returns {Promise<string[]>} a promise for the collector, that is fulfilled after traversal
 */
function walk (directoryPath, filter, collector) {
  var defer = Q.defer()
  fs.stat(directoryPath, function (err, stat) {
    if (err) {
      return defer.reject(err)
    }
    // Call filter to get result, "true" if no filter is set
    var filterResult = !filter || filter(directoryPath, stat)
    if (filterResult) {
      collector.push(directoryPath)
    }
    // false/true => iterate directory
    if (stat.isDirectory() && filterResult !== null) {
      fs.readdir(directoryPath, function (err, filenames) {
        if (err) {
          return defer.reject(err)
        }
        var paths = filenames.map(function (name) {
          return path.join(directoryPath, name)
        })
        // Walk all files/subdirs
        Q.all(paths.map(function (filepath) {
          return walk(filepath, filter, collector)
        }))
          .then(function () {
            defer.fulfill(collector)
          })
      })
    } else {
      // No recursive call with a file
      defer.fulfill(collector)
    }
  })
  return defer.promise
}
