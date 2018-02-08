'use strict';

/* eslint-disable no-console */

const q = require('q');
const fs = require('fs-extra');
const path = require('path');
const core = require('../../backend/core/');
const esnConfig = core['esn-config'];
const dataPath = path.resolve(__dirname + '/data');
const readdir = q.denodeify(fs.readdir);

module.exports = function() {
  console.log('[INFO] Injecting ESN configurations');

  return readdir(dataPath).then(moduleNames => {
    const promiseFuncs = moduleNames.map(moduleName =>
      () => injectModuleConfigurations(moduleName)
    );

    return runSeq(promiseFuncs);
  });
};

function injectModuleConfigurations(moduleName) {
  const modulePath = path.join(dataPath, moduleName);

  return readdir(modulePath)
    .then(files => {
      const promiseFuncs = files.map(function(filename) {
        const filePath = path.join(modulePath, filename);

        if (fs.statSync(filePath).isFile()) {
          return function() {
            const key = path.parse(filePath).name;
            const conf = require(filePath)();

            return _injectConf(moduleName, key, conf); // allways resolves
          };
        }
      }).filter(Boolean);

      return runSeq(promiseFuncs);
    });
}

function _injectConf(moduleName, key, conf) {
  return esnConfig(key)
    .inModule(moduleName)
    .store(conf)
    .then(() => {
      console.log('[INFO] Injected conf', `${moduleName}.${key}`);
      console.log(JSON.stringify(conf, null, 2));
    })
    .catch(err => {
      console.log('[ERROR] Error while storing ESN config', err);
    });
}

function runSeq(promiseFuncs) {
  return promiseFuncs.reduce(q.when, q()); // https://github.com/kriskowal/q#sequences
}
