const sh = require('shelljs');
const packageJSON = require('../package.json');
const currentVersion = packageJSON.version;
// const path = require('path');

console.log('Patching with version: ' + currentVersion);

// sh.cd('build/chrome')
sh.sed('-i', '0.0.0.0', currentVersion, 'build/chrome/manifest.json');
sh.sed('-i', '0.0.0.0', currentVersion, 'build/firefox/manifest.json');

