'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('The contacts search Module', function() {

  const deps = {
    elasticsearch: {
      reindexRegistry: {
        register: () => {}
      }
    },
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

  describe('The init function', function() {
    it('should register a listener and subscribe addressbook deleted event', function() {
      const register = sinon.stub();

      mockery.registerMock('./listener', function() {
        return {
          register
        };
      });
      mockery.registerMock('./reindex', () => ({}));

      deps.pubsub.local.topic = name => {
        expect(name).to.equal('contacts:addressbook:deleted');

        return { subscribe: () => {} };
      };

      const module = require('../../../../backend/lib/search')(dependencies);

      module.init();
      expect(register).to.have.been.calledOnce;
    });

    it('should register elasticsearch reindex options for contacts', function() {
      const buildReindexOptions = () => {};

      mockery.registerMock('./listener', () => ({ register: () => {} }));
      mockery.registerMock('./reindex', () => ({ buildReindexOptions }));

      deps.elasticsearch.reindexRegistry.register = sinon.spy();

      const module = require('../../../../backend/lib/search')(dependencies);

      module.init();
      expect(deps.elasticsearch.reindexRegistry.register).to.have.been.calledOnce;
      expect(deps.elasticsearch.reindexRegistry.register).to.have.been.calledWith(
        'contacts',
        {
          name: 'contacts.idx',
          buildReindexOptionsFunction: buildReindexOptions
        }
      );
    });
  });

  describe('The indexContact function', function() {
    beforeEach(function() {
      mockery.registerMock('./reindex', () => ({}));
    });

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
        module.init();
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
        module.init();
        module.indexContact(contact, this.helpers.callbacks.noError(done));
      });
    });
  });

  describe('The removeContactFromIndex function', function() {
    beforeEach(function() {
      mockery.registerMock('./reindex', () => ({}));
    });

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
        module.init();
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
        module.init();
        module.removeContactFromIndex(contact, this.helpers.callbacks.noError(done));
      });
    });
  });

  describe('The removeContactsOfAddressbook function', function() {
    beforeEach(function() {
      mockery.registerMock('./reindex', () => ({}));
    });

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
    beforeEach(function() {
      mockery.registerMock('./reindex', () => ({}));
    });

    it('should not call search.searchDocuments if there is no addressbooks is provided', function(done) {
      const query = {
        search: 'Bruce',
        offset: 10,
        limit: 100
      };

      deps.elasticsearch.searchDocuments = sinon.spy();
      const module = require('../../../../backend/lib/search')(dependencies);

      module.searchContacts(query, (err, result) => {
        expect(result).to.deep.equal({
          current_page: 1,
          total_count: 0,
          list: []
        });
        expect(deps.elasticsearch.searchDocuments).to.not.have.been.called;
        done();
      });
    });

    it('should not call search.searchDocuments if there is an empty list of addressbooks', function(done) {
      const query = {
        search: 'Bruce',
        offset: 10,
        limit: 100,
        addressooks: []
      };

      deps.elasticsearch.searchDocuments = sinon.spy();
      const module = require('../../../../backend/lib/search')(dependencies);

      module.searchContacts(query, (err, result) => {
        expect(result).to.deep.equal({
          current_page: 1,
          total_count: 0,
          list: []
        });
        expect(deps.elasticsearch.searchDocuments).to.not.have.been.called;
        done();
      });
    });

    it('should call search.searchDocuments with right parameters', function(done) {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 100,
        addressbooks: [{
          bookName: 'collected'
        }, {
          bookName: 'contacts'
        }]
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
        addressbooks: [{
          bookName: 'collected'
        }, {
          bookName: 'contacts'
        }]
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
        addressbooks: [{
          bookName: 'collected'
        }, {
          bookName: 'contacts'
        }]
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

    it('should search with must_not query when there are contact ids to be excluded', function(done) {
      const module = require('../../../../backend/lib/search')(dependencies);
      const query = {
        search: 'Bruce',
        offset: 10,
        limit: 100,
        addressbooks: [{
          bookName: 'collected'
        }, {
          bookName: 'contacts'
        }],
        excludeIds: ['contact1']
      };

      deps.elasticsearch.searchDocuments = sinon.spy((options, callback) => {
        expect(options.body.query.bool.must_not).to.shallowDeepEqual({
          terms: {
            _id: ['contact1']
          }
        });

        return callback(null, {
          hits: {
            total: 0,
            hits: 0
          }
        });
      });

      module.searchContacts(query, (err, result) => {
        expect(err).to.not.exist;
        expect(deps.elasticsearch.searchDocuments).to.have.been.calledOnce;
        expect(result).to.shallowDeepEqual({
          total_count: 0,
          list: 0
        });

        done();
      });
    });
  });
});
