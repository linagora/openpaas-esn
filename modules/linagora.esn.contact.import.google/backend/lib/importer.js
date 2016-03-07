'use strict';

var q = require('q');
var GOOGLE_CONTACT_URL = 'https://www.google.com/m8/feeds/contacts/default/full';
var GOOGLE_GDATA_VERSION = '3.0';
var MAX_CONTACT_PER_STACK = 50;
var request = require('request');
var refresh = require('passport-oauth2-refresh');
var parseString = require('xml2js').parseString;

module.exports = function(dependencies) {

  var googleContactToVcard = require('./mapping')(dependencies);
  var importContactClient = dependencies('contact-import').lib.import;
  var CONTACT_IMPORT_ERROR = dependencies('contact-import').constants.CONTACT_IMPORT_ERROR;
  var IMPORT_API_CLIENT_ERROR = CONTACT_IMPORT_ERROR.API_CLIENT_ERROR;

  function getRequestHeaders(options) {
    return {
      'GData-Version': GOOGLE_GDATA_VERSION,
      Authorization: 'Bearer ' + options.accessToken
    };
  }

  function googleAPIRequest(options, callback) {
    var startIndex = options.offset > 0 ? '&start-index=' + options.offset : '';
    var opt = {
      method: 'GET',
      url: [GOOGLE_CONTACT_URL, '?max-results=', MAX_CONTACT_PER_STACK, startIndex].join(''),
      headers: getRequestHeaders(options)
    };
    return request(opt, callback);
  }

  function getContactsPhoto(contact, requestOptions) {
    var defer = q.defer();
    contact.link.map(function(link) {
      if (link.$.type === 'image/*') {
        if (!link.$['gd:etag']) {
          defer.resolve(contact);
          return;
        }
        var getImageOption = {
          method: 'GET',
          url: link.$.href,
          headers: getRequestHeaders(requestOptions),
          encoding: null
        };

        request(getImageOption, function(err, response, body) {
          if (response.statusCode === 200) {
            contact.contactPhoto = 'data:image/png;base64,' + body.toString('base64');
          }
          defer.resolve(contact);
        });
      }
    });

    return defer.promise;
  }

  function importContactperStack(requestOptions, options, defer) {
    if (requestOptions.offset > 1 && requestOptions.offset > requestOptions.totalResults) {
      defer.notify({
        message: ['Import contacts finished:', requestOptions.totalResults, 'contacts imported'].join(' '),
        value: 100
      });
      defer.resolve();
    } else {
      googleAPIRequest(requestOptions, function(err, response, body) {
        if (response.statusCode < 200 || response.statusCode > 299) {
          defer.reject(importContactClient.buildErrorMessage(IMPORT_API_CLIENT_ERROR, err));
        } else {
          parseString(body, function(err, res) {
            if (err) {
              defer.reject(err);
            } else {
              defer.notify({
                message: 'Number of contacts imported ' + res.feed['openSearch:startIndex'][0],
                value: Math.round(res.feed['openSearch:startIndex'][0] * 100 / res.feed['openSearch:totalResults'][0])
              });
              requestOptions.totalResults = parseInt(res.feed['openSearch:totalResults'][0]);
              requestOptions.offset = parseInt(res.feed['openSearch:startIndex'][0]) + MAX_CONTACT_PER_STACK;

              q.all(res.feed.entry.map(function(value) {
                  return getContactsPhoto(value, requestOptions).then(function(contact) {
                    return importContactClient.createContact(googleContactToVcard.toVcard(contact), options);
                  });
                }
              )).then(function() {
                importContactperStack(requestOptions, options, defer);
              });
            }
          });
        }
      });
    }
  }

  function importContact(options) {
    var defer = q.defer();
    refresh.requestNewAccessToken('google-authz', options.account.data.refresh_token, function(err, accessToken) {
      if (err) {
        defer.reject(err);
      } else {
        var requestOptions = { accessToken: accessToken, offset: 0, totalResults: 0};
        importContactperStack(requestOptions, options, defer);
      }
    });
    return defer.promise;
  }

  return {
    importContact: importContact
  };
};
