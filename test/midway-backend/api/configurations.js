const expect = require('chai').expect;
const request = require('supertest');

describe('The configurations API', function() {
  const TEST_MODULE = 'test';
  const TEST_CONFIG = {
    name: 'test_config_key',
    value: 'test_config_value'
  };
  let webserver, fixtures, helpers, core, userAlice;

  beforeEach(function(done) {
    helpers = this.helpers;

    this.mongoose = require('mongoose');

    core = this.testEnv.initCore(() => {
      webserver = helpers.requireBackend('webserver').webserver;
      fixtures = helpers.requireFixture('models/users.js')(helpers.requireBackend('core/db/mongo/models/user'));

      fixtures.newDummyUser(['alice@email.com'])
        .save(helpers.callbacks.noErrorAnd(user => {
          userAlice = user;
          core['esn-config'](TEST_CONFIG.name)
            .inModule(TEST_MODULE)
            .forUser(userAlice)
            .store(TEST_CONFIG.value, done);
        }));
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db
      .dropDatabase(helpers.callbacks.noErrorAnd(() => this.mongoose.disconnect(done)));
  });

  function sendRequestAsUser(user, next) {
    helpers.api.loginAsUser(
      webserver.application, user.emails[0], fixtures.password,
      helpers.callbacks.noErrorAnd(loggedInAsUser => next(loggedInAsUser))
    );
  }

  function registerTestConfig(role, rights = 'rw') {
    core['esn-config'].registry.register(TEST_MODULE, {
      configurations: {
        [TEST_CONFIG.name]: {
          rights: {
            [role]: rights
          }
        }
      }
    });
  }

  describe('POST /api/configurations', function() {
    const API_ENDPOINT = '/api/configurations';

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'post', API_ENDPOINT, done);
    });

    it('should send back 400 if scope query is missing', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post(API_ENDPOINT))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'missing scope in query'
              }
            });
            done();
          }));
      });
    });

    it('should send back 400 if scope query is invalid', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
            .post(API_ENDPOINT)
            .query('scope=invalid')
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'scope must be either platform, domain or user'
              }
            });
            done();
          }));
      });
    });

    it('should send back 400 if body is not an array', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
            .post(API_ENDPOINT)
            .query('scope=user')
            .send('not and array')
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'body should be an array'
              }
            });
            done();
          }));
      });
    });

    it('should send back 400 if body array is not well-formed', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
            .post(API_ENDPOINT)
            .query('scope=user')
            .send([{}, { name: TEST_MODULE }])
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'body data is not well-formed: one of modules in array does not have name'
              }
            });
            done();
          }));
      });
    });

    describe('when scope is user', function() {
      it('should send back 400 if there are unreadable configs', function(done) {
        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=user')
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'Configurations are not readable'
                }
              });
              done();
            }));
        });
      });

      it('should send back 200 with requested configs in body', function(done) {
        registerTestConfig('user', 'r');

        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=user')
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual([{
                name: TEST_MODULE,
                configurations: [TEST_CONFIG]
              }]);
              done();
            }));
        });
      });
    });

    describe('when scope is domain', function() {
      let userDomainAdmin, userDomainMember, domain;

      beforeEach(function(done) {
        helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
          expect(err).to.not.exist;
          userDomainAdmin = models.users[0];
          userDomainMember = models.users[1];
          domain = models.domain;
          done();
        });
      });

      it('should send back 400 if domain_id is missing', function(done) {
        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=domain')
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'when scope is domain, domain_id is required'
                }
              });
              done();
            }));
        });
      });

      it('should send back 400 if the domain_id is not an ObjectId', function(done) {
        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=domain')
              .query('domain_id=a_domain_id')
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'domainID is not a valid ObjectId'
                }
              });
              done();
            }));
        });
      });

      it('should send back 404 if no domain found to match with domain_id', function(done) {
        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=domain')
              .query('domain_id=58e522df9ea18136135c02a7')
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(404)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 404,
                  message: 'Not found',
                  details: 'The domain 58e522df9ea18136135c02a7 could not be found'
                }
              });
              done();
            }));
        });
      });

      it('should send back 403 if current user is not the domain admin', function(done) {
        sendRequestAsUser(userDomainMember, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=domain')
              .query(`domain_id=${domain.id}`)
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(403)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 403,
                  message: 'Forbidden',
                  details: 'User is not the domain manager'
                }
              });
              done();
            }));
        });
      });

      it('should send back 400 if there are unreadable configs', function(done) {
        sendRequestAsUser(userDomainAdmin, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=user')
              .query(`domain_id=${domain.id}`)
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'Configurations are not readable'
                }
              });
              done();
            }));
        });
      });

      it('should send back 200 with requested configs in body', function(done) {
        registerTestConfig('admin', 'r');

        sendRequestAsUser(userDomainAdmin, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=domain')
              .query(`domain_id=${domain.id}`)
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual([{
                name: TEST_MODULE,
                configurations: [TEST_CONFIG]
              }]);
              done();
            }));
        });
      });
    });

    describe('when scope is platform', function() {

      let userPlatformAdmin;

      beforeEach(function(done) {
        fixtures.newDummyUser(['platformadmin@email.com']).save(helpers.callbacks.noErrorAnd(user => {
          userPlatformAdmin = user;
          core.platformadmin
            .addPlatformAdmin(user)
            .then(() => done())
            .catch(err => done(err || 'failed to add platformadmin'));
        }));
      });

      it('should send back 403 if current user is not a platform admin', function(done) {
        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=platform')
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(403)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 403,
                  message: 'Forbidden',
                  details: 'To perform this action, you need to be a platformadmin'
                }
              });
              done();
            }));
        });
      });

      it('should send back 400 if there are unreadable configs', function(done) {
        sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=platform')
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'Configurations are not readable'
                }
              });
              done();
            }));
        });
      });

      it('should send back 200 with requested configs in body', function(done) {
        registerTestConfig('padmin', 'r');

        sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=platform')
              .send([{ name: TEST_MODULE, keys: [TEST_CONFIG.name] }])
          )
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual([{
                name: TEST_MODULE,
                configurations: [TEST_CONFIG]
              }]);
              done();
            }));
        });
      });
    });

    describe('when inspect is provided', function() {
      let userDomainMember;

      beforeEach(function(done) {
        helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
          expect(err).to.not.exist;
          userDomainMember = models.users[1];
          done();
        });
      });

      it('should get all readable configurations', function(done) {
        core['esn-config'].registry.register(TEST_MODULE, {
          configurations: {
            readOnlyKey: {
              rights: {
                user: 'r'
              }
            },
            writableKey: {
              rights: {
                user: 'rw'
              }
            },
            unReadableKey: {
              rights: {
                user: ''
              }
            },
            [TEST_CONFIG.name]: {
              rights: {
                user: 'rw'
              }
            }
          }
        });

        sendRequestAsUser(userDomainMember, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .post(API_ENDPOINT)
              .query('scope=user')
              .query('inspect=true')
              .send([{ name: TEST_MODULE, keys: [] }])
          )
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.deep.equal([{
                name: TEST_MODULE,
                configurations: [{
                  name: 'readOnlyKey',
                  writable: false
                }, {
                  name: 'writableKey',
                  writable: true
                }, {
                  name: TEST_CONFIG.name,
                  value: TEST_CONFIG.value,
                  writable: true
                }]
              }]);
              done();
            }));
        });
      });
    });
  });

  describe('PUT /api/configurations', function() {
    const API_ENDPOINT = '/api/configurations';
    const REQUEST_BODY = [{
      name: TEST_MODULE,
      configurations: [{
        name: TEST_CONFIG.name,
        value: 'new value'
      }]
    }];

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'put', API_ENDPOINT, done);
    });

    it('should send back 400 if scope query is missing', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).put(API_ENDPOINT))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'missing scope in query'
              }
            });
            done();
          }));
      });
    });

    it('should send back 400 if scope query is invalid', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
            .put(API_ENDPOINT)
            .query('scope=invalid')
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'scope must be either platform, domain or user'
              }
            });
            done();
          }));
      });
    });

    it('should send back 400 if body is not an array', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
            .put(API_ENDPOINT)
            .query('scope=user')
            .send('not and array')
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'body should be an array'
              }
            });
            done();
          }));
      });
    });

    it('should send back 400 if body array is not well-formed (some modules have no name)', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
            .put(API_ENDPOINT)
            .query('scope=user')
            .send([{}, { name: TEST_MODULE }])
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'body data is not well-formed: one of modules in array does not have name'
              }
            });
            done();
          }));
      });
    });

    it('should send back 400 if body array is not well-formed (some modules have no configurations array)', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
            .put(API_ENDPOINT)
            .query('scope=user')
            .send([{ name: TEST_MODULE, configurations: 'not an array' }])
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: `module ${TEST_MODULE} must have "configurations" attribute as an array of {name, value}`
              }
            });
            done();
          }));
      });
    });

    it('should send back 400 if body array is not well-formed (some configurations have no name)', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
            .put(API_ENDPOINT)
            .query('scope=user')
            .send([{ name: TEST_MODULE, configurations: [{}] }])
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: `module ${TEST_MODULE} must have "configurations" attribute as an array of {name, value}`
              }
            });
            done();
          }));
      });
    });

    describe('The validation', function() {
      it('should send back 400 if configuration value is missing', function(done) {
        core['esn-config'].registry.register(TEST_MODULE, {
          configurations: {
            [TEST_CONFIG.name]: {
              validator() {
                return null;
              }
            }
          }
        });

        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=user')
              .send([{
                name: TEST_MODULE,
                configurations: [{ name: TEST_CONFIG.name }]
              }])
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: `${TEST_MODULE}->${TEST_CONFIG.name}: The value is required`
                }
              });
              done();
            }));
        });
      });

      it('should send back 400 if configuration is considered invalid by the validator', function(done) {
        core['esn-config'].registry.register(TEST_MODULE, {
          configurations: {
            [TEST_CONFIG.name]: {
              validator() {
                return 'invalid value';
              }
            }
          }
        });

        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=user')
              .send([{
                name: TEST_MODULE,
                configurations: [{ name: TEST_CONFIG.name, value: 'aaa' }]
              }])
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: `${TEST_MODULE}->${TEST_CONFIG.name}: invalid value`
                }
              });
              done();
            }));
        });
      });
    });

    describe('when scope is user', function() {
      it('should send back 400 if there are unwritable configs', function(done) {
        registerTestConfig('user', 'r');

        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=user')
              .send(REQUEST_BODY)
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'Configurations are not writable'
                }
              });
              done();
            }));
        });
      });

      it('should send back 204 on success', function(done) {
        registerTestConfig('user', 'w');

        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=user')
              .send(REQUEST_BODY)
          )
            .expect(204)
            .end(helpers.callbacks.noErrorAnd(() => {
              core['esn-config'](TEST_CONFIG.name)
                .inModule(TEST_MODULE)
                .forUser(userAlice, true)
                .get()
                .done(config => {
                  expect(config).to.equal('new value');
                  done();
                });
            }));
        });
      });
    });

    describe('when scope is domain', function() {
      let userDomainAdmin, userDomainMember, domain;

      beforeEach(function(done) {
        registerTestConfig('admin', 'r');

        helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
          expect(err).to.not.exist;
          userDomainAdmin = models.users[0];
          userDomainMember = models.users[1];
          domain = models.domain;
          done();
        });
      });

      it('should send back 400 if domain_id is missing', function(done) {
        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=domain')
              .send(REQUEST_BODY)
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'when scope is domain, domain_id is required'
                }
              });
              done();
            }));
        });
      });

      it('should send back 400 if the domain_id is not an ObjectId', function(done) {
        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=domain')
              .query('domain_id=a_domain_id')
              .send(REQUEST_BODY)
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'domainID is not a valid ObjectId'
                }
              });
              done();
            }));
        });
      });

      it('should send back 404 if no domain found to match with domain_id', function(done) {
        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=domain')
              .query('domain_id=58e522df9ea18136135c02a7')
              .send(REQUEST_BODY)
          )
            .expect(404)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 404,
                  message: 'Not found',
                  details: 'The domain 58e522df9ea18136135c02a7 could not be found'
                }
              });
              done();
            }));
        });
      });

      it('should send back 403 if current user is not the domain admin', function(done) {
        sendRequestAsUser(userDomainMember, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=domain')
              .query(`domain_id=${domain.id}`)
              .send(REQUEST_BODY)
          )
            .expect(403)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 403,
                  message: 'Forbidden',
                  details: 'User is not the domain manager'
                }
              });
              done();
            }));
        });
      });

      it('should send back 400 if there are unwritable configs', function(done) {
        sendRequestAsUser(userDomainAdmin, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=user')
              .query(`domain_id=${domain.id}`)
              .send(REQUEST_BODY)
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'Configurations are not writable'
                }
              });
              done();
            }));
        });
      });

      it('should send back 204 on success', function(done) {
        registerTestConfig('admin', 'w');

        sendRequestAsUser(userDomainAdmin, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=domain')
              .query(`domain_id=${domain.id}`)
              .send(REQUEST_BODY)
          )
            .expect(204)
            .end(helpers.callbacks.noErrorAnd(() => {
              core['esn-config'](TEST_CONFIG.name)
                .inModule(TEST_MODULE)
                .forUser({ preferredDomainId: domain.id })
                .get()
                .done(config => {
                  expect(config).to.equal('new value');
                  done();
                });
            }));
        });
      });
    });

    describe('when scope is platform', function() {

      let userPlatformAdmin;

      beforeEach(function(done) {
        registerTestConfig('padmin', 'r');

        fixtures.newDummyUser(['platformadmin@email.com']).save(helpers.callbacks.noErrorAnd(user => {
          userPlatformAdmin = user;
          core.platformadmin
            .addPlatformAdmin(user)
            .then(() => done())
            .catch(err => done(err || 'failed to add platformadmin'));
        }));
      });

      it('should send back 403 if current user is not a platform admin', function(done) {
        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=platform')
              .send(REQUEST_BODY)
          )
            .expect(403)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 403,
                  message: 'Forbidden',
                  details: 'To perform this action, you need to be a platformadmin'
                }
              });
              done();
            }));
        });
      });

      it('should send back 400 if there are unwritable configs', function(done) {
        sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=platform')
              .send(REQUEST_BODY)
          )
            .expect(400)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'Configurations are not writable'
                }
              });
              done();
            }));
        });
      });

      it('should send back 204 on success', function(done) {
        registerTestConfig('padmin', 'w');

        sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
          loggedInAsUser(
            request(webserver.application)
              .put(API_ENDPOINT)
              .query('scope=platform')
              .send(REQUEST_BODY)
          )
            .expect(204)
            .end(helpers.callbacks.noErrorAnd(() => {
              core['esn-config'](TEST_CONFIG.name)
                .inModule(TEST_MODULE)
                .get()
                .done(config => {
                  expect(config).to.equal('new value');
                  done();
                });
            }));
        });
      });
    });

  });

});
