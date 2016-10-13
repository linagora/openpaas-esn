'use strict';

var request = require('supertest'),
  expect = require('chai').expect;

describe('The feedback API', function() {
  var app;
  var user;
  var password = 'secret';

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }
        user = models.users[0];
        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  it('should not be able to send a feedback without being authenticated', function(done) {
    request(app)
      .post('/api/feedback/')
      .expect(401)
      .end(done);
  });

  it('should be able to send a feedback when logged but should receive 400 without request body', function(done) {
    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) { return done(err); }
      var req = requestAsMember(request(app).post('/api/feedback/'));
      req.expect(400).end(done);
    });
  });

  it('should be able to send a feedback when logged but should receive 400 with request body empty', function(done) {
    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) { return done(err); }
      var req = requestAsMember(request(app).post('/api/feedback/'));
      req.send({});
      req.expect(400).end(done);
    });
  });

  it('should be able to send a feedback when logged but should receive 400 with request body which contain empty string', function(done) {
    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) { return done(err); }
      var feedback = {
        subject: '',
        content: ''
      };
      var req = requestAsMember(request(app).post('/api/feedback/'));
      req.send(feedback);
      req.expect(400).end(done);
    });
  });

  it('should be able to send a feedback when logged but should receive 400 with request body which contain undefined subject', function(done) {
    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) { return done(err); }
      var feedback = {
        content: ' a content'
      };
      var req = requestAsMember(request(app).post('/api/feedback'));
      req.send(feedback);
      req.expect(400).end(function(err, res) {
          if (err) {
            return done(err);
          }
        expect(res.body.error.details).to.match(/Missing subject/);
        done();
      });
    });
  });

  it('should be able to send a feedback when logged but should receive 400 with request body which contain undefined content', function(done) {
    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) { return done(err); }
      var feedback = {
        subject: 'a subject'
      };
      var req = requestAsMember(request(app).post('/api/feedback'));
      req.send(feedback);
      req.expect(400).end(function(err, res) {
        if (err) {
          return done(err);
        }
        expect(res.body.error.details).to.match(/Missing content/);
        done();
      });
    });
  });

  it('should be able to send a feedback when logged', function(done) {
    var feedback = {
      subject: 'A feedback subject',
      content: 'A feedback content'
    };

    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) { return done(err); }
      var req = requestAsMember(request(app).post('/api/feedback'));
      req.send(feedback);
      req.end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });
  });

});
