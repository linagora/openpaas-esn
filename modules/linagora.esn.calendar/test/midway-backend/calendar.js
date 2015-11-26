'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('The calendars API', function() {
  var user, user2, user3, domain, community;
  var password = 'secret';
  var moduleName = 'linagora.esn.calendar';

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
        user2 = models.users[1];
        user3 = models.users[2];
        domain = models.domain;
        community = models.communities[1];
        self.models = models;
        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(this.models, done);
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
      }.bind(this), function(callback) {
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

  describe('PUT /api/calendars/events', function() {
    beforeEach(function() {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);
      expressApp.use('/', this.helpers.modules.current.lib.api.calendar);
      this.app = this.helpers.modules.getWebServer(expressApp);
    });

    it('should fail if no jwt is provided', function(done) {
      var req = request(this.app).put('/api/calendars/events');
      req.expect(401, done);
    });

    it('should succeed', function(done) {
      var jwtCoreModule = this.helpers.requireBackend('core/auth/jwt');
      var self = this;
      jwtCoreModule.generateWebToken({login: 'me'}, function(err, token) {
        if (err) {
          return done(err);
        }
        var req = request(self.app).put('/api/calendars/events?jwt=' + token);
        req.expect(200).end(done);
      });
    });
  });
});
