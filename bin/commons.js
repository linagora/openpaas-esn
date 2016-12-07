'use strict';

var request = require('request'),
    ESConfiguration = require('esn-elasticsearch-configuration'),
    Path = require('path'),
    q = require('q'),
    fs = require('fs');

var readdir = q.denodeify(fs.readdir);

function log(level, message) {
  console.log('[CLI] ' + level + ' ' + message);
}

function logInfo(message) {
  log('INFO', message);
}

function logError(message) {
  log('ERROR', message);
}

module.exports.getDBOptions = function(host, port, dbName) {

  host = host || process.env.MONGO_HOST || 'localhost';
  port = port || +process.env.MONGO_PORT || 27017;
  dbName = dbName || process.env.MONGO_DBNAME || 'esn';

  return {connectionString: 'mongodb://' + host + ':' + port + '/' + dbName};
};

module.exports.getESConfiguration = function(host, port) {
  return new ESConfiguration({ host: host || 'localhost', port: port || 9200 });
};

function exit(code) {
  process.exit(code);
}
module.exports.exit = exit;

module.exports.runCommand = (name, command) => {
  return command().then(() => {
    logInfo(`Command "${name}" terminated successfully`);

    exit();
  }, err => {
    logError(`Command "${name}" returned an error: ${err}`);

    exit(1);
  });
};

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
  var ESN_ROOT = Path.resolve(__dirname, '../');
  var MODELS_ROOT = Path.resolve(ESN_ROOT, 'backend/core/db/mongo/models');

  return readdir(MODELS_ROOT).then(function(files) {
    files.forEach(function(filename) {
      var file = Path.resolve(MODELS_ROOT, filename);

      if (fs.statSync(file).isFile()) {
        require(file);
      }
    });
  });
};
