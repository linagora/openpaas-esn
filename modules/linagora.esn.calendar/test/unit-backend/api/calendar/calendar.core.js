'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The calendar core module', function() {

  var collaborationMock = {
    permission: {
      _write: true,
      canWrite: function(collaboration, user, callback) {
        return callback(null, this._write);
      }
    }
  };
  var eventMessageMock = function() {
    return {};
  };
  var userMock = {
    _user: {},
    _err: null,
    get: function(id, callback) {
      return callback(this._err, this._user);
    }
  };
  var activityStreamHelperMock = {
    helpers: {
      userMessageToTimelineEntry: function() {
      }
    }
  };
  var helpersMock = {
    message: {
      messageSharesToTimelineTarget: function() {}
    }
  };
  var pubsubMock = {
    local: {
      topic: function() {
        return {
          forward: function() {}
        };
      }
    },
    global: {}
  };

  beforeEach(function() {
    mockery.registerMock('./../../../lib/message/eventmessage.core', eventMessageMock);
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
    this.moduleHelpers.addDep('user', userMock);
    this.moduleHelpers.addDep('collaboration', collaborationMock);
    this.moduleHelpers.addDep('activitystreams', activityStreamHelperMock);
    this.moduleHelpers.addDep('helpers', helpersMock);
    this.moduleHelpers.addDep('pubsub', pubsubMock);
  });

  describe('The dispatch fn', function() {
    it('should return an error if data is undefined', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
      module.dispatch(null, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data is not an object', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
      module.dispatch(data, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return false if the user does not have write permission', function(done) {
      collaborationMock.permission._write = false;
      this.moduleHelpers.addDep('collaboration', collaborationMock);

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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
      module.dispatch(data, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result).to.be.false;
        done();
      });
    });

    it('should call the create function', function(done) {
      collaborationMock.permission._write = true;
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

      eventMessageMock = function() {
        return {
          _object: {
            _id: '123123',
            objectType: 'event',
            shares: [{
              _id: '890890',
              objectType: 'activitystream',
              id: collaboration.activity_stream.uuid
            }]
          },
          save: function(message, callback) {
            callback(null, this._object);
          }
        };
      };
      mockery.registerMock('./../../../lib/message/eventmessage.core', eventMessageMock);

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/calendar.core')(this.moduleHelpers.dependencies);
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
