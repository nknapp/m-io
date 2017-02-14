/*!
 * promise-io <https://github.com/nknapp/promise-io>
 *
 * Copyright (c) 2016 Nils Knappmeier.
 * Released under the MIT license.
 */

'use strict'

var fs = require('fs-extra')
var Q = require('q')
var path = require('path')

/**
 *
 * @module
 */
module.exports = {
  /**
   * Custom implementation of [q-io/fs#exists](http://documentup.com/kriskowal/q-io#lexistsPath)
   * to avoid dependency on q-io
   * @param {string} existsPath the path to check
   * @returns {Promise<boolean>} a promise for the existance (true/false) of the file/dir at the path
   */
  exists: function list (existsPath) {
    return new Q.Promise(function (resolve, reject) {
      fs.access(existsPath, function (err) {
        resolve(!err)
      })
    })
  },

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
   * Custom implementation of [q-io/fs#list](http://documentup.com/kriskowal/q-io#listpath)
   * to avoid dependency on q-io
   * @param {string} directoryPath the base path
   * @returns {Promise<string[]>} a promise for the collector, that is fulfilled with a list of directory entries
   */
  list: function list (directoryPath) {
    return Q.ninvoke(fs, 'readdir', directoryPath)
  },

  /**
   * Replacement for [q-io/fs#makeTree](http://documentup.com/kriskowal/q-io#maketreepath-mode)
   * @param {string} aPath the directory to be created
   * @param {number=} mode (e.g. 0644)
   */
  makeTree: function makeTree (aPath, mode) {
    return Q.nfcall(fs.mkdirs, aPath, { mode: mode })
  },

  removeTree: function removeTree (aPath) {
    return Q.nfcall(fs.remove, aPath)
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

  /**
   * Replacement for [q-io/fs#write](http://documentup.com/kriskowal/q-io#writepath-content-options)
   * @param aPath
   * @param content
   */
  write: function write (aPath, content) {
    return Q.ninvoke(fs, 'writeFile', aPath, content)
  },

  /**
   * Replacement for [q-io/fs#copy](http://documentup.com/kriskowal/q-io#copysource-target)
   * @param source
   * @param target
   */
  copy: function copy (source, target) {
    var defer = Q.defer()
    fs.createReadStream(source)
      .on('error', defer.reject.bind(defer))
      .pipe(fs.createWriteStream(target))
      .on('error', defer.reject.bind(defer))
      .on('finish', defer.fulfill.bind(defer))

    return defer.promise
  },

  /**
   * Replacement for [q-io/fs#copyTree](http://documentup.com/kriskowal/q-io#copytreesource-target)
   * @param source
   * @param target
   */
  copyTree: function copyTree (source, target) {
    return Q.nfcall(fs.copy, source, target)
  },

  /**
   * Replacement for [q-io/fs#stat](http://documentup.com/kriskowal/q-io#statpath)
   * @param aPath
   */
  stat: function stat (aPath) {
    return Q.ninvoke(fs, 'stat', aPath)
  },

  /**
   * Replacement for [q-io/fs#isDirectory](http://documentup.com/kriskowal/q-io#isdirectorypath)
   * @param directory
   */
  isDirectory: function isDirectory (directory) {
    return this.stat(directory)
      .then(
        function (stat) {
          return stat.isDirectory()
        },
        function () {
          return false
        }
      )
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
      if (err.code === 'ENOENT') {
        // Like q-io/fs, return an empty array, if the directory does not exist
        return defer.resolve([])
      }
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
