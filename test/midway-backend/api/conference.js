'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The conference API', function() {
  var webserver;
  var creator, attendee, user, conferenceId;

  beforeEach(function() {
    this.helpers.requireBackend('core/db/mongo/models/domain');
    this.helpers.requireBackend('core/db/mongo/models/user');
  });

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      webserver = self.helpers.requireBackend('webserver').webserver;
      self.mongoose = require('mongoose');
      done();
    });
  });

  beforeEach(function(done) {
    var self = this;
    this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
      if (err) {
        return done(err);
      }
      user = models.users[0];
      creator = models.users[1];
      attendee = models.users[2];

      self.helpers.api.createConference(creator, [attendee], function(err, c) {
        if (err) {
          done(err);
        }

        conferenceId = c._id + '';
        done();
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('PUT /api/conferences/:id/attendees/:user_id', function() {
    it('should send back HTTP 401 when not logged in', function(done) {
      request(webserver.application).put('/api/conferences/' + conferenceId + '/attendees/' + user._id).expect(401).end(function(err) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back HTTP 204 when connected user is conference admin', function(done) {
      this.helpers.api.loginAsUser(webserver.application, creator.emails[0], 'secret', function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(webserver.application).put('/api/conferences/' + conferenceId + '/attendees/' + user._id));
        req.expect(204);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.empty;
          done();
        });
      });
    });

    it('should send back HTTP 204 when connected user is conference attendee', function(done) {
      this.helpers.api.loginAsUser(webserver.application, attendee.emails[0], 'secret', function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(webserver.application).put('/api/conferences/' + conferenceId + '/attendees/' + user._id));
        req.expect(204);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.empty;
          done();
        });
      });
    });

    it('should send back HTTP 403 when connected user is not in the conference', function(done) {
      this.helpers.api.loginAsUser(webserver.application, user.emails[0], 'secret', function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(webserver.application).put('/api/conferences/' + conferenceId + '/attendees/' + user._id));
        req.expect(403);
        done();
      });
    });

  });

});
