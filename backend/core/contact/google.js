'use strict';

var mongoose = require('mongoose');
var parseString = require('xml2js').parseString;
var async = require('async');
var OAuth2Client = require('googleapis').OAuth2Client;
var Contact = mongoose.model('Contact');
var AddressBook = mongoose.model('AddressBook');
var https = require('https');
var esnConf = require('../esn-config');

var getGoogleConfiguration = function(done) {
  esnConf('oauth').get(function(err, data) {
    if (err) {
      return done(err);
    }

    if (!data || !data.google) {
      return done(new Error('Can not get google oauth configuration'));
    }
    return done(null, data.google);
  });
};
module.exports.getGoogleConfiguration = getGoogleConfiguration;

var getOrCreateGoogleAddressBook = function(user, callback) {
  var AddressBookName = 'Google Contacts';
  var addressbookJson = {name: AddressBookName, creator: user._id};
  AddressBook.findOneAndUpdate(addressbookJson, addressbookJson, {upsert: true}, function(err, ab) {
    if (err) {
      return callback(err);
    }
    return callback(null, ab);
  });
};

var createOrUpdateConctact = function(entry, user , addressbook, cb) {
  var contactQuery = {
    emails: entry['gd:email'][0].$.address,
    owner: user._id,
    addressbooks: addressbook._id
  };

  var contactJson = {
    owner: user._id,
    addressbooks: [addressbook._id]
  };

  if (entry['gd:email'] && entry['gd:email'].length > 0) {
    contactJson.emails = entry['gd:email'].map(function(mail) {
      if (mail && mail.$ && mail.$.address) {
        return mail.$.address;
      } else {
        return '';
      }
    }).filter(function(mail) {
      return mail && mail !== '';
    });
  }

  if (entry['gd:name']) {
    if (entry['gd:name'][0]['gd:givenName'] &&
      entry['gd:name'][0]['gd:givenName'].length > 0 &&
      entry['gd:name'][0]['gd:familyName'] &&
      entry['gd:name'][0]['gd:familyName'].length > 0) {
      contactJson.given_name = entry['gd:name'][0]['gd:givenName'][0] + ' ' + entry['gd:name'][0]['gd:familyName'][0];
    }
    else if (entry['gd:name'][0]['gd:fullName']) {
      contactJson.given_name = entry['gd:name'][0]['gd:fullName'][0];
    }
  }

  Contact.findOneAndUpdate(contactQuery, contactJson, {upsert: true}, function(err, contact) {
    if (err) {
      return cb(err);
    }
    cb();
  });
};

// See https://developers.google.com/gdata/docs/2.0/elements?csw=1#gdContactKind
// for the xml format of the incoming object
function saveGoogleContacts(contactsXml, user, callback) {
  if (!user || !contactsXml) {
    return callback('Missing parameters');
  }

  parseString(contactsXml, function(err, result) {
    if (err) {
      return callback(err);
    }

    getOrCreateGoogleAddressBook(user, function(err, addressbook) {
      if (err) {
        return callback(err);
      }

      var saveContact = function(entry, cb) {
        createOrUpdateConctact(entry, user, addressbook, cb);
      };

      async.each(result.feed.entry, saveContact, function(err) {
        if (err) {
          return callback(err);
        }
        callback();
      });
    });

  });
}
module.exports.saveGoogleContacts = saveGoogleContacts;

function getGoogleOAuthClient(baseUrl, callback) {
  getGoogleConfiguration(function(err, configuration) {
    if (err) {
      return callback(err);
    }
    if (!configuration) {
      return callback(new Error('Can not get google configuration'));
    }
    return callback(null, new OAuth2Client(configuration.client_id, configuration.client_secret, configuration.redirect_uri || baseUrl + '/api/contacts/google/callback'));
  });
}
module.exports.getGoogleOAuthClient = getGoogleOAuthClient;

module.exports.fetchAndSaveGoogleContacts = function(baseUrl, user, code, callback) {

  getGoogleOAuthClient(baseUrl, function(err, oauth2Client) {
    if (err) {
      err.step = 'get oauth client';
      return callback(err);
    }

    oauth2Client.getToken(code, function(err, tokens) {
      if (err) {
        err.step = 'get authentication token';
        return callback(err);
      }

      oauth2Client.setCredentials(tokens);
      var options = {
        host: 'www.google.com',
        port: 443,
        path: '/m8/feeds/contacts/default/full',
        headers: {
          'GData-Version': '3.0',
          'Authorization': 'Bearer ' + oauth2Client.credentials.access_token
        }
      };

      https.get(options, function(res) {
        var body = '';
        res.on('data', function(data) {
          body += data;
        });

        res.on('end', function() {
          saveGoogleContacts(body, user, function(err) {
            if (err) {
              err.step = 'save contacts';
              return callback(err);
            }
            return callback();
          });
        });

        res.on('error', function(err) {
          err.step = 'fetch contacts on Google server';
          return callback(err);
        });
      });
    });
  });
};
