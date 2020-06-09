const request = require('supertest');
const { expect } = require('chai');

describe('The Health Check API', function() {
  const API_PATH = '/api/healthcheck';
  const TEST_RETURN = ['elasticsearch', 'mongodb', 'rabbitmq', 'redis'];

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

    it('should send back 200 or 503 with public data contains only global status of all services', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(API_PATH))
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.status).to.be.oneOf([200, 503]);
            expect(res.body.status).to.exist;
            expect(res.body.checks).to.be.undefined;
            done();
          });
      });
    });

    it('should send back 200 or 503 with all data contains all components health status and global status when logged in as platform admin', function(done) {
      sendRequestAsUser(userPlatformAdmin, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}`))
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.status).to.be.oneOf([200, 503]);
            var unhealthyServices = res.body.checks.filter(service => service.status === 'unhealthy');

            if (unhealthyServices.length) {
              expect(unhealthyServices.map(service => Boolean(service.details))).to.have.length.above(0);
            }
            done();
          });
      });
    });

    it('should send back 200 or 503 with public data contains only global status of all services when not logged in', function(done) {
      request(app).get(API_PATH)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          expect(res.status).to.be.oneOf([200, 503]);
          expect(res.body.status).to.exist;
          expect(res.body.checks).to.be.undefined;
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

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', `${API_PATH}/rabbitmq`, done);
    });

    it('should send back 403 if the logged in user is not platformadmin', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/rabbitmq`))
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.status).to.equal(403);
            done();
          });
      });
    });

    it('should send back 200 or 503 with all data of that one service when current user is platform administrator', function(done) {
      sendRequestAsUser(userPlatformAdmin, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/rabbitmq`))
          .end((err, res) => {
            if (err) {
              return done(err);
            }

            expect(res.status).to.be.oneOf([200, 503]);
            if (res.body.status === 'unhealthy') {
              expect(res.body.details).to.not.empty;
            }
            done();
          });
      });
    });

    it('should send back 404 when cannot find service', function(done) {
      sendRequestAsUser(userPlatformAdmin, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/service_cannot_be_found`))
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.status).to.equal(404);
            done();
          });
      });
    });
  });

  describe('GET /api/healthcheck/services', function() {
    beforeEach(function(done) {
      core.platformadmin
        .addPlatformAdmin(userPlatformAdmin)
        .then(() => done())
        .catch(err => done(err || 'failed to add platformadmin'));
    });

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', `${API_PATH}/services`, done);
    });

    it('should send back 403 if the logged in user is not platformadmin', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/services`))
          .end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.status).to.equal(403);
            done();
          });
      });
    });

    it('should send back 200 with all available service names when user is platform admin', function(done) {
      sendRequestAsUser(userPlatformAdmin, requestAsMember => {
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
