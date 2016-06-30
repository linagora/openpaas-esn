'use strict';

var request = require('request');

module.exports.getDBOptions = function(host, port, dbName) {

  host = host || 'localhost';
  port = port || 27017;
  dbName = dbName || 'esn';

  return {connectionString: 'mongodb://' + host + ':' + port + '/' + dbName};
};

module.exports.exit = function() {
  console.log('Done');
  process.exit();
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

function log(level, message) {
  console.log('[CLI] ' + level + ' ' + message);
}

module.exports.logInfo = function(message) {
  log('INFO', message);
};

module.exports.logError = function(message) {
  log('ERROR', message);
};
