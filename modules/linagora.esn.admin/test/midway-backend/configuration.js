'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The configuration API', function() {
  var user, domain, feature;
  var password = 'secret';
  var moduleName = 'linagora.esn.admin';

  beforeEach(function(done) {
    var self = this;

    this.helpers.modules.initMidway(moduleName, function(err) {
      if (err) {
        return done(err);
      }
      self.helpers.api.applyDomainDeployment('linagora_test_configurations', function(err, models) {
        if (err) { return done(err); }
        user = models.users[0];
        domain = models.domain;
        feature = models.feature;
        self.models = models;
        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(this.models, done);
  });

  describe('POST /api/configuration', function() {
    beforeEach(function() {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);
      expressApp.use('/', this.helpers.modules.current.lib.api.configuration);
      this.app = this.helpers.modules.getWebServer(expressApp);
    });

    it('should return 200 if get configurations success', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(self.app).post('/api/configuration/' + domain._id));
        req.send({
          configNames: ['mail']
        });

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res).to.exist;
          expect(res.body).to.exist;
          expect(res.body[0].name).to.equal('mail');
          expect(res.body[0].value).to.exist;
          done();
        });
      });
    });
  });

  describe('PUT /api/configuration', function() {
    beforeEach(function() {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);
      expressApp.use('/', this.helpers.modules.current.lib.api.configuration);
      this.app = this.helpers.modules.getWebServer(expressApp);
    });

    it('should return 200 if update success', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, requestAsMember) {
        if (err) {
          return done(err);
        }
        var req = requestAsMember(request(self.app).put('/api/configuration/' + domain._id));
        req.send({
          configs: [
            {
              name: 'mail',
              value: {
                mail: {
                  from: 'no-reply@open-paas.org',
                  'no-reply': 'no-reply@open-paas.org'
                },
                transport: {
                  module: 'nodemailer-browser',
                  config: {
                    dir: '/tmp',
                    browser: false
                  }
                },
                from: 'no-reply-updated@open-paas.org'
              }
            }
          ]
        });

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res).to.exist;
          expect(res.body).to.exist;
          expect(res.body[0].name).to.equal('mail');
          expect(res.body[0].value.from).to.equal('no-reply-updated@open-paas.org');
          done();
        });
      });
    });
  });
});
