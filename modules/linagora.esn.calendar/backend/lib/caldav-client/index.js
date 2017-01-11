'use strict';

const request = require('request');
const urljoin = require('url-join');
const async = require('async');
const Q = require('q');

module.exports = function(dependencies) {
  const davserver = dependencies('davserver').utils;
  const token = dependencies('auth').token;

  return {
    getEvent,
    getEventPath,
    putEvent
  };

  function getEvent(userId, calendarURI, eventUID) {
    return _requestCaldav(userId, calendarURI, eventUID, (url, token) => ({
        method: 'GET',
        url: url,
        headers: {
          ESNToken: token
        }
      })
    );
  }

  function getEventPath(userId, calendarURI, eventUID) {
    return urljoin(userId, calendarURI, eventUID + '.ics');
  }

  function putEvent(userId, calendarURI, eventUID, jcal) {
    return _requestCaldav(userId, calendarURI, eventUID, (url, token) => ({
        method: 'PUT',
        url: url,
        headers: {
          ESNToken: token
        },
        body: jcal,
        json: true
      })
    );
  }

  function _buildEventUrl(userId, calendarURI, eventUID, callback) {
    davserver.getDavEndpoint(function(davserver) {
      return callback(urljoin(davserver, 'calendars', getEventPath(userId, calendarURI, eventUID)));
    });
  }

  function _requestCaldav(userId, calendarURI, eventUID, formatRequest) {
    const deferred = Q.defer();

    async.parallel([
        function(cb) {
          _buildEventUrl(userId, calendarURI, eventUID, function(url) {
            return cb(null, url);
          });
        },
        function(cb) {
          token.getNewToken({user: userId}, cb);
        }
      ],
      function(err, results) {
        if (err) {
          return deferred.reject(err);
        }
        request(formatRequest(results[0], results[1].token), function(err, response) {
          if (err || response.statusCode < 200 || response.statusCode >= 300) {
            return deferred.reject(err ? err.message : response.body);
          }

          return deferred.resolve(response.body);
        });
      });

    return deferred.promise;
  }
};
