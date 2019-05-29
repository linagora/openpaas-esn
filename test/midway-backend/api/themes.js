const request = require('supertest');
const { expect } = require('chai');
const ObjectId = require('bson').ObjectId;

describe('The Themes API', function() {
  const API_PATH = '/api/themes';
  const BASE_URL = 'http://localhost:8081/api/files/';

  const TEST_CONFIG = {
    name: 'themes',
    value: {
      logos: {
        logo: '123',
        favicon: '456'
      },
      colors: [
        {
          key: 'primaryColor',
          value: '#2196f3'
        },
        {
          key: 'secondaryColor',
          value: '#FFC107'
        }
      ]
    }
  };
  const REQUEST_BODY = {
    logos: {
      logo: '123',
      favicon: '456'
    },
    colors: [
      {
        key: 'primaryColor',
        value: '#2196f3'
      },
      {
        key: 'secondaryColor',
        value: '#FFC107'
      }
    ]
  };
  const TEST_CONFIG_RETURN = {
    logos: {
      logo: BASE_URL + '123',
      favicon: BASE_URL + '456'
    },
    colors: {
      primaryColor: '#2196f3',
      secondaryColor: '#FFC107'
    }
  };
  const TEST_CONFIG_RETURN_LOGO = BASE_URL + '123';

  const TEST_CONFIG_RETURN_FAVICON = BASE_URL + '456';

  let app;
  let core;
  let domain;
  let fixtures;
  let helpers;
  let userDomainAdmin;
  let userDomainMember;
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
        userDomainAdmin = models.users[0];
        userDomainMember = models.users[1];
        domain = models.domain;

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

  describe('GET /api/themes/:uuid', function() {
    it('should HTTP 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', `${API_PATH}/${domain._id}`, done);
    });

    it('should send back 404 when domain is not found', function(done) {
      sendRequestAsUser(userDomainAdmin, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/` + new ObjectId()))
          .expect(404)
          .end(err => {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    it('should send back 200 with requested configs in body', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain._id);

      config.set(TEST_CONFIG).then(function() {
        sendRequestAsUser(userDomainAdmin, requestAsMember => {
          requestAsMember(request(app).get(`${API_PATH}/${domain._id}`))
            .expect(200)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.body).to.shallowDeepEqual(TEST_CONFIG_RETURN);
              done();
            });
        });
      });
    });
  });

  describe('PUT /api/themes/:uuid', function() {
    it('should HTTP 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'put', `${API_PATH}/${domain._id}`, done);
    });

    it('should send back 403 when current user is not a domain administrator', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).put(`${API_PATH}/${domain._id}`))
          .expect(403)
          .end(err => {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    it('should send back 404 when domain is not found', function(done) {
      sendRequestAsUser(userDomainAdmin, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/` + new ObjectId()))
          .expect(404)
          .end(err => {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    it('should send back 200 with body empty', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain._id);

      config.set(TEST_CONFIG).then(function() {
        sendRequestAsUser(userDomainAdmin, requestAsMember => {
          requestAsMember(request(app).put(`${API_PATH}/${domain._id}`))
            .send(REQUEST_BODY)
            .expect(200)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.body).to.be.empty;
              done();
            });
        });
      });
    });
  });

  describe('GET /api/themes/:uuid/logo', function() {
    it('should HTTP 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', `${API_PATH}/${domain._id}/logo`, done);
    });

    it('should send back 404 when domain is not found', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/` + new ObjectId() + '/logo'))
          .expect(404)
          .end(err => {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    it('should send back 200 with requested configs in body', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain._id);

      config.set(TEST_CONFIG).then(function() {
        sendRequestAsUser(userDomainMember, requestAsMember => {
          requestAsMember(request(app).get(`${API_PATH}/${domain._id}/logo`))
            .expect(302)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res).to.redirect;
              expect(res.headers.location).to.equal(TEST_CONFIG_RETURN_LOGO);
              done();
            });
        });
      });
    });
  });

  describe('GET /api/themes/:uuid/favicon', function() {
    it('should HTTP 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', `${API_PATH}/${domain._id}/favicon`, done);
    });

    it('should send back 404 when domain is not found', function(done) {
      sendRequestAsUser(userDomainMember, requestAsMember => {
        requestAsMember(request(app).get(`${API_PATH}/` + new ObjectId() + '/favicon'))
          .expect(404)
          .end(err => {
            if (err) {
              return done(err);
            }
            done();
          });
      });
    });

    it('should send back 200 with requested configs in body', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain._id);

      config.set(TEST_CONFIG).then(function() {
        sendRequestAsUser(userDomainMember, requestAsMember => {
          requestAsMember(request(app).get(`${API_PATH}/${domain._id}/favicon`))
            .expect(302)
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res).to.redirect;
              expect(res.headers.location).to.equal(TEST_CONFIG_RETURN_FAVICON);
              done();
            });
        });
      });
    });
  });
});
