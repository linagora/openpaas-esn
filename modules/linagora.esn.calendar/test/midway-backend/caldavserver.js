'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe.skip('The caldavserver API', function() {
  var app;
  var domain;
  var user;
  var password = 'secret';

  beforeEach(function(done) {
    var self = this;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        domain = models.domain;
        user = models.users[0];
        done();
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('should return 401 if user is not authenticated', function(done) {
    request(app).get('/api/caldavserver').expect(401).end(function(err, res) {
      expect(err).to.not.exist;
      done();
    });
  });

  it('should return 200 with the default CalDAV server url', function(done) {
    var self = this;

    self.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }

      var req = loggedInAsUser(request(app).get('/api/caldavserver'));
      req.expect(200).end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.body).to.exist;
        expect(res.body).to.deep.equal({
          url: 'http://localhost:80'
        });
        done();
      });
    });
  });

  it('should return 200 with the CalDAV server url define in the database', function(done) {
    var self = this;

    var caldavConfiguration = {
      _id: 'caldav',
      backend: {
        url: 'backendUrl'
      },
      frontend: {
        url: 'frontendUrl'
      }
    };

    this.helpers.mongo.saveDoc('configuration', caldavConfiguration, function(err) {
      if (err) {
        done(err);
      }

      self.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).get('/api/caldavserver'));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.deep.equal({
            url: caldavConfiguration.frontend.url
          });
          done();
        });
      });
    });
  });
});
