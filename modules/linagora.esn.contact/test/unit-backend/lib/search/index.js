'use strict';

var expect = require('chai').expect;

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
      var contact = {id: '123', firstName: 'Bruce'};

      deps.elasticsearch.addDocumentToIndex = function(document, options, callback) {
        expect(document).to.deep.equal(contact);
        expect(options).to.deep.equal({
          id: contact.id,
          type: 'contacts',
          index: 'contacts.idx'
        });
        return callback();
      };

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
});
