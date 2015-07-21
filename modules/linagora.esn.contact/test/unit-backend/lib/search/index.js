'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The contacts search Module', function() {

  var deps = {
    pubsub: {
      local: {
      }
    },
    elasticsearch: {},
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

    it('should subscribe to contacts events', function() {

      var count = 0;
      deps.pubsub.local.topic = function() {
        count++;
        return {
          subscribe: function() {}
        };
      };

      var module = require('../../../../backend/lib/search')(dependencies);
      module.listen();
      expect(count).to.equal(3);
    });
  });

  describe('The indexContact function', function() {

    it('should send back error when contact is undefined', function(done) {
      var module = require('../../../../backend/lib/search')(dependencies);
      module.indexContact(null, this.helpers.callbacks.errorWithMessage(done, 'Contact is required'));
    });

    it('should call the elasticsearch module', function(done) {
      var contact = {id: '123', fn: 'Bruce'};
      var denormalized = {id: '123', fn: 'Bruce', fistName: 'Bruce'};

      deps.elasticsearch.addDocumentToIndex = function(document, options, callback) {
        expect(document).to.deep.equal(denormalized);
        expect(options).to.deep.equal({
          id: contact.id,
          type: 'contacts',
          index: 'contacts.idx'
        });
        return callback();
      };

      mockery.registerMock('./denormalize', function() {
        return denormalized;
      });

      var module = require('../../../../backend/lib/search')(dependencies);
      module.indexContact(contact, this.helpers.callbacks.noError(done));
    });
  });

  describe('The removeContactFromIndex function', function() {

    it('should send back error when contact is undefined', function(done) {
      var module = require('../../../../backend/lib/search')(dependencies);
      module.removeContactFromIndex(null, this.helpers.callbacks.errorWithMessage(done, 'Contact is required'));
    });

    it('should call the elasticsearch module', function(done) {
      var contact = {id: '123', firstName: 'Bruce'};

      deps.elasticsearch.removeDocumentFromIndex = function(options, callback) {
        expect(options).to.deep.equal({
          id: contact.id,
          type: 'contacts',
          index: 'contacts.idx'
        });
        return callback();
      };

      var module = require('../../../../backend/lib/search')(dependencies);
      module.removeContactFromIndex(contact, this.helpers.callbacks.noError(done));
    });
  });

  describe('The searchContacts function', function() {
    it('should call search.searchDocuments with right parameters', function(done) {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 100
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
        limit: 100
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
        limit: 100
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
