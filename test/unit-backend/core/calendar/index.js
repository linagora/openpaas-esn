'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The calendar core module', function() {
  var eventMessageMock = {};
  var localStub = {}, globalStub = {};
  var communityPermissionMock = {};
  var activityStreamHelperMock = {};
  var userMock = {};
  var communityMock = {};

  function setupMock() {
    eventMessageMock.save = function(object, callback) {
      return callback(null, object);
    };

    communityPermissionMock.canWrite = function(community, user, callback) {
      return callback(null, true);
    };

    activityStreamHelperMock.userMessageToTimelineEntry = function() {};

    userMock.get = function(id, callback) {
      return callback(null, {});
    };

    communityMock.load = function(id, callback) {
      return callback(null, {});
    };
  }

  beforeEach(function() {
    setupMock();
    mockery.registerMock('../../core/message/event', eventMessageMock);
    mockery.registerMock('../../core/community/permission', communityPermissionMock);
    mockery.registerMock('../../core/activitystreams/helpers', activityStreamHelperMock);
    mockery.registerMock('../../core/user', userMock);
    mockery.registerMock('../../core/community', communityMock);

    localStub = {};
    globalStub = {};
    this.helpers.mock.pubsub('../../core/pubsub', localStub, globalStub);
  });

  describe('The dispatch fn', function() {
    it('should return an error if data is undefined', function(done) {
      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(null, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data is not an object', function(done) {
      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch('test', function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data.user is undefined', function(done) {
      var data = {
        community: {},
        event: {
          event_id: '',
          type: ''
        }
      };

      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(data, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data.community is undefined', function(done) {
      var data = {
        user: {},
        event: {
          event_id: '',
          type: ''
        }
      };

      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(data, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data.event is an object', function(done) {
      var data = {
        user: {},
        community: {},
        event: 'test'
      };

      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(data, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data.event.event_id is undefined', function(done) {
      var data = {
        user: {},
        community: {},
        event: {
          type: ''
        }
      };

      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(data, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data.event.type is undefined', function(done) {
      var data = {
        user: {},
        community: {},
        event: {
          event_id: ''
        }
      };

      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(data, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data.event.type is not "created"', function(done) {
      var data = {
        user: {},
        community: {},
        event: {
          event_id: '123',
          type: 'test'
        }
      };

      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(data, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return false if the user does not have write permission', function(done) {
      communityPermissionMock.canWrite = function(community, user, callback) {
        return callback(null, false);
      };

      var user = {
        _id: '123',
        firstname: 'test'
      };
      var community = {
        _id: '345',
        activity_stream: {
          uuid: '42'
        }
      };
      var data = {
        user: user,
        community: community,
        event: {
          event_id: 'event id',
          type: 'created'
        }
      };

      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(data, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should call the create function', function(done) {
      var user = {
        _id: '123',
        firstname: 'test'
      };
      var community = {
        _id: '345',
        activity_stream: {
          uuid: '42'
        }
      };
      var data = {
        user: user,
        community: community,
        event: {
          event_id: 'event id',
          type: 'created'
        }
      };

      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(data, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.type).to.equal('created');
        expect(result.saved).to.exist;
        done();
      });
    });
  });
});
