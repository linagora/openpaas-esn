'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');
var _ = require('lodash');

describe('The calendar search Module', function() {

  var deps = {
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

    it('should register a listener', function() {
      var register = sinon.spy();

      mockery.registerMock('./searchHandler', _.constant({register: register}));

      var module = require('../../../../backend/lib/search')(dependencies);

      module.listen();
      expect(register).to.have.been.calledOnce;
    });
  });

  describe('The indexEvent function', function() {

    it('should send back error when listener is not started', function(done) {
      var module = require('../../../../backend/lib/search')(dependencies);

      module.indexEvent({}, this.helpers.callbacks.errorWithMessage(done, 'Event search is not initialized'));
    });

    describe('When initialized', function() {

      it('should send back error when contact is undefined', function(done) {
        mockery.registerMock('./searchHandler', _.constant({register: _.constant({})}));
        var module = require('../../../../backend/lib/search')(dependencies);

        module.listen();
        module.indexEvent(null, this.helpers.callbacks.errorWithMessage(done, 'Event is required'));
      });

      it('should call the indexData handler', function(done) {
        var contact = {id: '123', firstName: 'Bruce'};
        var indexDataMock = sinon.spy(function(data, callback) {
          expect(data).to.deep.equal(contact);
          callback();
        });

        mockery.registerMock('./searchHandler', _.constant({register: _.constant({indexData: indexDataMock})}));

        var module = require('../../../../backend/lib/search')(dependencies);

        module.listen();
        module.indexEvent(contact, this.helpers.callbacks.noError(done));
      });
    });
  });

  describe('The removeEventFromIndex function', function() {

    it('should send back error when listener is not started', function(done) {
      var module = require('../../../../backend/lib/search')(dependencies);

      module.removeEventFromIndex({}, this.helpers.callbacks.errorWithMessage(done, 'Event search is not initialized'));
    });

    describe('When initialized', function() {

      it('should send back error when contact is undefined', function(done) {

        mockery.registerMock('./searchHandler', _.constant({register: _.constant({})}));
        var module = require('../../../../backend/lib/search')(dependencies);

        module.listen();
        module.removeEventFromIndex(null, this.helpers.callbacks.errorWithMessage(done, 'Event is required'));
      });

      it('should call the removeFromIndex handler', function(done) {
        var contact = {id: '123', firstName: 'Bruce'};

        function removeFromIndexMock(data, callback) {
          expect(data).to.deep.equal(contact);
          callback();
        }

        mockery.registerMock('./searchHandler', _.constant({register: _.constant({removeFromIndex: removeFromIndexMock})}));
        var module = require('../../../../backend/lib/search')(dependencies);

        module.listen();
        module.removeEventFromIndex(contact, this.helpers.callbacks.noError(done));
      });
    });
  });

  describe('The searchEvents function', function() {
    it('should call search.searchDocuments with right parameters', function() {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 100
      };

      deps.elasticsearch.searchDocuments = sinon.spy();

      var module = require('../../../../backend/lib/search')(dependencies);

      module.searchEvents(query);
      expect(deps.elasticsearch.searchDocuments).to.have.been.calledWith(sinon.match({
        index: 'events.idx',
        type: 'events',
        from: query.offset,
        size: query.limit
      }));
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

      module.searchEvents(query, this.helpers.callbacks.error(done));
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

      module.searchEvents(query, function(err, result) {
        expect(err).to.not.exist;
        expect(result.total_count).to.equal(total);
        expect(result.list).to.deep.equal(hits);
        done();
      });
    });
  });
});
