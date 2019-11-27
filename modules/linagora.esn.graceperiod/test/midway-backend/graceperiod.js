'use strict';

var request = require('supertest');

describe('The graceperiod API', function() {
  var user;
  var password = 'secret';
  var moduleName = 'linagora.esn.graceperiod';

  beforeEach(function(done) {
    var self = this;

    this.mongoose = require('mongoose');

    self.helpers.modules.initMidway(moduleName, function(err) {
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

  describe('DELETE /graceperiod/api/tasks/:id', function() {

    beforeEach(function() {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);

      var api = require('../../backend/webserver/api')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      this.lib = this.helpers.modules.current.lib;
      expressApp.use('/graceperiod/api', api);
      this.app = this.helpers.modules.getWebServer(expressApp);
    });

    it('should return 401 if user is not authenticated', function(done) {
      this.helpers.api.requireLogin(this.app, 'delete', '/graceperiod/api/tasks/123', done);
    });

    it('should return 404 if task is not found', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(self.app).del('/graceperiod/api/tasks/123'));
        req.expect(404).end(done);
      });
    });

    it('should return 403 if task is not the user one', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        self.lib.create(function() {}).then(function(task) {
          var req = loggedInAsUser(request(self.app).del('/graceperiod/api/tasks/' + task.id));
          req.expect(403).end(done);
        }, done);

      });
    });

    it('should return 204 when task is cancelled', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var context = {
          user: user._id
        };

        self.lib.create(function() {}, 10000, context).then(function(task) {
          var req = loggedInAsUser(request(self.app).del('/graceperiod/api/tasks/' + task.id));
          req.expect(204).end(done);
        }, done);
      });
    });
  });
});
