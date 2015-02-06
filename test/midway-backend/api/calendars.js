'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var async = require('async');

describe('The calendars API', function() {
  var app;
  var user, user2, user3, domain, community;
  var password = 'secret';

  beforeEach(function(done) {
    var self = this;

    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');
      self.mongoose = require('mongoose');
      self.helpers.requireBackend('core/db/mongo/models/user');
      self.helpers.requireBackend('core/db/mongo/models/domain');
      self.helpers.requireBackend('core/db/mongo/models/community');
      self.helpers.requireBackend('core/db/mongo/models/eventmessage');

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        user = models.users[0];
        user2 = models.users[1];
        user3 = models.users[2];
        domain = models.domain;
        community = models.communities[1];
        done();
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('POST /api/calendars/:objectType/:id/events should return 401 if not logged in', function(done) {
    request(app)
      .post('/api/calendars/community/' + community._id + '/events')
      .expect(401).end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
  });

  it('POST /api/calendars/:objectType/:id/events should return 404 if calendar id is not a community id', function(done) {
    var ObjectId = require('bson').ObjectId;
    var id = new ObjectId();

    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) {
        return done(err);
      }
      var req = requestAsMember(request(app).post('/api/calendars/community/' + id + '/events'));
      req.expect(404).end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  it('POST /api/calendars/:objectType/:id/events should return 403 if the user have not write permission in the community', function(done) {
    this.helpers.api.loginAsUser(app, user3.emails[0], password, function(err, requestAsMember) {
      if (err) {
        return done(err);
      }
      var req = requestAsMember(request(app).post('/api/calendars/community/' + community._id + '/events'));
      req.send({
        event_id: '/path/to/uid.ics',
        type: 'created',
        event: 'BEGIN:VCALENDAR'
      });
      req.expect(403).end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  it('POST /api/calendars/:objectType/:id/events should return 400 if type is not equal to "created"', function(done) {
    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) {
        return done(err);
      }
      var req = requestAsMember(request(app).post('/api/calendars/community/' + community._id + '/events'));
      req.send({
        event_id: '123',
        type: 'updated',
        event: 'ICS'
      });
      req.expect(400).end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
    });
  });

  it('POST /api/calendars/:objectType/:id/events should return 201 for creates', function(done) {
    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) {
        return done(err);
      }
      var req = requestAsMember(request(app).post('/api/calendars/community/' + community._id + '/events'));
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

  it('POST /api/calendars/:objectType/:id/events should return 200 for modifications', function(done) {
    var pubsub = this.helpers.requireBackend('core').pubsub.local;
    var topic = pubsub.topic('message:activity');
    async.series([function(callback) {
      this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }

        var req = requestAsMember(request(app).post('/api/calendars/community/' + community._id + '/events'));
        req.send({
          event_id: '123',
          type: 'created',
          event: 'ICS'
        }).end(callback);
      });
    }.bind(this), function(callback) {
      this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var called = false;
        topic.subscribe(function(message) {
          expect(message.verb).to.equal('update');
          called = true;
        });

        var req = requestAsMember(request(app).post('/api/calendars/community/' + community._id + '/events'));
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
