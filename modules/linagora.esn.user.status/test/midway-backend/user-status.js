'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const request = require('supertest');
const Q = require('q');
const moduleName = 'linagora.esn.user.status';
const password = 'secret';

describe('The /user-status API', function() {

  var self, clock, user, user1, modelsFixture;

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

  function startExpressApp() {
    const expressApp = require('../../backend/webserver/application')(self.helpers.modules.current.deps);

    expressApp.use('/', self.helpers.modules.current.lib.api);
    self.app = self.helpers.modules.getWebServer(expressApp);
  }

  afterEach(function(done) {
    if (clock) {
      clock.restore();
    }
    this.helpers.api.cleanDomainDeployment(modelsFixture, done);
  });

  describe('GET /user-status/users/:userId', function() {

    it('should return "connected" if the user was active within the last minute', function(done) {
      self = this;

      initMidway(function() {
        const UserStatus = self.helpers.modules.current.lib.lib.models.userStatus;
        const userStatus = new UserStatus({_id: user1._id, last_update: Date.now()});

        userStatus.save().then(test);
      });

      function test() {
        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          const req = requestAsMember(request(self.app).get('/users/' + user1._id));

          req.expect(200).end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual({_id: String(user1._id), status: 'connected'});
            done();
          });
        });
      }
    });

    it('should return "disconnected" if the user was active more than 1 minute ago', function(done) {
      self = this;

      initMidway(function() {
        clock = sinon.useFakeTimers();
        self.helpers.modules.current.lib.lib.userStatus.updateLastActiveForUser(user1._id, Date.now()).then(test);
      });

      function test() {
        clock.tick(61000);
        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          const req = requestAsMember(request(self.app).get('/users/' + user1._id));

          req.expect(200).end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual({_id: String(user1._id), status: 'disconnected'});
            done();
          });
        });
      }
    });

    it('should return "disconnected" if the user was never active', function(done) {
      self = this;

      initMidway(test);

      function test() {
        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          const req = requestAsMember(request(self.app).get('/users/' + user1._id));

          req.expect(200).end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equal({_id: String(user1._id), status: 'disconnected'});
            done();
          });
        });
      }
    });
  });

  describe('POST /user-status/users', function() {

    it('should return empty array when users never connected', function(done) {
      self = this;

      initMidway(test);

      function test() {
        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          const req = requestAsMember(request(self.app).post('/users'));

          req.send([user._id, user1._id]);

          req.expect(200).end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.deep.equals([]);
            done();
          });
        });
      }

    });

    it('should return the status of all given users', function(done) {
      self = this;

      initMidway(function() {
        const UserStatus = self.helpers.modules.current.lib.lib.models.userStatus;
        const userStatus = new UserStatus({_id: user._id, last_update: Date.now()});
        const userStatus1 = new UserStatus({_id: user1._id, last_update: Date.now()});

        Q.all([userStatus.save(), userStatus1.save()]).then(test, done);
      });

      function test() {
        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          const req = requestAsMember(request(self.app).post('/users'));

          req.send([user._id, user1._id]);

          req.expect(200).end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual([{_id: String(user._id), status: 'connected'}, {_id: String(user1._id), status: 'connected'}]);
            done();
          });
        });
      }
    });

    it('should filter status with valid ids only', function(done) {
      self = this;

      initMidway(function() {
        const UserStatus = self.helpers.modules.current.lib.lib.models.userStatus;
        const userStatus = new UserStatus({_id: user._id, last_update: Date.now()});
        const userStatus1 = new UserStatus({_id: user1._id, last_update: Date.now()});

        Promise.all([userStatus.save(), userStatus1.save()]).then(test, done);
      });

      function test() {
        self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
          const req = requestAsMember(request(self.app).post('/users'));

          req.send([user._id, user1._id, 'wrong id', 'invalid-id']);

          req.expect(200).end(function(err, res) {
            if (err) {
              return done(err);
            }
            expect(res.body).to.shallowDeepEqual([{_id: String(user._id), status: 'connected'}, {_id: String(user1._id), status: 'connected'}]);
            done();
          });
        });
      }
    });
  });
});
