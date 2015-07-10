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
      module.indexContact(null, function(err) {
        expect(err.message).to.match(/Contact is required/);
        done();
      });
    });

    it('should call the elasticsearch module', function(done) {
      var contact = {id: '123', firstName: 'Bruce'};

      deps.elasticsearch.addDocumentToIndex = function(document, options, callback) {
        expect(document).to.deep.equal(contact);
        expect(options.id).to.equal(contact.id);
        expect(options.type).to.equal('contacts');
        expect(options.index).to.equal('contacts.idx');
        return callback();
      };

      var module = require('../../../../backend/lib/search')(dependencies);
      module.indexContact(contact, function(err) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  describe('The removeContactFromIndex function', function() {

    it('should send back error when contact is undefined', function(done) {
      var module = require('../../../../backend/lib/search')(dependencies);
      module.removeContactFromIndex(null, function(err) {
        expect(err.message).to.match(/Contact is required/);
        done();
      });
    });

    it('should call the elasticsearch module', function(done) {
      var contact = {id: '123', firstName: 'Bruce'};

      deps.elasticsearch.removeDocumentFromIndex = function(options, callback) {
        expect(options.id).to.equal(contact.id);
        expect(options.type).to.equal('contacts');
        expect(options.index).to.equal('contacts.idx');
        return callback();
      };

      var module = require('../../../../backend/lib/search')(dependencies);
      module.removeContactFromIndex(contact, function(err) {
        expect(err).to.not.exist;
        done();
      });
    });
  });
});
