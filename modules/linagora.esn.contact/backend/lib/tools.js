'use strict';

var q = require('q');

module.exports = function(dependencies) {
  var contactClient = require('./client')(dependencies);
  var searchClient = require('./search')(dependencies);
  var logger = dependencies('logger');
  var userModule = dependencies('user');

  function indexAddressbookUserContacts(addressBookHomeClient, book, userId) {
    var split = book._links.self.href.split('/');
    var bookName = split.pop().split('.').shift();
    var bookId = split.pop();
    var query = { userId: userId };
    return addressBookHomeClient
      .addressbook(bookName)
      .vcard()
      .list(query)
      .then(function(data) {
        var body = data.body;
        return q.all(body._embedded['dav:item'].map(function(davItem) {
          var contactId = davItem._links.self.href.split('/').pop().replace('.vcf', '');
          var contact = {
            id: contactId,
            contactId: contactId,
            bookId: bookId,
            user: { _id: userId },
            bookName: bookName,
            vcard: davItem.data
          };
          return searchClient.indexContact(contact, function(err) {
            if (err) {
              logger.error('Error while updating contact index', err);
              return q.reject(err);
            }
            return q.resolve();
          });
        }));
      });
  }

  function indexUserContacts(addressBookHomeClient, userId) {
    return addressBookHomeClient
      .addressbook()
      .list()
      .then(function(data) {
        return q.all(data.body._embedded['dav:addressbook'].map(function(book) {
          return indexAddressbookUserContacts(addressBookHomeClient, book, userId);
        }));
      });
  }

  function reIndexContacts(options) {
    return q.nfbind(userModule.list)().then(function(users) {
      return q.all(users.map(function(user) {
          var userId = user._id + '';
          var addressBookHomeClient = contactClient(options).addressbookHome(userId);
          return indexUserContacts(addressBookHomeClient, userId);
        })
      );
    });
  }

  return {
    reIndexContacts: reIndexContacts
  };
};

