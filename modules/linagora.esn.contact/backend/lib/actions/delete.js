'use strict';

var q = require('q');
var request = require('request');

var CONFIG_KEY = 'davserver';
var DEFAULT_DAV_SERVER = 'http://localhost:80';

module.exports = function(dependencies) {

  var token = dependencies('auth').token;
  var logger = dependencies('logger');
  var esnConfig = dependencies('esn-config');

  function getTarget(callback) {
    esnConfig(CONFIG_KEY).get(function(err, data) {
      if (err) {
        return callback(null, DEFAULT_DAV_SERVER);
      }

      if (data && data.backend && data.backend.url) {
        return callback(null, data.backend.url);
      }
      return callback(null, DEFAULT_DAV_SERVER);
    });
  }

  return function(context, callback) {

    if (!context) {
      return callback(new Error('Context is required'));
    }

    var contactId = context.contactId;
    var bookId = context.bookId;
    var userId = context.userId;
    var delay = context.delay;

    logger.debug('Deleting contact %s on addressbook %s', contactId, bookId);

    var _getNewToken = q.denodeify(token.getNewToken);
    var _getTarget = q.denodeify(getTarget);

    q.spread([
      _getNewToken({ttl: delay * 2, user: userId}),
      _getTarget()
    ], function(t, target) {

      var authToken = t.token;

      request.del({
        url: target + '/addressbooks/' + bookId + '/contacts/' + contactId + '.vcf',
        headers: {
          'ESNToken': authToken
        }
      }, function(err, response, body) {
        if (err) {
          logger.error('Error while sending request to DAV server', err);
          return callback(new Error('Error while sending request to DAV server'));
        }

        if (response.statusCode !== 204) {
          logger.debug('Delete error from DAV server: HTTP %s', response.statusCode, body);
          return callback(new Error('Bad response from DAV server'));
        }

        callback();
      });
    }, function(err) {
      logger.error('Error while initializing request', err);
      return callback(err);
    });
  };
};
