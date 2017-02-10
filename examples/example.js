var FS = require('../fs')

// Create some files
FS.makeTree('city/germany')
  .then(() => FS.write('city/germany/darmstadt.md', 'Darmstadt is nice'))
  .then(() => FS.makeTree('city/usa'))
  .then(() => FS.write('city/usa/new-york.md', 'New York is huge'))
  .then(() => FS.makeTree('city/france'))
  .then(() => FS.write('city/france/paris.md', 'Olala'))

  // Existance of files
  .then(() => FS.exists('city'))
  .then((exists) => console.log('Directory city exists?', exists))

  .then(() => FS.exists('something-else'))
  .then((exists) => console.log('Directory something-else exists?', exists))

  // Checking for directories
  .then(() => FS.isDirectory('city/germany'))
  .then((isDirectory) => console.log('Is `city/germany` a directory?', isDirectory))

  .then(() => FS.isDirectory('city/germany/darmstadt.md'))
  .then((isDirectory) => console.log('Is `city/germany/darmstadt.md` a directory?', isDirectory))

  .then(() => FS.isDirectory('city/germany/non-existing-file'))
  .then((isDirectory) => console.log('Is `city/germany/non-existing-file` a directory?', isDirectory))

  // Directory listings
  .then(() => FS.list('city'))
  .then((list) => console.log('Directory entries of city', list.sort()))

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
