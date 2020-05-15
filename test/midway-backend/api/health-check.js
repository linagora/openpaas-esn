const request = require('supertest');
const { expect } = require('chai');

describe('The Health Check API', function() {
  const API_PATH = '/api/healthcheck';
  const TEST_RETURN = ['elasticsearch', 'mongodb', 'rabbitmq', 'redis'];
  const TEST_RETURN_ONLY_RABBITMQ = ['rabbitmq'];
  const TEST_RETURN_NOT_FOUND = [
    {
      componentName: 'rabbit',
      status: 'not found',
      cause: null
    }
  ];

  let app;
  let core;
  let fixtures;
  let helpers;
  let userDomainMember;
  let userPlatformAdmin;
  let webserver;

  beforeEach(function(done) {
    helpers = this.helpers;

    this.mongoose = require('mongoose');

    core = this.testEnv.initCore(() => {
      app = helpers.requireBackend('webserver/application');
      webserver = helpers.requireBackend('webserver').webserver;
      fixtures = helpers.requireFixture('models/users.js')(
        helpers.requireBackend('core/db/mongo/models/user')
      );
      helpers.requireBackend('core/db/mongo/models/domain');

      helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        expect(err).to.not.exist;
        userPlatformAdmin = models.users[0];
        userDomainMember = models.users[1];

        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  function sendRequestAsUser(user, next) {
    helpers.api.loginAsUser(
      webserver.application,
      user.emails[0],
      fixtures.password,
      helpers.callbacks.noErrorAnd(loggedInAsUser => next(loggedInAsUser))
    );
  }

  // Check if array contains all elements of another array
  function checker(arr, target) {
    return target.every(element => arr.includes(element));
  }

  describe('GET /api/healthcheck?cause=false', function() {
    beforeEach(function(done) {
      core.platformadmin
        .addPlatformAdmin(userPlatformAdmin)
        .then(() => done())
        .catch(err => done(err || 'failed to add platformadmin'));
    });

    it('should send back 200 with all components health status', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(API_PATH))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(checker(res.body.checks.map(v => v.componentName), TEST_RETURN)).to.be.true;
            done();
          });
      });
    });

    it('should send back 200 with corresponding components health status when passed component names via query', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}?services=rabbitmq`))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body.checks.map(v => v.componentName)).to.shallowDeepEqual(TEST_RETURN_ONLY_RABBITMQ);
            done();
          });
      });
    });

    it('should send back 200 with not found status when component name is not found or not registered', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}?services=rabbit`))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body.checks).to.shallowDeepEqual(TEST_RETURN_NOT_FOUND);
            done();
          });
      });
    });

    it('should send back 200 with components health status when not logged in', function(done) {
      request(app).get(API_PATH)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(checker(res.body.checks.map(v => v.componentName), TEST_RETURN)).to.be.true;
          expect(res.body.checks.filter(v => v.status === 'unhealthy' && Boolean(v.cause))).to.empty;
          done();
        });
    });
  });

  describe('GET /api/healthcheck?cause=true', function() {
    beforeEach(function(done) {
      core.platformadmin
        .addPlatformAdmin(userPlatformAdmin)
        .then(() => done())
        .catch(err => done(err || 'failed to add platformadmin'));
    });

    it('should send back 401 when not logged in', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/healthcheck?cause=true', done);
    });

    it('should send back 403 when current user is not platform administrator', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}?cause=true`))
          .expect(403)
          .end(err => {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    it('should send back 200 with all components health status includes cause when current user is platform administrator', function(done) {
      sendRequestAsUser(userPlatformAdmin, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}?cause=true`))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            var unhealthyServices = res.body.checks.filter(v => v.status === 'unhealthy');

            if (unhealthyServices.length) {
              expect(unhealthyServices.map(v => Boolean(v.cause))).to.have.length.above(0);
            }
            done();
          });
      });
    });
  });

  describe('GET /api/healthcheck/services', function() {
    it('should send back 200 with all available service names for performing health check', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/services`))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(checker(res.body.services, TEST_RETURN)).to.be.true;
            done();
          });
      });
    });
  });
});
