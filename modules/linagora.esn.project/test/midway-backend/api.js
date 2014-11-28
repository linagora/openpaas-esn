'use strict';
var expect = require('chai').expect;
var request = require('supertest');


describe('linagora.esn.project module', function() {
  var moduleName = 'linagora.esn.project';
  beforeEach(function(done) {
    var self = this;
    this.helpers.modules.initMidway(moduleName, function(err) {
      if (err) {
        return done(err);
      }
      self.helpers.api.applyDomainDeployment(
        'linagora_PROJECTS',
        {
          fixtures: __dirname + '/../fixtures/deployments'
        },
        function(err, models) {
          if (err) {
            return done(err);
          }
          self.models = models;
          done();
        }
      );
    });
  });

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(this.models, done);
  });

  describe('GET /api/projects', function() {
    beforeEach(function() {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      this.app = this.helpers.modules.getWebServer(app);
    });
    it('should send back 401 when not logged in', function(done) {
      request(this.app).get('/api/projects').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should send back 400 if domain is not defined', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(this.app, self.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).get('/api/projects'));
        req.expect(400);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should return an array of projects in the given domain', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).get('/api/projects?domain_id=' + self.models.domain._id));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(3);
          done();
        });
      });
    });
    it('should return an array of projects in the given domain matching a certain title', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(self.app).get('/api/projects?domain_id=' + self.models.domain._id + '&title=OpenPaaS%20open'));
        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(1);
          expect(res.body[0].title).to.equal('OpenPaaS open');
          done();
        });
      });
    });
  });
});
