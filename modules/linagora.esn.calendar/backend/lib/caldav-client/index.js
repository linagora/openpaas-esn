'use strict';

var request = require('request');
var urljoin = require('url-join');
var async = require('async');
var q = require('q');
var davserver, token;

module.exports = function(dependencies) {
  davserver = dependencies('davserver').utils;
  token = dependencies('auth').token;

  function getEventPath(userId, calendarURI, eventUID) {
    return urljoin(userId, calendarURI, eventUID + '.ics');
  }

  function buildEventUrl(userId, calendarURI, eventUID, callback) {
    davserver.getDavEndpoint(function(davserver) {
      return callback(urljoin(davserver, 'calendars', getEventPath(userId, calendarURI, eventUID)));
    });
  }

  function getEvent(userId, calendarURI, eventUID) {
    var deferred = q.defer();
    async.parallel([
        function(cb) {
          buildEventUrl(userId, calendarURI, eventUID, function(url) {
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
        request({method: 'GET', url: results[0], headers: {ESNToken: results[1].token}}, function(err, response) {
          if (err || response.statusCode < 200 || response.statusCode >= 300) {
            return deferred.reject(err ? err.message : response.body);
          }
          return deferred.resolve(response.body);
        });
      });
    return deferred.promise;
  }

  return {
    getEvent: getEvent,
    getEventPath: getEventPath
  };
};
