'use strict';

var expect = require('chai').expect,
    request = require('supertest');

describe('The unifiedinbox API', function() {

  var user;
  var password = 'secret';
  var moduleName = 'linagora.esn.unifiedinbox';

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
        self.models = models;
        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(this.models, done);
  });

  describe('GET /api/inbox/jmap-config', function() {

    beforeEach(function() {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);
      expressApp.use('/', this.helpers.modules.current.lib.api.inbox);
      this.app = this.helpers.modules.getWebServer(expressApp);
    });

    it('should return 401 if not logged in', function(done) {
      this.helpers.api.requireLogin(this.app, 'get', '/api/inbox/jmap-config', done);
    });

    it('should return 404 if the config key does not exist', function(done) {
      var self = this;
      self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
        var req = requestAsMember(request(self.app).get('/api/inbox/jmap-config'));
        req.expect(404, function(err, res) {
          expect(err).to.not.exist;
          expect(res.text).to.equal('the "jmap" config cannot be found');
          done();
        });
      });
    });

    it('should return 200 if the config can be retrieved', function(done) {
      var self = this;
      var conf = this.helpers.modules.current.deps('esn-config')('jmap');

      conf.store({api: 'https://expected.url'}, function(err, saved) {
        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          var req = requestAsMember(request(self.app).get('/api/inbox/jmap-config'));
          req.expect(200, function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.deep.equal({api: 'https://expected.url'});
            done();
          });
        });
      });
    });

  });
});
