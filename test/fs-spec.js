/*!
 * m-io <https://github.com/nknapp/m-io>
 *
 * Copyright (c) 2016 Nils Knappmeier.
 * Released under the MIT license.
 */

/* global describe */
/* global it */
/* global beforeEach */
// /* global xdescribe */
// /* global xit */

'use strict'

var mfs = require('../fs.js')
var fs = require('fs-extra')
var Q = require('q')

var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

describe('m-io/fs', function () {
  var sort = function (x) {
    return x.sort()
  }

  describe('the exists function', function () {
    it('should return true if dir path exists', function () {
      return mfs.exists('test/fixtures/dir').should.eventually.equal(true)
    })

    it('should return true if file path exists', function () {
      return mfs.exists('test/fixtures/dir/file.txt').should.eventually.equal(true)
    })

    it('should return false if dir path does not exist', function () {
      return mfs.exists('test/fixtures/no-dir-or-file').should.eventually.equal(false)
    })
  })

  describe('the list function', function () {
    it('should list all entries in a directory', function () {
      return mfs.list('test/fixtures/dir').then(sort).should.eventually.deep.equal([
        'file.txt',
        'subdir'
      ])
    })
  })

  describe('the list-tree function', function () {
    it('should return an empty array if the directory does not exist', function () {
      return mfs.listTree('test/fixtures/no-directory').should.eventually.deep.equal([])
    })

    it('should return a file listing as array', function () {
      return mfs.listTree('test/fixtures/tree').then(sort).should.eventually.deep.equal([
        'test/fixtures/tree',
        'test/fixtures/tree/a',
        'test/fixtures/tree/a/b',
        'test/fixtures/tree/a/b/c.txt',
        'test/fixtures/tree/a/bb',
        'test/fixtures/tree/a/bb/cc.txt'
      ])
    })

    it('should apply the filter to all entries (stats)', function () {
      var filter = function (name, stat) {
        return stat.isFile()
      }
      return mfs.listTree('test/fixtures/tree', filter).then(sort).should.eventually.deep.equal([
        'test/fixtures/tree/a/b/c.txt',
        'test/fixtures/tree/a/bb/cc.txt'
      ])
    })

    it('should apply the filter to all entries (name)', function () {
      var filter = function (name, stat) {
        return name !== 'test/fixtures/tree/a/bb'
      }
      return mfs.listTree('test/fixtures/tree', filter).then(sort).should.eventually.deep.equal([
        'test/fixtures/tree',
        'test/fixtures/tree/a',
        'test/fixtures/tree/a/b',
        'test/fixtures/tree/a/b/c.txt',
        'test/fixtures/tree/a/bb/cc.txt'
      ])
    })

    it('should not traverse dirs for which the filter returns null', function () {
      var filter = function (name, stat) {
        return name === 'test/fixtures/tree/a/bb' ? null : true
      }
      return mfs.listTree('test/fixtures/tree', filter).then(sort).should.eventually.deep.equal([
        'test/fixtures/tree',
        'test/fixtures/tree/a',
        'test/fixtures/tree/a/b',
        'test/fixtures/tree/a/b/c.txt'
      ])
    })
  })

  describe('the read function', function () {
    it('should read the file contents', function () {
      return mfs.read('test/fixtures/tree/a/b/c.txt').should.eventually.equal('c')
    })

    it('should read the file contents as Buffer in binary mode', function () {
      return mfs.read('test/fixtures/tree/a/b/c.txt', 'b').should.eventually.deep.equal(new Buffer('c', 'utf-8'))
    })

    it('should read the file contents as Buffer in binary mode (options-object)', function () {
      return mfs.read('test/fixtures/tree/a/b/c.txt', { flags: 'b' }).should.eventually.deep.equal(new Buffer('c', 'utf-8'))
    })
  })

  describe('the write function', function () {
    beforeEach(function () {
      fs.removeSync('tmp/test')
      fs.mkdirsSync('tmp/test')
    })
    it('should write the file contents', function () {
      return mfs.write('tmp/test/a.txt', 'a').then(function () {
        return readSync('tmp/test/a.txt')
      }).should.eventually.equal('a')
    })

    it('should write the file contents as Buffer in binary mode', function () {
      return mfs.write('tmp/test/c.txt', new Buffer('c', 'utf-8')).then(function () {
        return readSync('tmp/test/c.txt')
      }).should.eventually.deep.equal('c')
    })
  })

  describe('the makeTree-function', function () {
    beforeEach(function () {
      fs.removeSync('tmp/test')
      fs.mkdirsSync('tmp/test')
    })
    it('should create a directory with parents', function () {
      return mfs.makeTree('tmp/test/make/tree/directory').then(function () {
        return fs.existsSync('tmp/test/make/tree/directory')
      }).should.eventually.be.ok
    })

    it('should create a directory with a given mode', function () {
      var result = mfs.makeTree('tmp/test/make/tree/directory700', 448) // 0o700
        .then(function () {
          return Q.all([
            // Only the last three octals are interesting
            fs.statSync('tmp/test/make').mode & 511, // 0o777 to keep the last 3 octals
            fs.statSync('tmp/test/make/tree').mode & 511,
            fs.statSync('tmp/test/make/tree/directory700').mode & 511
          ])
        })
      return result.should.eventually.deep.equal([448, 448, 448])
    })
  })

  describe('the removeTree-function', function () {
    beforeEach(function () {
      fs.mkdirsSync('tmp/test/remove/tree/directory')
    })
    it('should create a directory with parents', function () {
      return mfs.removeTree('tmp/test/remove').then(function () {
        return fs.existsSync('tmp/test/remove')
      }).should.eventually.be.false
    })
  })

  describe('the isDirectory-function', function () {
    it('should return true for directories', function () {
      return mfs.isDirectory('test').should.eventually.be.true
    })
    it('should return false for non-directories', function () {
      return mfs.isDirectory('package.json').should.eventually.be.false
    })
    it('should return false if there is neither a file nor a directory there', function () {
      return mfs.isDirectory('test2/test2').should.eventually.be.false
    })
  })

  describe('the copyTree-function', function () {
    it('should copy a complete directore path', function () {
      return mfs.copyTree('test/fixtures/dir', 'tmp/test/copytree/dir')
        .then(function () {
          const dirs = ['dir', 'dir/subdir']
          const files = ['dir/subdir/donotdelete.txt', 'dir/file.txt']
          dirs.forEach(function (dir) {
            fs.readdirSync('tmp/test/copytree/' + dir)
              .should.deep.equal(fs.readdirSync('test/fixtures/' + dir),
              'Checking contents of directory ' + dir)
          })
          files.concat(dirs).forEach(function (file) {
            fs.statSync('tmp/test/copytree/' + file).mode
              .should.deep.equal(fs.statSync('test/fixtures/' + file).mode,
              'Checking mode of ' + file)
          })
          files.forEach(function (file) {
            fs.readFileSync('tmp/test/copytree/' + file)
              .should.deep.equal(fs.readFileSync('test/fixtures/' + file),
              'Checking contents of file ' + file)
          })
        })
    })
  })
})

/**
 * Helper to read files as string
 * @param path
 */
function readSync (path) {
  return fs.readFileSync(path, { encoding: 'utf-8' })
}
