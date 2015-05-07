'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The contacts davserver API', function() {
  var app;
  var domain;
  var user;
  var password = 'secret';
  var dav_uri = '/contacts/api/davserver';

  beforeEach(function(done) {
    var self = this;
    this.helpers.modules.initMidway('linagora.esn.contact', function(err) {
      if (err) {
        return done(err);
      }

      var modapp = require('../../backend/webserver/application')(self.helpers.modules.current.lib, self.helpers.modules.current.deps);
      modapp.use('/contacts', self.helpers.modules.current.lib.api.davserver);
      app = self.helpers.modules.getWebServer(modapp);

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        self.models = models;
        domain = models.domain;
        user = models.users[0];
        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(this.models, done);
  });

  it('should return 401 if user is not authenticated', function(done) {
    request(app).get(dav_uri).expect(401).end(function(err, res) {
      expect(err).to.not.exist;
      done();
    });
  });

  it('should return 200 with the default CardDAV server url', function(done) {
    var self = this;

    self.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }

      var req = loggedInAsUser(request(app).get(dav_uri));
      req.expect(200).end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.body).to.exist;
        expect(res.body).to.deep.equal({
          url: 'http://localhost'
        });
        done();
      });
    });
  });

  it('should return 200 with the CardDAV server url define in the database', function(done) {
    var self = this;

    var davconfig = {
      _id: 'dav',
      backend: {
        url: 'backendUrl'
      },
      frontend: {
        url: 'frontendUrl'
      }
    };

    this.helpers.mongo.saveDoc('configuration', davconfig, function(err) {
      if (err) {
        done(err);
      }

      self.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).get(dav_uri));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.deep.equal({
            url: davconfig.frontend.url
          });
          done();
        });
      });
    });
  });
});
