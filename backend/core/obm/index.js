'use strict';

var request = require('request');
var parseString = require('xml2js').parseString;
var esnconfig = require('../esn-config');
var CONFIG_ID = 'obm';

var routes = {
  login: '/login/doLogin'
};
module.exports.routes = routes;

function getConfig(callback) {
  return esnconfig(CONFIG_ID).get(callback);
}
module.exports.getConfig = getConfig;

function getSessionId(user, callback) {

  if (!user) {
    return callback(new Error('User is required'));
  }

  var login = user.emails[0];
  var password = 'password';
  var origin = 'origin';

  getConfig(function(err, config) {
    if (err) {
      return callback(err);
    }

    if (!config) {
      return callback(new Error('OBM config has not been found'));
    }

    var url = config.url || 'https://locahost:8888/obm-sync/services';
    url += routes.login;
    request(
      {
        method: 'POST',
        uri: url,
        form: {
          login: login,
          password: password,
          origin: origin
        },
        strictSSL: false
      },
      function(error, response, body) {
        if (error) {
          return callback(error);
        }
        if (response.statusCode === 200) {
          parseString(body, function(err, result) {
            if (err) {
              return callback(err);
            }
            if (!result || !result.token || !result.token.sid || result.token.sid.length === 0) {
              return callback();
            }
            return callback(null, result.token.sid[0]);
          });
        } else {
          return callback(new Error('Bad response from OBM ' + body));
        }
      }
    );
  });
}
module.exports.getSessionId = getSessionId;

function post(path, form, callback) {
  path = path || '/';

  getConfig(function(err, config) {
    if (err) {
      return callback(err);
    }

    if (!config) {
      return callback(new Error('OBM config has not been found'));
    }

    var url = config.url || 'https://locahost:8888/obm-sync/services';
    url += path;
    request(
      {
        method: 'POST',
        uri: url,
        strictSSL: false,
        form: form
      },
      function(error, response, body) {
        if (error) {
          return callback(error);
        }
        if (response.statusCode === 200) {
          parseString(body, function(err, result) {
            if (err) {
              return callback(err);
            }
            return callback(null, result);
          });
        } else {
          return callback(new Error('Bad response from OBM ' + body));
        }
      }
    );
  });
}
module.exports.post = post;
