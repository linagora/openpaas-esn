'use strict';

module.exports.init = function(dependencies) {
  var searchModule = require('../../../lib/search/index')(dependencies);
  var controller = require('./controller')(dependencies);
  var davServer = dependencies('davserver').utils;
  var authModule = dependencies('auth');

  var provider = {
    findByEmail: function(email, callback) {
      var query = {
        search: email
      };
      searchModule.searchContacts(query, function(err, result) {
        if (err) {
          return callback(err);
        }
        if (!result || result.total_count === 0) {
          return callback();
        }
        return callback(null, result.list[0]);
      });
    },
    getAvatar: function(contact, req, res) {
      authModule.token.getNewToken({user: contact._source.userId}, function(err, token) {
        if (err || !token) {
          return res.json(500, {error: {code: 500, message: 'Server Error', details: 'Can not generate token'}});
        }
        req.token = token;
        davServer.getDavEndpoint(function(davServerURL) {
          req.davserver = davServerURL;
          req.params.addressBookId = contact._source.bookId;
          req.params.contactId = contact._id;
          return controller.getAvatar(req, res);
        });
      });
    }
  };

  dependencies('avatar').registerProvider('contact', provider);
  return provider;
};
