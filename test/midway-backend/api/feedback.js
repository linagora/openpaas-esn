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
    var mongoose = require('mongoose');
    mongoose.connection.db.dropDatabase();
    mongoose.disconnect(done);
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
      var req = requestAsMember(request(app).post('/api/feedback/'));
      req.send({content: ''});
      req.expect(400).end(done);
    });
  });

  it('should be able to send a feedback when logged', function(done) {
    var feedback = {
      content: 'A feedback content'
    };

    this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, requestAsMember) {
      if (err) { return done(err); }
      var req = requestAsMember(request(app).post('/api/feedback/'));
      req.send(feedback);
      req.expect(201).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        expect(res.body.content).to.deep.equal(feedback.content);
        expect(res.body.author).to.deep.equal(user._id.toString());
        done();
      });
    });
  });

});
