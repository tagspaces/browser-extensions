const sh = require('shelljs');
const packageJSON = require('../package.json');
const currentVersion = packageJSON.version;
// const path = require('path');

console.log('Patching with version: ' + currentVersion);
// "pack-chrome": "cd build/chrome && ",

sh.cd('build/chrome');
sh.exec('zip -r ../../../builds/tagspaces-chrome-' + currentVersion + '.zip .');
