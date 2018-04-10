'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('The contacts search Module', function() {

  var deps = {
    elasticsearch: {},
    pubsub: {
      local: {}
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

  describe('The listen function', function() {

    it('should register a listener and subscribe addressbook deleted event', function() {
      var register = sinon.stub();
      mockery.registerMock('./listener', function() {
        return {
          register: register
        };
      });

      deps.pubsub.local.topic = name => {
        expect(name).to.equal('contacts:addressbook:deleted');

        return { subscribe: () => {} };
      };

      var module = require('../../../../backend/lib/search')(dependencies);
      module.listen();
      expect(register).to.have.been.calledOnce;
    });
  });

  describe('The indexContact function', function() {

    it('should send back error when listener is not started', function(done) {
      var module = require('../../../../backend/lib/search')(dependencies);
      module.indexContact({}, this.helpers.callbacks.errorWithMessage(done, 'Contact search is not initialized'));
    });

    describe('When initialized', function() {

      it('should send back error when contact is undefined', function(done) {
        mockery.registerMock('./listener', function() {
          return {
            register: function() {
              return {};
            }
          };
        });
        var module = require('../../../../backend/lib/search')(dependencies);
        module.listen();
        module.indexContact(null, this.helpers.callbacks.errorWithMessage(done, 'Contact is required'));
      });

      it('should call the indexData handler', function(done) {
        var contact = {id: '123', firstName: 'Bruce'};
        mockery.registerMock('./listener', function() {
          return {
            register: function() {
              return {
                indexData: function(data, callback) {
                  expect(data).to.deep.equal(contact);
                  callback();
                }
              };
            }
          };
        });

        var module = require('../../../../backend/lib/search')(dependencies);
        module.listen();
        module.indexContact(contact, this.helpers.callbacks.noError(done));
      });
    });
  });

  describe('The removeContactFromIndex function', function() {

    it('should send back error when listener is not started', function(done) {
      var module = require('../../../../backend/lib/search')(dependencies);
      module.removeContactFromIndex({}, this.helpers.callbacks.errorWithMessage(done, 'Contact search is not initialized'));
    });

    describe('When initialized', function() {

      it('should send back error when contact is undefined', function(done) {
        mockery.registerMock('./listener', function() {
          return {
            register: function() {
              return {};
            }
          };
        });
        var module = require('../../../../backend/lib/search')(dependencies);
        module.listen();
        module.removeContactFromIndex(null, this.helpers.callbacks.errorWithMessage(done, 'Contact is required'));
      });

      it('should call the removeFromIndex handler', function(done) {
        var contact = {id: '123', firstName: 'Bruce'};
        mockery.registerMock('./listener', function() {
          return {
            register: function() {
              return {
                removeFromIndex: function(data, callback) {
                  expect(data).to.deep.equal(contact);
                  callback();
                }
              };
            }
          };
        });
        var module = require('../../../../backend/lib/search')(dependencies);
        module.listen();
        module.removeContactFromIndex(contact, this.helpers.callbacks.noError(done));
      });
    });
  });

  describe('The removeContactsOfAddressbook function', function() {
    it('should call elasticsearch.removeDocumentsByQuery with right parameters', function(done) {
      const addressbook = {
        userId: 'user-id',
        bookId: 'book-id',
        bookName: 'book-name'
      };
      const esQuery = {
        query: {
          bool: {
            must: [
              { match: { userId: addressbook.userId } },
              { match: { bookId: addressbook.bookId } },
              { match: { bookName: addressbook.bookName } }
            ]
          }
        }
      };

      deps.elasticsearch.removeDocumentsByQuery = query => {
        expect(query).to.deep.equal({
          index: 'contacts.idx',
          type: 'contacts',
          body: esQuery
        });
        done();
      };

      const module = require('../../../../backend/lib/search')(dependencies);
      module.removeContactsOfAddressbook(addressbook, done);
    });
  });

  describe('The searchContacts function', function() {
    it('should call search.searchDocuments with right parameters', function(done) {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 100,
        bookNames: ['collected', 'contacts']
      };

      deps.elasticsearch.searchDocuments = function(options) {
        expect(options).to.shallowDeepEqual({
          index: 'contacts.idx',
          type: 'contacts',
          from: query.offset,
          size: query.limit
        });
        done();
      };

      var module = require('../../../../backend/lib/search')(dependencies);
      module.searchContacts(query);
    });

    it('should send back error when search.searchDocuments fails', function(done) {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 100,
        bookNames: ['collected', 'contacts']
      };

      deps.elasticsearch.searchDocuments = function(options, callback) {
        return callback(new Error());
      };

      var module = require('../../../../backend/lib/search')(dependencies);
      module.searchContacts(query, this.helpers.callbacks.error(done));
    });

    it('should send back result when search.searchDocuments is successful', function(done) {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 100,
        bookNames: ['collected', 'contacts']
      };
      var total = 10;
      var hits = [{_id: 1}, {_id: 2}];

      deps.elasticsearch.searchDocuments = function(options, callback) {
        return callback(null, {
          hits: {
            total: total,
            hits: hits
          }
        });
      };

      var module = require('../../../../backend/lib/search')(dependencies);
      module.searchContacts(query, function(err, result) {
        expect(err).to.not.exist;
        expect(result.total_count).to.equal(total);
        expect(result.list).to.deep.equal(hits);
        done();
      });
    });
  });
});
