'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');
var fs = require('fs');

describe('The calendars API', function() {
  var user, user3, community;
  var password = 'secret';
  var moduleName = 'linagora.esn.calendar';
  var davserver;

  beforeEach(function(done) {
    var self = this;

    this.helpers.modules.initMidway(moduleName, function(err) {
      if (err) {
        return done(err);
      }

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        user = models.users[0];
        user3 = models.users[2];
        community = models.communities[1];
        self.models = models;

        self.helpers.davserver.saveTestConfiguration(function() {
          davserver = self.helpers.davserver.runServer('An event !');

          done();
        });
      });
    });

  });

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(this.models, function() {
      davserver.close(done);
    });
  });

  describe('POST /api/calendars/:objectType/:id/events', function() {

    beforeEach(function() {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);
      expressApp.use('/', this.helpers.modules.current.lib.api.calendar);
      this.app = this.helpers.modules.getWebServer(expressApp);
    });

    it('should return 401 if not logged in', function(done) {
      this.helpers.api.requireLogin(this.app, 'post', '/api/calendars/community/' + community._id + '/events', done);
    });

    it('should return 404 if calendar id is not a community id', function(done) {
      var ObjectId = require('bson').ObjectId;
      var id = new ObjectId();
      var self = this;

      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(self.app).post('/api/calendars/community/' + id + '/events'));
        req.expect(404, done);
      });
    });

    it('should return 403 if the user have not write permission in the community', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, user3.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(self.app).post('/api/calendars/community/' + community._id + '/events'));
        req.send({
          event_id: '/path/to/uid.ics',
          type: 'created',
          event: 'BEGIN:VCALENDAR'
        });
        req.expect(403, done);
      });
    });

    it('should return 500 if type is not equal to "created"', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(self.app).post('/api/calendars/community/' + community._id + '/events'));
        req.send({
          event_id: '123',
          type: 'updated',
          event: 'ICS'
        });
        req.expect(500, done);
      });
    });

    it('should return 201 for creates', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(self.app).post('/api/calendars/community/' + community._id + '/events'));
        req.send({
          event_id: '123',
          type: 'created',
          event: 'ICS'
        });
        req.expect(201).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res).to.exist;
          expect(res.body).to.exist;
          expect(res.body._id).to.exist;
          expect(res.body.objectType).to.equal('event');
          done();
        });
      });
    });

    it('should return 200 for modifications', function(done) {
      var self = this;
      var pubsub = this.helpers.requireBackend('core').pubsub.local;
      var topic = pubsub.topic('message:activity');
      async.series([function(callback) {
        this.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          if (err) {
            return done(err);
          }

          var req = requestAsMember(request(self.app).post('/api/calendars/community/' + community._id + '/events'));
          req.send({
            event_id: '123',
            type: 'created',
            event: 'ICS'
          }).end(callback);
        });
      }.bind(this), function() {
        this.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          if (err) {
            return done(err);
          }
          var called = false;
          topic.subscribe(function(message) {
            expect(message.verb).to.equal('update');
            called = true;
          });

          var req = requestAsMember(request(self.app).post('/api/calendars/community/' + community._id + '/events'));
          req.send({
            event_id: '123',
            type: 'updated',
            event: 'ICS'
          });
          req.expect(200).end(function(err, res) {
            expect(err).to.not.exist;
            expect(called).to.equal(true);
            expect(res).to.exist;
            expect(res.body).to.exist;
            expect(res.body._id).to.exist;
            expect(res.body.objectType).to.equal('event');
            done();
          });
        });
      }.bind(this)]);
    });
  });

  describe('GET /api/calendars/event/participation', function() {
    var jwtCoreModule;

    beforeEach(function(done) {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);
      expressApp.use('/', this.helpers.modules.current.lib.api.calendar);
      this.app = this.helpers.modules.getWebServer(expressApp);

      jwtCoreModule = this.helpers.requireBackend('core/auth/jwt');

      this.helpers.jwt.saveTestConfiguration(done);
    });

    it('should return 401 if no jwt is provided', function(done) {
      var req = request(this.app).get('/api/calendars/event/participation');
      req.expect(401, done);
    });

    it('should return 400 when the provided jwt does not contain correct information', function(done) {
      var self = this;
      jwtCoreModule.generateWebToken({test: 'notCompliant'}, function(err, token) {
        var req = request(self.app).get('/api/calendars/event/participation?jwt=' + token);
        req.expect(400).end(done);
      });
    });
  });

  describe('POST /api/calendars/inviteattendees', function() {

    beforeEach(function() {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);
      expressApp.use('/', this.helpers.modules.current.lib.api.calendar);
      this.app = this.helpers.modules.getWebServer(expressApp);
    });

    it('should send 401 if not logged in', function(done) {
      this.helpers.api.requireLogin(this.app, 'post', '/api/calendars/inviteattendees', done);
    });

    var testError400 = function(requestJSON, helpers, app, done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(app).post('/api/calendars/inviteattendees'));
        req.send(requestJSON);
        req.expect(400, done);
      });
    };

    it('should send 400 if the request body has no "emails" property', function(done) {
      testError400({
        method: 'REQUEST',
        event: 'ICS',
        calendarURI: 'calId'
      }, this.helpers, this.app, done);
    });

    it('should send 400 if the request body has no "method" property', function(done) {
      testError400({
        email: 'email1@domain1',
        event: 'ICS',
        calendarURI: 'calId'
      }, this.helpers, this.app, done);
    });

    it('should send 400 if the request body has no "event" property', function(done) {
      testError400({
        email: 'email1@domain1',
        method: 'REQUEST',
        calendarURI: 'calId'
      }, this.helpers, this.app, done);
    });

    it('should send 400 if the request body has no "calendarURI" property', function(done) {
      testError400({
        email: 'email1@domain1',
        method: 'REQUEST',
        event: 'ICS'
      }, this.helpers, this.app, done);
    });

    it('should send 400 if the request body "emails" property is invalid', function(done) {
      testError400({
        email: null,
        method: 'REQUEST',
        event: 'ICS',
        calendarURI: 'calId'
      }, this.helpers, this.app, done);
    });

    it('should send 400 if the request body "method" property is invalid', function(done) {
      testError400({
        email: 'email1@domain1',
        method: 123,
        event: 'ICS',
        calendarURI: 'calId'
      }, this.helpers, this.app, done);
    });

    it('should send 400 if the request body "event" property is invalid', function(done) {
      testError400({
        email: 'email1@domain1',
        method: 'REQUEST',
        event: 123,
        calendarURI: 'calId'
      }, this.helpers, this.app, done);
    });

    it('should send 400 if the request body "calendarURI" property is invalid', function(done) {
      testError400({
        email: 'email1@domain1',
        method: 'REQUEST',
        event: 'ICS',
        calendarURI: 123
      }, this.helpers, this.app, done);
    });

    it('should send 200 if the request is correct', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(self.app).post('/api/calendars/inviteattendees'));
        req.send({
          email: 'email1@domain1',
          method: 'REQUEST',
          event: 'ICS',
          calendarURI: 'calId'
        });
        req.expect(200, done);
      });
    });
  });

  describe('/api/calendars/:calendarId/events.json', function() {
    var localpubsub, message;

    var search = function(term, expectedSize, done) {
      var self = this;
      localpubsub.topic('events:event:add').publish(message);

      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }

        self.helpers.elasticsearch.checkDocumentsIndexed({index: 'events.idx', type: 'events', ids: [message.eventUid]}, function(err) {
          if (err) {
            return done(err);
          }
          var req = requestAsMember(request(self.app).get('/api/calendars/' + message.calendarId + '/events.json'));
          req.query({query: term}).expect(200).end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(String(expectedSize));
            done();
          });
        });
      });
    };

    beforeEach(function() {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);
      expressApp.use('/', this.helpers.modules.current.lib.api.calendar);
      this.app = this.helpers.modules.getWebServer(expressApp);
      require('../../backend/lib/search')(this.helpers.modules.current.deps).listen();
    });

    beforeEach(function(done) {
      localpubsub = this.helpers.requireBackend('core/pubsub').local;
      message = {
        userId: user._id,
        calendarId: 'myCalendar',
        eventUid: '8f043139-d7c3-4bf3-bf9d-eb31d4b067bf'
      };
      message.ics = fs.readFileSync(__dirname + '/fixtures/completeMeeting.ics').toString('utf8');
      this.helpers.redis.publishConfiguration();
      this.helpers.elasticsearch.saveTestConfiguration(this.helpers.callbacks.noError(done));
    });

    it('should return nothing with non matching string', function(done) {
      search.bind(this)('anonmatchingstring', 0, done);
    });

    it('should return nothing with empty string', function(done) {
      search.bind(this)('', 0, done);
    });

    it('should return event with matching summary', function(done) {
      search.bind(this)('withuser012edi', 1, done);
    });

    it('should return event with matching description', function(done) {
      search.bind(this)('Lunch', 1, done);
    });

    it('should return event with matching organizer', function(done) {
      search.bind(this)('robert', 1, done);
    });

    it('should return event with matching attendees', function(done) {
      var self = this;
      var searchFunctions = ['first0', 'last1', 'user2', 'Edinson'].map(function(attendee) {
        return function(callback) {
          search.bind(self)(attendee, 1, callback);
        };
      });
      async.parallel(searchFunctions, done);
    });
  });
});
