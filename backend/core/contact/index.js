'use strict';

var mongoose = require('mongoose');
var Contact = mongoose.model('Contact');

var defaultLimit = 50;
var defaultOffset = 0;

/*
* List/search contacts.
*
* options:
*   owner: ObjectId (required) ID of the owner of the contacts
*   addressbook: [ObjectId] (optional) array of ids of addressbooks the contacts should belong to
*   query: String|Array (optional) the search string or strings. Will be matched against fistname, emails and given_name
*   limit: Number (optional) the maximum number of results to send back
*   offset: Number (optional) the number of results to skip
*/
function list(options, callback) {
  var contactsQuery = null;
  if (options.addressbooks_id) {
    contactsQuery = Contact.find().where({owner: options.owner, addressbooks: options.addressbooks});
  } else {
    contactsQuery = Contact.find().where({owner: options.owner});
  }

  if (options.query) {
    var terms = (options.query instanceof Array) ? options.query : options.query.split(' ');

    if (terms.length > 1) {
      var given_name = [];
      var emails = [];

      for (var i = 0; i < terms.length; i++) {
        var term = terms[i];
        given_name.push({firstname: new RegExp(term, 'i')});
        emails.push({emails: new RegExp(term, 'i')});
      }
      contactsQuery.or([{$and: given_name}, {$and: emails}]);
    } else {
      contactsQuery.or([{given_name: new RegExp(terms[0], 'i')}, {emails: new RegExp(terms[0], 'i')}]);
    }
  }

  var totalCountQuery = require('extend')(true, {}, contactsQuery);
  totalCountQuery.count();

  contactsQuery.skip(options.offset || defaultOffset).limit(options.limit || defaultLimit).sort({'given_name' : 'asc'});

  return totalCountQuery.exec(function(err, count) {
    if (err) {
      err.queryType = 'count';
      return callback(err);
    }
    contactsQuery.exec(function(err, list) {
      if (err) {
        err.queryType = 'resultset';
        return callback(err);
      }
      return callback(null, {count: count, items: list});
    });
  });
}

exports.list = list;
