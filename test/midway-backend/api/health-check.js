const request = require('supertest');
const { expect } = require('chai');

describe('The Health Check API', function() {
  const API_PATH = '/api/healthcheck';
  const TEST_RETURN = ['elasticsearch', 'mongodb', 'rabbitmq', 'redis'];
  const TEST_RETURN_NOT_FOUND = 'not found';

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

  describe('GET /api/healthcheck', function() {
    beforeEach(function(done) {
      core.platformadmin
        .addPlatformAdmin(userPlatformAdmin)
        .then(() => done())
        .catch(err => done(err || 'failed to add platformadmin'));
    });

    it('should send back 200 with public data contains all components health status', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(API_PATH))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(checker(res.body.checks.map(service => service.componentName), TEST_RETURN)).to.be.true;
            done();
          });
      });
    });

    it('should send back 200 with all data contains all components health status when logged in as platform admin', function(done) {
      sendRequestAsUser(userPlatformAdmin, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}`))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            var unhealthyServices = res.body.checks.filter(service => service.status === 'unhealthy');

            if (unhealthyServices.length) {
              expect(unhealthyServices.map(service => Boolean(service.details))).to.have.length.above(0);
            }
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
          expect(checker(res.body.checks.map(service => service.componentName), TEST_RETURN)).to.be.true;
          expect(res.body.checks.filter(service => service.status === 'unhealthy' && Boolean(service.cause))).to.empty;
          done();
        });
    });
  });

  describe('GET /api/healthcheck/:name', function() {
    beforeEach(function(done) {
      core.platformadmin
        .addPlatformAdmin(userPlatformAdmin)
        .then(() => done())
        .catch(err => done(err || 'failed to add platformadmin'));
    });

    it('should send back 200 with data of one single service', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/rabbitmq`))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body.componentName).to.equal('rabbitmq');
            done();
          });
      });
    });

    it('should send back 200 with all data of that one service when current user is platform administrator', function(done) {
      sendRequestAsUser(userPlatformAdmin, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/rabbitmq`))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }

            if (res.body.status === 'unhealthy') {
              expect(res.body.details).to.not.empty;
            }
            done();
          });
      });
    });

    it('should send back 200 with not found status when cannot find service', function(done) {
      sendRequestAsUser(userPlatformAdmin, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/service_cannot_be_found`))
          .expect(200)
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body.status).to.equal(TEST_RETURN_NOT_FOUND);
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
