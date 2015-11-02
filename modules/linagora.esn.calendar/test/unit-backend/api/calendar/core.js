'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');
var fs = require('fs');

describe('The calendar core module', function() {

  var collaborationMock;
  var eventMessageMock;
  var userMock;
  var activityStreamHelperMock;
  var helpersMock;
  var pubsubMock;
  var contentSenderMock;
  var configMock;
  var esnConfigMock;

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
    configMock = function() {
      return {
        webserver: {}
      };
    };
    esnConfigMock = function() {
      return {
        get: function(callback) {
          callback();
        }
      };
    };
  }

  beforeEach(function() {
    initMock();
    mockery.registerMock('./../../../lib/message/eventmessage.core', eventMessageMock);
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
    this.moduleHelpers.addDep('user', userMock);
    this.moduleHelpers.addDep('collaboration', collaborationMock);
    this.moduleHelpers.addDep('activitystreams', activityStreamHelperMock);
    this.moduleHelpers.addDep('helpers', helpersMock);
    this.moduleHelpers.addDep('pubsub', pubsubMock);
    this.moduleHelpers.addDep('content-sender', contentSenderMock);
    this.moduleHelpers.addDep('config', configMock);
    this.moduleHelpers.addDep('esn-config', esnConfigMock);
  });

  describe('The dispatch fn', function() {
    beforeEach(function() {
      this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
    });
    it('should return an error if data is undefined', function(done) {
      this.module.dispatch(null, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should return an error if data is not an object', function(done) {
      this.module.dispatch('test', function(err, result) {
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

      this.module.dispatch(data, function(err, result) {
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

      this.module.dispatch(data, function(err, result) {
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

      this.module.dispatch(data, function(err, result) {
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

      this.module.dispatch(data, function(err, result) {
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

      this.module.dispatch(data, function(err, result) {
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

      this.module.dispatch(data, function(err, result) {
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

      this.module.dispatch(data, function(err, result) {
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

      this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      this.module.dispatch(data, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result._id).to.equal('123123');
        expect(result.objectType).to.equal('event');
        done();
      });
    });
  });

  describe('The inviteAttendees', function() {

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

    var ics = ['BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:123123',
      'SUMMARY:description',
      'DTSTART:20150101T010101',
      'DTEND:20150101T020202',
      'ORGANIZER;CN="' + organizer.firstname + ' ' + organizer.lastname + '":mailto:' + organizer.emails[0],
      'ATTENDEE;CN="' + attendee1.firstname + ' ' + attendee1.lastname + '":mailto:' + attendee1.emails[0],
      'ATTENDEE;CN="' + attendee2.firstname + ' ' + attendee2.lastname + '":mailto:' + attendee2.emails[0],
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    describe('the inviteAttendees fn', function() {
      beforeEach(function() {
        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      });
      it('should return with success if notify is false', function(done) {
        this.module.inviteAttendees({}, ['foo@bar.com'], false, 'REQUEST', 'ICS', this.helpers.callbacks.noError(done));
      });

      it('should return an error if organizer is undefined', function(done) {
        this.module.inviteAttendees(null, ['foo@bar.com'], true, 'REQUEST', 'ICS', this.helpers.callbacks.error(done));
      });

      it('should return an error if attendeeEmails is not an array', function(done) {
        this.module.inviteAttendees({}, {}, true, 'REQUEST', 'ICS', this.helpers.callbacks.error(done));
      });

      it('should return an error if attendeeEmails is an empty array', function(done) {
        this.module.inviteAttendees({}, [], true, 'REQUEST', 'ICS', this.helpers.callbacks.error(done));
      });

      it('should return an error if method is undefined', function(done) {
        this.module.inviteAttendees({}, ['foo@bar.com'], true, null, 'ICS', this.helpers.callbacks.error(done));
      });

      it('should return an error if ics is undefined', function(done) {
        this.module.inviteAttendees({}, ['foo@bar.com'], true, 'REQUEST', null, this.helpers.callbacks.error(done));
      });

      it('should return an error if findByEmail return an error', function(done) {
        var method = 'REQUEST';

        userMock.findByEmail = function(email, callback) {
          return callback(new Error('Error in findByEmail'));
        };

        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, this.helpers.callbacks.error(done));
      });

      it('should return an error it cannot retrieve ', function(done) {
        var esnConfigMock = function() {
          return {
            get: function(callback) {
              callback(new Error('cannot get base_url'));
            }
          };
        };
        this.moduleHelpers.addDep('esn-config', esnConfigMock);

        var method = 'REQUEST';
        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, this.helpers.callbacks.error(done));
      });

      it('should return an error if contentSender.send return an error', function(done) {
        var method = 'REQUEST';

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

        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, this.helpers.callbacks.error(done));
      });

      it('should work even if findByEmail doesn\'t find the attendee', function(done) {
        var method = 'REQUEST';
        var called = 0;

        userMock.findByEmail = function(email, callback) {
          if (email === attendee1.emails[0]) {
            return callback(null, attendee1);
          } else {
            // Purposely not finding this attendee
            return callback(null, null);
          }
        };

        contentSenderMock.send = function(from, to, content, options, type) {
          called++;
          expect(type).to.equal('email');
          expect(from).to.deep.equal({objectType: 'email', id: organizer.emails[0]});
          if (called === 1) {
            expect(to).to.deep.equal({objectType: 'email', id: attendee1.emails[0]});
          } else {
            expect(to).to.deep.equal({objectType: 'email', id: attendee2.emails[0]});
          }
          return q();
        };

        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, function(err) {
          expect(err).to.not.exist;
          done();
        });
      });

      it('should call content-sender.send with correct parameters', function(done) {
        var configMock = function() {
          return {
            webserver: {
              port: 8888
            }
          };
        };
        var esnConfigMock = function() {
          return {
            get: function(callback) {
              callback();
            }
          };
        };
        this.moduleHelpers.addDep('config', configMock);
        this.moduleHelpers.addDep('esn-config', esnConfigMock);
        mockery.registerMock('../../../lib/jcal/jcalHelper', {
          jcal2content: function() {
            return {};
          }
        });
        var method = 'REQUEST';

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
              subject: 'New event from ' + organizer.firstname + ' ' + organizer.lastname + ': description',
              encoding: 'base64',
              alternatives: [{
                content: ics,
                contentType: 'text/calendar; charset=UTF-8; method=' + method
              }],
              attachments: [{
                filename: 'meeting.ics',
                content: ics,
                contentType: 'application/ics'
              }]
            },
            filter: function(filename) {}
          };
          expect(options).to.shallowDeepEqual(expectedOptions);
          expect(options.filter).is.a.function;
          expect(content.baseUrl).to.deep.equal('http://localhost:8888');
          return q();
        };

        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, function(err) {
          expect(err).to.not.exist;
          expect(called).to.equal(2);
          done();
        });
      });

      it('should get baseUrl from esnConfig', function(done) {
        var configMock = function() {
          return {
            webserver: {
              port: 8888
            }
          };
        };
        var esnConfigMock = function() {
          return {
            get: function(callback) {
              callback(null, {
                base_url: 'https://dev.open-paas.org'
              });
            }
          };
        };
        this.moduleHelpers.addDep('config', configMock);
        this.moduleHelpers.addDep('esn-config', esnConfigMock);
        mockery.registerMock('../../../lib/jcal/jcalHelper', {
          jcal2content: function() {
            return {};
          }
        });
        var attendeeEmails = [attendee1.emails[0]];
        var method = 'REQUEST';

        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        var called = 0;
        contentSenderMock.send = function(from, to, content, options, type) {
          called++;
          expect(content.baseUrl).to.deep.equal('https://dev.open-paas.org');
          return q();
        };

        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, function(err) {
          expect(err).to.not.exist;
          expect(called).to.equal(1);
          done();
        });
      });
    });

    describe('when method is REQUEST', function() {
      beforeEach(function() {
        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      });
      it('should call content-sender.send with new event subject and template if sequence is 0', function(done) {
        var method = 'REQUEST';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/request-new-event.ics', 'utf-8');

        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        contentSenderMock.send = function(from, to, content, options, type) {
          var expectedOptions = {
            template: 'event.invitation',
            message: {
              subject: 'New event from ' + organizer.firstname + ' ' + organizer.lastname + ': Démo OPENPAAS'
            }
          };
          expect(options).to.shallowDeepEqual(expectedOptions);
          return q();
        };

        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, function(err) {
          expect(err).to.not.exist;
          done();
        });
      });

      it('should call content-sender.send with event update subject and template if sequence > 0', function(done) {
        var method = 'REQUEST';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/request-event-update.ics', 'utf-8');

        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        contentSenderMock.send = function(from, to, content, options, type) {
          var expectedOptions = {
            template: 'event.update',
            message: {
              subject: 'Event Démo OPENPAAS from ' + organizer.firstname + ' ' + organizer.lastname + ' updated'
            }
          };
          expect(options).to.shallowDeepEqual(expectedOptions);
          return q();
        };

        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('when method is REPLY', function() {
      it('should call content-sender.send with reply event subject and template', function(done) {
        var method = 'REPLY';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/reply.ics', 'utf-8');

        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        contentSenderMock.send = function(from, to, content, options, type) {
          var expectedOptions = {
            template: 'event.reply',
            message: {
              subject: 'Participation updated: Démo OPENPAAS'
            }
          };
          expect(options).to.shallowDeepEqual(expectedOptions);
          return q();
        };

        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('when method is CANCEL', function() {
      it('should call content-sender.send with cancel event subject', function(done) {
        var method = 'CANCEL';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/cancel.ics', 'utf-8');

        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        contentSenderMock.send = function(from, to, content, options, type) {
          var expectedOptions = {
            template: 'event.cancel',
            message: {
              subject: 'Event Démo OPENPAAS from ' + organizer.firstname + ' ' + organizer.lastname + ' canceled'
            }
          };
          expect(options).to.shallowDeepEqual(expectedOptions);
          return q();
        };
        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('The filter method of the inviteAttendees fn', function() {
      beforeEach(function() {
        this.getFilter = function(event, callback) {
          var configMock = function() {
            return {
              webserver: {
                port: 8888
              }
            };
          };
          this.moduleHelpers.addDep('config', configMock);

          var esnConfigMock = function() {
            return {
              get: function(callback) {
                callback();
              }
            };
          };
          this.moduleHelpers.addDep('esn-config', esnConfigMock);

          var method = 'REQUEST';

          mockery.registerMock('../../../lib/jcal/jcalHelper', {
            jcal2content: function() {
              return event;
            }
          });

          userMock.findByEmail = function(email, callback) {
            if (email === attendee1.emails[0]) {
              return callback(null, attendee1);
            } else {
              return callback(null, attendee2);
            }
          };

          //mocking the send function so as to get a reference to the filter method only
          contentSenderMock.send = function(from, to, content, options, type) {
            return q(options.filter);
          };

          this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
          this.module.inviteAttendees(organizer, attendeeEmails, true, method, ics, callback);
        };

      });

      it('should be a function', function() {
        this.getFilter({}, function(err, filter) {
          expect(filter).is.a.function;
        });
      });

      it('should return map-marker.png when location is specified', function() {
        this.getFilter({location: 'aLocation'}, function(err, filter) {
          expect(filter[0]('map-marker.png')).to.be.true;
        });
      });

      it('should not return map-marker.png when location is not specified', function() {
        this.getFilter({}, function(err, filter) {
          expect(filter[0]('map-marker.png')).to.be.false;
        });
      });

      it('should return format-align-justify.png when description is specified', function() {
        this.getFilter({description: 'aDescription'}, function(err, filter) {
          expect(filter[0]('format-align-justify.png')).to.be.true;
        });
      });

      it('should not return format-align-justify.png when description is not specified', function() {
        this.getFilter({}, function(err, filter) {
          expect(filter[0]('format-align-justify.png')).to.be.false;
        });
      });

      it('should return folder-download.png when files is specified', function() {
        this.getFilter({files: 'someFiles'}, function(err, filter) {
          expect(filter[0]('folder-download.png')).to.be.true;
        });
      });

      it('should not return folder-download.png when files is not specified', function() {
        this.getFilter({}, function(err, filter) {
          expect(filter[0]('folder-download.png')).to.be.false;
        });
      });

      it('should return check.png for a timed event', function() {
        this.getFilter({allDay: false}, function(err, filter) {
          expect(filter[0]('check.png')).to.be.true;
        });
      });

      it('should return check.png for a multi-allday event', function() {
        this.getFilter({allDay: true, durationInDays: 2}, function(err, filter) {
          expect(filter[0]('check.png')).to.be.true;
        });
      });

      it('should not return check.png for an allday event that lasts for one day', function() {
        this.getFilter({allDay: true, durationInDays: 1}, function(err, filter) {
          expect(filter[0]('check.png')).to.be.false;
        });
      });
    });
  });
});
