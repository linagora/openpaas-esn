'use strict';

const request = require('request');
const ESConfiguration = require('esn-elasticsearch-configuration');
const path = require('path');
const q = require('q');
const fs = require('fs');
const httpClient = require('./httpClient');

const readdir = q.denodeify(fs.readdir);

module.exports = {
  httpClient,
  logInfo,
  logError,
  getDBOptions,
  getESConfiguration,
  exit,
  runCommand,
  loginAsUser,
  loadMongooseModels
};

function log(level, ...message) {
  console.log('[CLI]', level, ...message);
}

function logInfo(...message) {
  log('INFO', ...message);
}

function logError(...message) {
  log('ERROR', ...message);
}

function getDBOptions() {
  const dbConfigFilePath = path.normalize(__dirname + '/../config/db.json');
  const dbConfig = fs.readFileSync(dbConfigFilePath, 'utf8');

  return JSON.parse(dbConfig);
}

function getESConfiguration(host, port) {
  return new ESConfiguration({ host: host || 'localhost', port: port || 9200 });
}

function exit(code) {
  process.exit(code); // eslint-disable-line no-process-exit
}

function runCommand(name, command) {
  return command().then(() => {
    logInfo(`Command "${name}" terminated successfully`);

    exit();
  }, err => {
    logError(`Command "${name}" returned an error: ${err}`);

    exit(1);
  });
}

function loginAsUser(baseUrl, email, password, done) {
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
}

function loadMongooseModels() {
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
}
