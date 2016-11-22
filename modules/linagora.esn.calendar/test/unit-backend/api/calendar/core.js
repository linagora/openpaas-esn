'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');
var fs = require('fs');
var sinon = require('sinon');

describe('The calendar core module', function() {

  var collaborationMock;
  var eventMessageMock;
  var userMock;
  var activityStreamHelperMock;
  var helpersMock;
  var pubsubMock;
  var configMock;
  var authMock;
  var searchLibMock;
  var searchLibModule;
  var caldavClientMock;
  var caldavClientLib;
  var emailMock;

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
      },
      config: {
        getBaseUrl: function(user, callback) {
          callback();
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
    configMock = function() {
      return {
        webserver: {}
      };
    };
    authMock = {
      jwt: {
        generateWebToken: function(p, callback) {
          expect(p).to.exist;
          return callback(null, 'token');
        }
      }
    };
    searchLibMock = {};
    searchLibModule = function() {
      return searchLibMock;
    };
    caldavClientMock = {};
    caldavClientLib = function() {
      return caldavClientMock;
    };
    emailMock = {
      getMailer: function() { return {}; }
    };
  }

  beforeEach(function() {
    initMock();
    mockery.registerMock('./../../../lib/message/eventmessage.core', eventMessageMock);
    mockery.registerMock('../../../lib/search', searchLibModule);
    mockery.registerMock('../../../lib/caldav-client', caldavClientLib);
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar/backend';
    this.moduleHelpers.addDep('user', userMock);
    this.moduleHelpers.addDep('collaboration', collaborationMock);
    this.moduleHelpers.addDep('activitystreams', activityStreamHelperMock);
    this.moduleHelpers.addDep('helpers', helpersMock);
    this.moduleHelpers.addDep('pubsub', pubsubMock);
    this.moduleHelpers.addDep('config', configMock);
    this.moduleHelpers.addDep('auth', authMock);
    this.moduleHelpers.addDep('email', emailMock);
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

  describe('the generateActionLinks function', function() {
    var baseUrl, payload;

    beforeEach(function() {
      baseUrl = 'http://localhost:0000';
      payload = {
        attendeeEmail: 'me@openpaas.org'
      };
    });

    it('should fail when the jwt generation fail', function(done) {
      var calls = 0;
      var authMock = {
        jwt: {
          generateWebToken: function(p, callback) {
            expect(p).to.shallowDeepEqual(payload);
            expect(p.action).to.exist;
            calls++;
            if (calls === 2) {
              return callback(new Error());
            } else {
              return callback(null, 'token');
            }
          }
        }
      };
      this.moduleHelpers.addDep('auth', authMock);

      this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      this.module.generateActionLinks(baseUrl, payload).then(function() {
        return done(new Error('Should not have succeeded'));
      }, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should resolve to an object containing correct links', function(done) {
      var authMock = {
        jwt: {
          generateWebToken: function(p, callback) {
            expect(p).to.shallowDeepEqual(payload);
            expect(p.action).to.exist;
            return callback(null, 'token' + p.action);
          }
        }
      };
      this.moduleHelpers.addDep('auth', authMock);

      this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      this.module.generateActionLinks(baseUrl, payload).then(function(links) {
        var linkStart = baseUrl + '/calendar/api/calendars/event/participation?jwt=token';
        expect(links).to.deep.equal({
          yes: linkStart + 'ACCEPTED',
          no: linkStart + 'DECLINED',
          maybe: linkStart + 'TENTATIVE'
        });
        done();
      }, done);
    });
  });

  describe('The inviteAttendees', function() {

    var organizer = {
      firstname: 'organizerFirstname',
      lastname: 'organizerLastname',
      emails: [
        'organizer@open-paas.org'
      ],
      preferredEmail: 'organizer@open-paas.org',
      domains: [{ domain_id: 'domain123' }]
    };
    var attendee1 = {
      firstname: 'attendee1Firstname',
      lastname: 'attendee1Lastname',
      emails: [
        'attendee1@open-paas.org'
      ]
    };
    var otherAttendee = {
      firstname: 'attendee2Firstname',
      lastname: 'attendee2Lastname',
      emails: [
        'attendee2@open-paas.org'
      ]
    };
    var attendeeEmail = attendee1.emails[0];

    var ics = ['BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:123123',
      'SUMMARY:description',
      'DTSTART:20150101T010101',
      'DTEND:20150101T020202',
      'ORGANIZER;CN="' + organizer.firstname + ' ' + organizer.lastname + '":mailto:' + organizer.emails[0],
      'ATTENDEE;CN="' + attendee1.firstname + ' ' + attendee1.lastname + '":mailto:' + attendee1.emails[0],
      'ATTENDEE;CN="' + otherAttendee.firstname + ' ' + otherAttendee.lastname + '":mailto:' + otherAttendee.emails[0],
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    describe('The inviteAttendees fn', function() {
      beforeEach(function() {
        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      });

      it('should return with success if notify is false', function(done) {
        this.module.inviteAttendees({}, ['foo@bar.com'], false, 'REQUEST', 'ICS', 'calendarURI', this.helpers.callbacks.noError(done));
      });

      it('should return an error if organizer is undefined', function(done) {
        this.module.inviteAttendees(null, ['foo@bar.com'], true, 'REQUEST', 'ICS', 'calendarURI', this.helpers.callbacks.error(done));
      });

      it('should return an error if attendeeEmails is not an array', function(done) {
        this.module.inviteAttendees({}, {}, true, 'REQUEST', 'ICS', 'calendarURI', this.helpers.callbacks.error(done));
      });

      it('should return an error if attendeeEmails is an empty array', function(done) {
        this.module.inviteAttendees({}, [], true, 'REQUEST', 'ICS', 'calendarURI', this.helpers.callbacks.error(done));
      });

      it('should return an error if method is undefined', function(done) {
        this.module.inviteAttendees({}, ['foo@bar.com'], true, null, 'ICS', 'calendarURI', this.helpers.callbacks.error(done));
      });

      it('should return an error if ics is undefined', function(done) {
        this.module.inviteAttendees({}, ['foo@bar.com'], true, 'REQUEST', null, 'calendarURI', this.helpers.callbacks.error(done));
      });

      it('should return an error if calendarURI is undefined', function(done) {
        this.module.inviteAttendees({}, ['foo@bar.com'], true, 'REQUEST', 'ICS', null, this.helpers.callbacks.error(done));
      });

      it('should return an error if findByEmail return an error', function(done) {
        var method = 'REQUEST';

        userMock.findByEmail = function(email, callback) {
          return callback(new Error('Error in findByEmail'));
        };

        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', this.helpers.callbacks.error(done));
      });

      it('should return an error it cannot retrieve ', function(done) {
        helpersMock.config.getBaseUrl = function(user, callback) {
          callback(new Error('cannot get base_url'));
        };

        var method = 'REQUEST';
        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', this.helpers.callbacks.error(done));
      });

      it('should return an error if an error happens during links generation', function(done) {
        var method = 'REQUEST';

        userMock.findByEmail = function(email, callback) {
          if (email === attendee1.emails[0]) {
            return callback(null, attendee1);
          } else {
            return callback(null, otherAttendee);
          }
        };

        authMock.jwt.generateWebToken = function(p, callback) {
          return callback(new Error());
        };

        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', this.helpers.callbacks.error(done));
      });

      it('should generate a token with proper information', function(done) {
        var method = 'REQUEST';

        userMock.findByEmail = function(email, callback) {
          if (email === attendee1.emails[0]) {
            return callback(null, attendee1);
          } else {
            return callback(null, otherAttendee);
          }
        };

        authMock.jwt.generateWebToken = sinon.spy(function(token, callback) {
          callback('a_token');
        });

        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', function() {
          function testTokenWith(action, attendeeEmail) {
            expect(authMock.jwt.generateWebToken).to.have.been.calledWith({
              action: action,
              attendeeEmail: attendeeEmail,
              calendarURI: 'calendarURI',
              organizerEmail: organizer.preferredEmail,
              uid: '123123'
            });
          }

          ['ACCEPTED', 'DECLINED', 'TENTATIVE'].forEach(function(action) {
            testTokenWith(action, attendeeEmail);
          });

          done();
        });
      });

      it('should return an error if there is an error while sending email', function(done) {
        var method = 'REQUEST';

        userMock.findByEmail = function(email, callback) {
          if (email === attendee1.emails[0]) {
            return callback(null, attendee1);
          } else {
            return callback(null, otherAttendee);
          }
        };

        emailMock.getMailer = function() {
          return {
            sendHTML: function() {
              return q.reject(new Error('an error'));
            }
          };
        };

        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', this.helpers.callbacks.error(done));
      });

      it('should work even if findByEmail doesn\'t find the attendee', function(done) {
        var method = 'REQUEST';

        userMock.findByEmail = function(email, callback) {
          if (email === attendee1.emails[0]) {
            return callback(null, attendee1);
          } else {
            // Purposely not finding this attendee
            return callback(null, null);
          }
        };

        emailMock.getMailer = function() {
          return {
            sendHTML: function(email, template, locals) {
              expect(email.from).to.equal(organizer.emails[0]);
              expect(email.to).to.equal(attendee1.emails[0]);
              expect(template).to.be.a.string;
              expect(locals).to.be.an('object');

              return q();
            }
          };
        };

        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', function(err) {
          expect(err).to.not.exist;
          done();
        });
      });

      it('should send HTML email with correct parameters', function(done) {
        helpersMock.config.getBaseUrl = function(user, callback) {
          callback(null, 'http://localhost:8888');
        };
        mockery.registerMock('../../../lib/helpers/jcal', {
          jcal2content: function() {
            return {};
          }
        });
        var method = 'REQUEST';

        userMock.findByEmail = function(email, callback) {
          if (email === attendee1.emails[0]) {
            return callback(null, attendee1);
          } else {
            return callback(null, otherAttendee);
          }
        };

        emailMock.getMailer = function() {
          return {
            sendHTML: function(email, template, locals) {
              expect(email.from).to.equal(organizer.emails[0]);

              expect(email.to).to.equal(attendee1.emails[0]);
              expect(email).to.shallowDeepEqual({
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
              });
              expect(template).to.equal('event.invitation');
              expect(locals).to.be.an('object');
              expect(locals.filter).is.a.function;
              expect(locals.content.baseUrl).to.equal('http://localhost:8888');
              expect(locals.content.yes).to.equal('http://localhost:8888/calendar/api/calendars/event/participation?jwt=token');
              expect(locals.content.no).to.equal('http://localhost:8888/calendar/api/calendars/event/participation?jwt=token');
              expect(locals.content.maybe).to.equal('http://localhost:8888/calendar/api/calendars/event/participation?jwt=token');

              return q();
            }
          };
        };

        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('when method is REQUEST', function() {

      beforeEach(function() {
        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
      });

      it('should send email with new event subject and template if sequence is 0', function(done) {
        var method = 'REQUEST';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/request-new-event.ics', 'utf-8');

        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        emailMock.getMailer = function() {
          return {
            sendHTML: function(email, template) {
              expect(template).to.equal('event.invitation');
              expect(email.subject).to.equal('New event from ' + organizer.firstname + ' ' + organizer.lastname + ': Démo OPENPAAS');

              return q();
            }
          };
        };

        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', function(err) {
          expect(err).to.not.exist;
          done();
        });
      });

      it('should send HTML email with event update subject and template if sequence > 0', function(done) {
        var method = 'REQUEST';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/request-event-update.ics', 'utf-8');

        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        emailMock.getMailer = function() {
          return {
            sendHTML: function(email, template) {
              expect(template).to.equal('event.update');
              expect(email.subject).to.equal('Event Démo OPENPAAS from ' + organizer.firstname + ' ' + organizer.lastname + ' updated');

              return q();
            }
          };
        };

        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('when method is REPLY', function() {
      it('should send email with reply event subject and template', function(done) {
        var method = 'REPLY';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/reply.ics', 'utf-8');

        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        emailMock.getMailer = function() {
          return {
            sendHTML: function(email, template) {
              expect(template).to.equal('event.reply');
              expect(email.subject).to.equal('Participation updated: Démo OPENPAAS');

              return q();
            }
          };
        };

        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', function(err) {
          expect(err).to.not.exist;
          done();
        });
      });

      it('should send email with correct content', function(done) {
        var method = 'REPLY';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/reply.ics', 'utf-8');

        attendee1.domains = [{ domain_id: 'domain_id' }];
        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        var editor = {
          displayName: attendee1.firstname + ' ' + attendee1.lastname,
          email: attendee1.emails[0]
        };

        emailMock.getMailer = function() {
          return {
            sendHTML: function(email, template, locals) {
              expect(template).to.equal('event.reply');
              expect(email.subject).to.equal('Participation updated: Démo OPENPAAS');
              expect(locals.content.editor).to.deep.equal(editor);

              return q();
            }
          };
        };

        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(attendee1, attendeeEmail, true, method, ics, 'calendarURI', function(err) {
          expect(err).to.not.exist;
          done();
        });
      });

      it('should only send messages to involved users', function(done) {
        var method = 'REPLY';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/involved.ics', 'utf-8');

        userMock.findByEmail = function(email, callback) {
          if (email === 'attendee1@open-paas.org') {
            return callback(null, attendee1);
          } else {
            return callback(null, otherAttendee);
          }
        };

        var editor = {
          displayName: attendee1.firstname + ' ' + attendee1.lastname,
          email: attendee1.emails[0]
        };

        var called = 0;

        emailMock.getMailer = function() {
          return {
            sendHTML: function(email) {
              called++;
              if (called === 1) {
                expect(email.to).to.deep.equal(attendee1.emails[0]);
              }

              return q();
            }
          };
        };

        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(attendee1, attendeeEmail, true, method, ics, 'calendarURI', function(err) {
          expect(err).to.not.exist;
          expect(called).to.equal(1);
          done();
        });
      });
    });

    describe('when method is CANCEL', function() {
      it('should send HTML email with cancel event subject', function(done) {
        var method = 'CANCEL';
        var ics = fs.readFileSync(__dirname + '/../../fixtures/cancel.ics', 'utf-8');

        userMock.findByEmail = function(email, callback) {
          return callback(null, attendee1);
        };

        emailMock.getMailer = function() {
          return {
            sendHTML: function(email, template) {
              expect(template).to.equal('event.cancel');
              expect(email.subject).to.equal('Event Démo OPENPAAS from ' + organizer.firstname + ' ' + organizer.lastname + ' canceled');

              return q();
            }
          };
        };

        this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
        this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('The filter method of the inviteAttendees fn', function() {
      beforeEach(function() {
        this.getFilter = function(event, callback) {
          helpersMock.config.getBaseUrl = function(user, callback) {
            callback();
          };

          var method = 'REQUEST';

          mockery.registerMock('../../../lib/helpers/jcal', {
            jcal2content: function() {
              return event;
            }
          });

          userMock.findByEmail = function(email, callback) {
            if (email === attendee1.emails[0]) {
              return callback(null, attendee1);
            } else {
              return callback(null, otherAttendee);
            }
          };

          //mocking the send function so as to get a reference to the filter method only
          emailMock.getMailer = function() {
            return {
              sendHTML: function(email, template, locals) {
                return q(locals.filter);
              }
            };
          };

          this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
          this.module.inviteAttendees(organizer, attendeeEmail, true, method, ics, 'calendarURI', callback);
        };

      });

      it('should be a function', function() {
        this.getFilter({}, function(err, filter) {
          expect(filter).is.a.function;
        });
      });

      it('should return map-marker.png when location is specified', function() {
        this.getFilter({organizer: organizer, location: 'aLocation'}, function(err, filter) {
          expect(filter[0]('map-marker.png')).to.be.true;
        });
      });

      it('should not return map-marker.png when location is not specified', function() {
        this.getFilter({organizer: organizer}, function(err, filter) {
          expect(filter[0]('map-marker.png')).to.be.false;
        });
      });

      it('should return format-align-justify.png when description is specified', function() {
        this.getFilter({organizer: organizer, description: 'aDescription'}, function(err, filter) {
          expect(filter[0]('format-align-justify.png')).to.be.true;
        });
      });

      it('should not return format-align-justify.png when description is not specified', function() {
        this.getFilter({organizer: organizer}, function(err, filter) {
          expect(filter[0]('format-align-justify.png')).to.be.false;
        });
      });

      it('should return folder-download.png when files is specified', function() {
        this.getFilter({organizer: organizer, files: 'someFiles'}, function(err, filter) {
          expect(filter[0]('folder-download.png')).to.be.true;
        });
      });

      it('should not return folder-download.png when files is not specified', function() {
        this.getFilter({organizer: organizer}, function(err, filter) {
          expect(filter[0]('folder-download.png')).to.be.false;
        });
      });

      it('should return check.png for a timed event', function() {
        this.getFilter({organizer: organizer, allDay: false}, function(err, filter) {
          expect(filter[0]('check.png')).to.be.true;
        });
      });

      it('should return check.png for a multi-allday event', function() {
        this.getFilter({organizer: organizer, allDay: true, durationInDays: 2}, function(err, filter) {
          expect(filter[0]('check.png')).to.be.true;
        });
      });

      it('should not return check.png for an allday event that lasts for one day', function() {
        this.getFilter({organizer: organizer, allDay: true, durationInDays: 1}, function(err, filter) {
          expect(filter[0]('check.png')).to.be.false;
        });
      });
    });
  });

  describe('the searchEvents function', function() {
    beforeEach(function() {
      this.module = require(this.moduleHelpers.backendPath + '/webserver/api/calendar/core')(this.moduleHelpers.dependencies);
    });

    it('should call the search module with good params and fail if it fails', function() {
      var query = {
        search: 'search',
        limit: '50',
        offset: 100,
        sortKey: 'date',
        sortOrder: 'desc'
      };
      searchLibMock.searchEvents = function(q, callback) {
        expect(q).to.deep.equal(query);
        return callback(new Error());
      };

      this.module.searchEvents(query, function(err, results) {
        expect(err).to.exist;
        expect(results).to.not.exist;
      });
    });

    it('should call the search module with good params and return the events retireved through the caldav-client', function(done) {
      var query = {
        search: 'search',
        userId: 'userId',
        calendarId: 'calendarId'
      };
      var esResult = {
        total_count: 3,
        list: [{_id: 'event1'}, {_id: 'event2'}, {_id: 'event3'}]
      };
      searchLibMock.searchEvents = function(q, callback) {
        expect(q).to.deep.equal(query);
        return callback(null, esResult);
      };
      caldavClientMock.getEvent = sinon.stub();
      caldavClientMock.getEvent.onFirstCall().returns(q.when('event1')).onSecondCall().returns(q.reject('error2')).onThirdCall().returns(q.when('event3'));

      caldavClientMock.getEventPath = sinon.stub();
      caldavClientMock.getEventPath.onFirstCall().returns('event1path').onSecondCall().returns('event3path');

      this.module.searchEvents(query, function(err, results) {
        expect(err).to.not.exist;
        [0, 1, 2].forEach(function(i) {expect(caldavClientMock.getEvent).to.have.been.calledWith(query.userId, query.calendarId, esResult.list[i]._id);});
        [0, 2].forEach(function(i) {expect(caldavClientMock.getEventPath).to.have.been.calledWith(query.userId, query.calendarId, esResult.list[i]._id);});
        expect(results).to.deep.equal({
          total_count: esResult.total_count,
          results: [
            { uid: 'event1', event: 'event1', path: 'event1path'},
            { uid: 'event2', error: 'error2'},
            { uid: 'event3', event: 'event3', path: 'event3path'}
          ]
        });
        done();
      });
    });
  });
});
