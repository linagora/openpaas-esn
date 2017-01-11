'use strict';

const request = require('request');
const ESConfiguration = require('esn-elasticsearch-configuration');
const path = require('path');
const q = require('q');
const fs = require('fs');

const readdir = q.denodeify(fs.readdir);

function log(level, ...message) {
  console.log('[CLI]', level, ...message);
}

function logInfo(...message) {
  log('INFO', ...message);
}

function logError(...message) {
  log('ERROR', ...message);
}

module.exports.getDBOptions = function() {
  const dbConfigFilePath = path.normalize(__dirname + '/../config/db.json');
  const dbConfig = fs.readFileSync(dbConfigFilePath, 'utf8');

  return JSON.parse(dbConfig);
};

module.exports.getESConfiguration = function(host, port) {
  return new ESConfiguration({ host: host || 'localhost', port: port || 9200 });
};

function exit(code) {
  process.exit(code);
}
module.exports.exit = exit;

module.exports.runCommand = (name, command) => command().then(() => {
  logInfo(`Command "${name}" terminated successfully`);

  exit();
}, err => {
  logError(`Command "${name}" returned an error: ${err}`);

  exit(1);
});

module.exports.loginAsUser = function(baseUrl, email, password, done) {
  request({
    uri: baseUrl + '/api/login',
    method: 'POST',
    jar: true,
    json: true,
    body: {username: email, password: password, rememberme: false}
  }, function(err, resp, body) {
    if (err) {
      return done(err);
    }
    if (resp.statusCode !== 200) {
      return done(new Error('Can not auth user', body));
    }

    return done(null, body);
  });
};

module.exports.logInfo = logInfo;
module.exports.logError = logError;

module.exports.loadMongooseModels = function loadMongooseModels() {
  var ESN_ROOT = path.resolve(__dirname, '../');
  var MODELS_ROOT = path.resolve(ESN_ROOT, 'backend/core/db/mongo/models');

  return readdir(MODELS_ROOT).then(function(files) {
    files.forEach(function(filename) {
      var file = path.resolve(MODELS_ROOT, filename);

      if (fs.statSync(file).isFile()) {
        require(file);
      }
    });
  });
};
