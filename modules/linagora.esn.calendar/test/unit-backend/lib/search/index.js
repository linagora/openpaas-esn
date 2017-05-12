'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const _ = require('lodash');
const ObjectId = require('bson').ObjectId;

describe('The calendar search Module', function() {
  let pubsubListen, deps, dependencies;

  beforeEach(function() {
    deps = {
      elasticsearch: {},
      logger: {
        error: function() {},
        debug: function() {},
        info: function() {},
        warning: function() {}
      }
    };

    dependencies = function(name) {
      return deps[name];
    };
    pubsubListen = sinon.spy();
    mockery.registerMock('./pubsub', _.constant({listen: pubsubListen}));
  });

  describe('The listen function', function() {

    it('should register listeners', function() {
      var register = sinon.spy();

      mockery.registerMock('./searchHandler', _.constant({register: register}));

      var module = require('../../../../backend/lib/search')(dependencies);

      module.listen();
      expect(register).to.have.been.calledOnce;
      expect(pubsubListen).to.have.been.calledOnce;
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
    it('should call search.searchDocuments with right parameters using default parameters for unset ones', function() {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 100,
        userId: new ObjectId()
      };

      deps.elasticsearch.searchDocuments = sinon.spy();

      var module = require('../../../../backend/lib/search')(dependencies);
      var searchConstants = require('../../../../backend/lib/constants').SEARCH;
      var defaultSort = {};

      defaultSort[searchConstants.DEFAULT_SORT_KEY] = { order: searchConstants.DEFAULT_SORT_ORDER };

      module.searchEvents(query);
      expect(deps.elasticsearch.searchDocuments).to.have.been.calledWith(sinon.match({
        index: 'events.idx',
        type: 'events',
        from: query.offset,
        size: query.limit,
        body: {
          sort: defaultSort
        }
      }));
    });

    it('should be able to search document with limit = 0', function() {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 0,
        userId: new ObjectId()
      };

      deps.elasticsearch.searchDocuments = sinon.spy();

      var module = require('../../../../backend/lib/search')(dependencies);
      var searchConstants = require('../../../../backend/lib/constants').SEARCH;
      var defaultSort = {};

      defaultSort[searchConstants.DEFAULT_SORT_KEY] = { order: searchConstants.DEFAULT_SORT_ORDER };

      module.searchEvents(query);
      expect(deps.elasticsearch.searchDocuments).to.have.been.calledWith(sinon.match({
        index: 'events.idx',
        type: 'events',
        from: query.offset,
        size: 0,
        body: {
          sort: defaultSort
        }
      }));
    });

    it('should call search.searchDocuments with right parameters', function() {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 100,
        sortKey: 'sortKey',
        sortOrder: 'sortOrder',
        userId: new ObjectId()
      };

      deps.elasticsearch.searchDocuments = sinon.spy();

      var module = require('../../../../backend/lib/search')(dependencies);

      module.searchEvents(query);
      expect(deps.elasticsearch.searchDocuments).to.have.been.calledWith(sinon.match({
        index: 'events.idx',
        type: 'events',
        from: query.offset,
        size: query.limit,
        body: {
          sort: {
            sortKey: { order: 'sortOrder' }
          }
        }
      }));
    });

    it('should send back error when search.searchDocuments fails', function(done) {
      var query = {
        search: 'Bruce',
        offset: 10,
        limit: 100,
        userId: new ObjectId()
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
        limit: 100,
        userId: new ObjectId()
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
