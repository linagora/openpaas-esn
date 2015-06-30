'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');

describe('The calendar core module', function() {

  var collaborationMock;
  var eventMessageMock;
  var userMock;
  var activityStreamHelperMock;
  var helpersMock;
  var pubsubMock;
  var contentSenderMock;

  function initMock() {
    collaborationMock = {
      permission: {
        _write: true,
        canWrite: function(collaboration, user, callback) {
          return callback(null, this._write);
        }
      }
    };
    eventMessageMock = function() {
      return {};
    };
    userMock = {
      _user: {},
      _err: null,
      get: function(id, callback) {
        return callback(this._err, this._user);
      },
      findByEmail: function(email, callback) {
        return callback(this._err, this._user);
      }
    };
    activityStreamHelperMock = {
      helpers: {
        userMessageToTimelineEntry: function() {
        }
      }
    };
    helpersMock = {
      message: {
        messageSharesToTimelineTarget: function() {}
      },
      array: {
        isNullOrEmpty: function(array) {
          return (!Array.isArray(array) || array.length === 0);
        }
      }
    };
    pubsubMock = {
      local: {
        topic: function() {
          return {
            forward: function() {}
          };
        }
      },
      global: {}
    };
    contentSenderMock = {
      send: function(from, to, content, options, type) {
        return q();
      }
    };
  }

  beforeEach(function() {
    initMock();
    mockery.registerMock('../../../lib/jcal/jcal2content', function() {});
    mockery.registerMock('./../../../lib/message/eventmessage.core', eventMessageMock);
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
    this.moduleHelpers.addDep('user', userMock);
    this.moduleHelpers.addDep('collaboration', collaborationMock);
    this.moduleHelpers.addDep('activitystreams', activityStreamHelperMock);
    this.moduleHelpers.addDep('helpers', helpersMock);
    this.moduleHelpers.addDep('pubsub', pubsubMock);
    this.moduleHelpers.addDep('content-sender', contentSenderMock);
  });

  describe('The dispatch fn', function() {
    it('should return an error if data is undefined', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.dispatch(null, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data is not an object', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
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

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.dispatch(data, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result._id).to.equal('123123');
        expect(result.objectType).to.equal('event');
        done();
      });
    });
  });

  describe('The inviteAttendees fn', function() {
    it('should return with success if notify is false', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.inviteAttendees({}, ['foo@bar.com'], false, 'REQUEST', 'ICS', this.helpers.callbacks.noError(done));
    });

    it('should return an error if organizer is undefined', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.inviteAttendees(null, ['foo@bar.com'], true, 'REQUEST', 'ICS', this.helpers.callbacks.error(done));
    });

    it('should return an error if attendeeEmails is not an array', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.inviteAttendees({}, {}, true, 'REQUEST', 'ICS', this.helpers.callbacks.error(done));
    });

    it('should return an error if attendeeEmails is an empty array', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.inviteAttendees({}, [], true, 'REQUEST', 'ICS', this.helpers.callbacks.error(done));
    });

    it('should return an error if method is undefined', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.inviteAttendees({}, ['foo@bar.com'], true, null, 'ICS', this.helpers.callbacks.error(done));
    });

    it('should return an error if ics is undefined', function(done) {
      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.inviteAttendees({}, ['foo@bar.com'], true, 'REQUEST', null, this.helpers.callbacks.error(done));
    });

    it('should return an error if findByEmail return an error', function(done) {
      var organizer = {
        firstname: 'organizerFirstname',
        lastname: 'organizerLastname',
        emails: [
          'organizer@open-paas.org'
        ]
      };
      var attendee1 = {
        firstname: 'attendee1Firstname',
        lastname: 'attendee1Lastname',
        emails: [
          'attendee1@open-paas.org'
        ]
      };
      var attendee2 = {
        firstname: 'attendee2Firstname',
        lastname: 'attendee2Lastname',
        emails: [
          'attendee2@open-paas.org'
        ]
      };
      var attendeeEmails = [attendee1.emails[0], attendee2.emails[0]];
      var method = 'REQUEST';
      var ics = 'ICS';

      userMock.findByEmail = function(email, callback) {
        return callback(new Error('Error in findByEmail'));
      };

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.inviteAttendees(organizer, attendeeEmails, true, method, ics, this.helpers.callbacks.error(done));
    });

    it('should return an error if contentSender.send return an error', function(done) {
      var organizer = {
        firstname: 'organizerFirstname',
        lastname: 'organizerLastname',
        emails: [
          'organizer@open-paas.org'
        ]
      };
      var attendee1 = {
        firstname: 'attendee1Firstname',
        lastname: 'attendee1Lastname',
        emails: [
          'attendee1@open-paas.org'
        ]
      };
      var attendee2 = {
        firstname: 'attendee2Firstname',
        lastname: 'attendee2Lastname',
        emails: [
          'attendee2@open-paas.org'
        ]
      };
      var attendeeEmails = [attendee1.emails[0], attendee2.emails[0]];
      var method = 'REQUEST';
      var ics = 'ICS';

      userMock.findByEmail = function(email, callback) {
        if (email === attendee1.emails[0]) {
          return callback(null, attendee1);
        } else {
          return callback(null, attendee2);
        }
      };

      contentSenderMock.send = function(from, to, content, options, type) {
        return q.reject(new Error('Error in contentSender.send'));
      };

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.inviteAttendees(organizer, attendeeEmails, true, method, ics, this.helpers.callbacks.error(done));
    });

    it('should call content-sender.send with correct parameters', function(done) {
      var organizer = {
        firstname: 'organizerFirstname',
        lastname: 'organizerLastname',
        emails: [
          'organizer@open-paas.org'
        ]
      };
      var attendee1 = {
        firstname: 'attendee1Firstname',
        lastname: 'attendee1Lastname',
        emails: [
          'attendee1@open-paas.org'
        ]
      };
      var attendee2 = {
        firstname: 'attendee2Firstname',
        lastname: 'attendee2Lastname',
        emails: [
          'attendee2@open-paas.org'
        ]
      };
      var attendeeEmails = [attendee1.emails[0], attendee2.emails[0]];
      var method = 'REQUEST';
      var ics = 'ICS';

      userMock.findByEmail = function(email, callback) {
        if (email === attendee1.emails[0]) {
          return callback(null, attendee1);
        } else {
          return callback(null, attendee2);
        }
      };

      var called = 0;
      contentSenderMock.send = function(from, to, content, options, type) {
        called++;
        expect(type).to.equal('email');
        expect(from).to.deep.equal({objectType: 'email', id: organizer.emails[0]});
        if (called === 1) {
          expect(to).to.deep.equal({objectType: 'email', id: attendee1.emails[0]});
        } else {
          expect(to).to.deep.equal({objectType: 'email', id: attendee2.emails[0]});
        }
        var expectedOptions = {
          template: 'event.invitation',
          message: {
            subject: 'New event from ' + organizer.firstname + ' ' + organizer.lastname,
            alternatives: [{
              content: ics,
              contentType: 'text/calendar; charset=UTF-8; method=' + method,
              contentEncoding: 'base64'
            }],
            attachments: [{
              filename: 'invite.ics',
              content: ics,
              contentType: 'application/ics'
            }]
          }
        };
        expect(options).to.deep.equal(expectedOptions);
        return q();
      };

      var module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      module.inviteAttendees(organizer, attendeeEmails, true, method, ics, function(err) {
        expect(err).to.not.exist;
        expect(called).to.equal(2);
        done();
      });
    });
  });
});
