var FS = require('../fs')

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
