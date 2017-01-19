'use strict';

var q = require('q');
var expect = require('chai').expect;
var mockery = require('mockery');

describe('The contacts tools Module', function() {
  var addressbookMock, addressbookHomeMock, contactClientMock;
  var addressbookListMock = {
    body: {
      _embedded: {
        'dav:addressbook': [{
          _links: {
            self: {
              href: '/esn-sabre/esn.php/addressbooks/5666b4cff5d672f316d4439f/contacts.json'
            }
          }
        }]
      }
    }
  };
  var vcardListMock = {
    body: {
      _embedded: {
        'dav:item': [{
          _links: {
            self: {
              href: '/esn-sabre/esn.php/addressbooks/5666b4cff5d672f316d4439f/my-contact.vcf'
            }
          },
          data: 'carddata'
        }]
      }
    }
  };
  var usersMock = [
    { _id: 1, id: '1'},
    { _id: 2, id: '2'},
    { _id: 3, id: '3'}
    ];
  var searchClientMock = {
    indexContact: function() {}
  };
  var deps = {
    user: {
      list: function() {}
    },
    logger: {
      error: function() {},
      debug: function() {},
      info: function() {},
      warning: function() {}
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  function getModule() {
    return require('../../../backend/lib/tools')(dependencies);
  }

  describe('The reIndexContacts function', function() {

    beforeEach(function() {
      addressbookMock = function() {
        return {
          list: function() {},
          vcard: function() {
            return {
              list: function() {}
            };
          }
        };
      };
      addressbookHomeMock = function() {
        return {
          addressbook: addressbookMock
        };
      };
      contactClientMock = function() {
        return {
          addressbookHome: addressbookHomeMock
        };
      };
      mockery.registerMock('./client', function() {
        return contactClientMock;
      });
      mockery.registerMock('./search', function() {
        return searchClientMock;
      });

      deps.user.list = function(callback) { return callback(null, [{ _id: 1, id: '1'}]); };
    });

    it('should list all users', function(done) {
      deps.user.list = function() { done(); };
      getModule().reIndexContacts();
    });

    it('should reject if can not list users', function(done) {
      deps.user.list = function(callback) { return callback(new Error()); };
      getModule().reIndexContacts().then(null, function() {
        done();
      });
    });

    it('should create contactClient with options', function(done) {
      var opt = 'options';
      contactClientMock = function(options) {
        expect(options).to.equal(opt);
        done();
      };
      getModule().reIndexContacts(opt);
    });

    it('should create contactClient for all user', function(done) {
      var userArray = [];
      deps.user.list = function(callback) { return callback(null, usersMock); };
      addressbookHomeMock = function(userId) {
        userArray.push(userId);
        return {
          addressbook: function() {
            return {
              list: q.reject
            };
          }
        };
      };
      getModule().reIndexContacts().then(null, function() {
        expect(userArray).to.deep.equal(['1', '2', '3']);
        done();
      });
    });

    it('should list all addressbook of users', function(done) {
      var called = 0;
      deps.user.list = function(callback) { return callback(null, usersMock); };
      addressbookMock = function() {
        return {
          list: function() {
            called++;
            return q.reject();
          }
        };
      };
      getModule().reIndexContacts().then(null, function() {
        expect(called).to.equal(3);
        done();
      });
    });

    it('should reject if can not list addressbook ', function(done) {
      deps.user.list = function(callback) { return callback(null, usersMock); };
      addressbookMock = function() {
        return {
          list: function() {
            return q.reject();
          }
        };
      };
      getModule().reIndexContacts().then(null, function() {
        done();
      });
    });

    it('should list all vcard in addressbook of users', function(done) {
      var book;
      addressbookMock = function(bookName) {
        book = bookName;
        return {
          list: function() {
            return q.resolve(addressbookListMock);
          },
          vcard: function() {
            return {
              list: function() {
                expect(book).to.equal('contacts');
                done();
              }
            };
          }
        };
      };
      getModule().reIndexContacts();
    });

    it('should reject if can not list vcard in addressbook', function(done) {
      addressbookMock = function() {
        return {
          list: function() {
            return q.resolve(addressbookListMock);
          },
          vcard: function() {
            return {
              list: function() {
                return q.reject();
              }
            };
          }
        };
      };
      getModule().reIndexContacts().then(null, done);
    });

    it('should index all vcard from addressbook of users', function(done) {
      addressbookMock = function() {
        return {
          list: function() {
            return q.resolve(addressbookListMock);
          },
          vcard: function() {
            return {
              list: function() {
                return q.resolve(vcardListMock);
              }
            };
          }
        };
      };
      searchClientMock.indexContact = function(contact) {
        var contactIndexed = {
          id: 'my-contact',
          contactId: 'my-contact',
          bookId: '5666b4cff5d672f316d4439f',
          user: { _id: '1' },
          bookName: 'contacts',
          vcard: 'carddata'
        };
        expect(contact).to.deep.equal(contactIndexed);
        done();
      };
      getModule().reIndexContacts();
    });

    it('should reject if index vcard error', function(done) {
      addressbookMock = function() {
        return {
          list: function() {
            return q.resolve(addressbookListMock);
          },
          vcard: function() {
            return {
              list: function() {
                return q.resolve(vcardListMock);
              }
            };
          }
        };
      };
      searchClientMock.indexContact = function(contact, callback) { return callback(new Error()); };
      getModule().reIndexContacts().then(null, function() {
        done();
      });
    });

    it('should resolve after index all cards', function() {
      var contactIndexed = 0;
      deps.user.list = function(callback) { return callback(null, usersMock); };
      addressbookMock = function() {
        return {
          list: function() {
            return q.resolve(addressbookListMock);
          },
          vcard: function() {
            return {
              list: function() {
                return q.resolve(vcardListMock);
              }
            };
          }
        };
      };
      searchClientMock.indexContact = function(contact, callback) {
        contactIndexed++;
        return callback(null);
      };
      return getModule().reIndexContacts().then(function() {
        expect(contactIndexed).to.equal(3);
      });
    });

  });
});
