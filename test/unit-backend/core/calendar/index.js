'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The calendar core module', function() {
  var localStub = {}, globalStub = {};

  var collaborationPermissionMock = {
    _write: true,
    canWrite: function(collaboration, user, callback) {
      return callback(null, this._write);
    }
  };
  var eventMessageMock = {
    _object: null,
    _err: null,
    save: function(object, callback) {
      return callback(this._err, this._object || object);
    }
  };
  var userMock = {
    _user: {},
    _err: null,
    get: function(id, callback) {
      return callback(this._err, this._user);
    }
  };
  var activityStreamHelperMock = {
    userMessageToTimelineEntry: function() {}
  };

  beforeEach(function() {
    // Reset mocks
    collaborationPermissionMock._write = true;
    eventMessageMock._err = null;
    eventMessageMock._object = null;
    userMock._user = {};
    userMock._err = null;

    // Register mocks and models
    mockery.registerMock('../../core/message/event', eventMessageMock);
    mockery.registerMock('../../core/collaboration/permission', collaborationPermissionMock);
    mockery.registerMock('../../core/activitystreams/helpers', activityStreamHelperMock);
    mockery.registerMock('../../core/user', userMock);
    this.helpers.mock.models({});

    // Set up pubsub
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
        collaboration: {},
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

    it('should return an error if data.collaboration is undefined', function(done) {
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
        collaboration: {},
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
        collaboration: {},
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
        collaboration: {},
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
        collaboration: {},
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
      collaborationPermissionMock._write = false;

      var user = {
        _id: '123',
        firstname: 'test'
      };
      var collaboration = {
        _id: '345',
        activity_stream: {
          uuid: '42'
        }
      };
      var data = {
        user: user,
        collaboration: collaboration,
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
      var collaboration = {
        _id: '345',
        activity_stream: {
          uuid: '42'
        }
      };
      var data = {
        user: user,
        collaboration: collaboration,
        event: {
          event_id: 'event id',
          type: 'created'
        }
      };

      eventMessageMock._object = {
        _id: '123123',
        objectType: 'event'
      };

      var module = require(this.testEnv.basePath + '/backend/core/calendar/index');
      module.dispatch(data, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result._id).to.equal('123123');
        expect(result.objectType).to.equal('event');
        done();
      });
    });
  });
});
