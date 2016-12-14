'use strict';

const expect = require('chai').expect;
const Q = require('q');
const request = require('supertest');
const moduleName = 'linagora.esn.user.status';
const password = 'secret';

describe('The /user-status API', function() {

  var self, user, user1, modelsFixture;

  function startExpressApp() {
    const expressApp = require('../../backend/webserver/application')(self.helpers.modules.current.deps);

    expressApp.use('/', self.helpers.modules.current.lib.api);
    self.app = self.helpers.modules.getWebServer(expressApp);
  }

  function initMidway(done) {
    self.helpers.modules.initMidway(moduleName, function(err) {
      if (err) {
        return done(err);
      }

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        modelsFixture = models;
        user = modelsFixture.users[0];
        user1 = modelsFixture.users[1];
        startExpressApp();
        done();
      });
    });
  }

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(modelsFixture, done);
  });

  describe('GET /user-status/users/:userId', function() {

    it('should return "disconnected" status when requested user does not have status', function(done) {
      self = this;
      initMidway(function() {

        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          var req = requestAsMember(request(self.app).get('/users/' + user._id));

          req.expect(200).end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equals({current_status: 'disconnected'});
            done();
          });
        });
      });
    });

    it('should return the given user status', function(done) {
      const status = 'My status';

      self = this;

      function test() {
        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          var req = requestAsMember(request(self.app).get('/users/' + user1._id));

          req.expect(200).end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equals({current_status: status});
            done();
          });
        });
      }

      initMidway(function() {
        const UserStatus = self.helpers.modules.current.lib.lib.models.userStatus;
        const userStatus = new UserStatus({_id: user1._id, current_status: status});

        userStatus.save().then(test);
      });
    });
  });

  describe('PUT /user-status/user', function() {

    it('should save status for current user', function(done) {
      const status = 'My own status';

      self = this;

      function checkDB() {
        self.helpers.modules.current.lib.lib.models.userStatus.findById(user._id).then(userStatus => {
          if (!userStatus) {
            return done(new Error('Can not find status in DB'));
          }

          expect(userStatus.current_status).to.equal(status);
          done();
        });
      }

      function updateStatus() {
        const defer = Q.defer();

        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          const req = requestAsMember(request(self.app).put('/user/status'));

          req.send({value: status});
          req.expect(204).end(function(err, res) {
            if (err) {
              return defer.reject(err);
            }

            return defer.resolve();
          });
        });

        return defer.promise;
      }

      initMidway(function() {
        const UserStatus = self.helpers.modules.current.lib.lib.models.userStatus;
        const userStatus = new UserStatus({_id: user._id, current_status: status});

        userStatus
          .save()
          .then(updateStatus)
          .then(checkDB)
          .catch(done);
      });
    });
  });
});
