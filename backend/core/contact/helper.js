'use strict';

var mongoose = require('mongoose');
var parseString = require('xml2js').parseString;
var async = require('async');
var Contact = mongoose.model('Contact');
var AddressBook = mongoose.model('AddressBook');


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
    emails: [entry['gd:email'][0].$.address],
    owner: user._id,
    addressbooks: [addressbook._id]
  };

  if (entry['gd:name']) {
    if (entry['gd:name'][0]['gd:givenName']) {
      contactJson.given_name = entry['gd:name'][0]['gd:givenName'][0];
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
module.exports.saveGoogleContacts = function(contactsXml, user, callback) {
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
};


