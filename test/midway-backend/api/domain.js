const request = require('supertest'),
    expect = require('chai').expect,
    ObjectId = require('bson').ObjectId;

describe.skip('The domain API', function() {
  const API_PATH = '/api/domains';
  let app;
  let user1Domain1Manager, user2Domain1Member;
  let user1Domain2Manager;
  let domain1, domain2;
  let domain1Users;
  const password = 'secret';
  let Domain;
  let userDenormalize;
  let helpers;
  let core;

  beforeEach(function(done) {
    helpers = this.helpers;
    const self = this;

    self.mongoose = require('mongoose');

    core = self.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      Domain = helpers.requireBackend('core/db/mongo/models/domain');
      userDenormalize = helpers.requireBackend('core/user/denormalize').denormalize;
      helpers.requireBackend('core/elasticsearch/pubsub').init();

      helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        expect(err).to.not.exist;
        user1Domain1Manager = models.users[0];
        user2Domain1Member = models.users[1];
        domain1 = models.domain;
        domain1Users = models.users.map(userDenormalize).map(helpers.toComparableObject);

        helpers.api.applyDomainDeployment('linagora_test_domain2', function(err, models2) {
          expect(err).to.not.exist;
          user1Domain2Manager = models2.users[0];
          domain2 = models2.domain;

          helpers.elasticsearch.saveTestConfiguration(helpers.callbacks.noError(done));
        });
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/domains', function() {
    let domains;

    beforeEach(function(done) {
      core.platformadmin
        .addPlatformAdmin(user2Domain1Member)
        .then(() => done())
        .catch(err => done(err || 'failed to add platformadmin'));

      domains = [getDomainObjectFromModel(domain2), getDomainObjectFromModel(domain1)];
    });

    function getDomainObjectFromModel(domainModelObject) {
      const domain = JSON.parse(JSON.stringify(domainModelObject)); // Because model object use original type like Bson, Date

      return {
        name: domain.name,
        company_name: domain.company_name,
        timestamps: domain.timestamps
      };
    }

    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/domains', done);
    });

    it('should send back 403 if the logged in user is not platformadmin', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).get('/api/domains'))
          .expect(403)
          .end(helpers.callbacks.noError(done));
      });
    });

    it('should send back 200 with a list of sorted domains', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).get('/api/domains'))
        .expect(200)
        .end(helpers.callbacks.noErrorAnd(res => {
          expect(res.headers['x-esn-items-count']).to.equal(`${domains.length}`);
          expect(res.body).to.shallowDeepEqual(domains);
          done();
        }));
      }));
    });

    it('should send back 200 with the first domain', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        const LIMIT = 1;
        const expectedDomains = domains.slice(0, 1);
        const req = loggedInAsUser(request(app).get('/api/domains'));

        req.query({ limit: LIMIT })
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.exist;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(`${LIMIT}`);
            expect(res.body).to.shallowDeepEqual(expectedDomains);
            done();
        }));
      }));
    });

    it('should send back 200 with the last domain', function(done) {
      const OFFSET = 1;
      const expectedDomains = domains.slice(1, 2);

      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        const req = loggedInAsUser(request(app).get('/api/domains'));

        req.query({ offset: OFFSET })
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.exist;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(`${expectedDomains.length}`);
            expect(res.body).to.shallowDeepEqual(expectedDomains);
            done();
          }));
      }));
    });

    it('should send back 200 with the second domain', function(done) {
      const OFFSET = 1;
      const LIMIT = 1;
      const expectedDomains = domains.slice(1, 2);

      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        const req = loggedInAsUser(request(app).get('/api/domains'));

        req.query({ limit: LIMIT, offset: OFFSET })
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.exist;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(`${LIMIT}`);
            expect(res.body).to.shallowDeepEqual(expectedDomains);
            done();
          }));
      }));
    });

    describe('List domains with name query', function() {
      it('should send back 200 with a list of domains filtered by name', function(done) {
        helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get(`/api/domains?name=${domain2.name}`))
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual([getDomainObjectFromModel(domain2)]);
            done();
          }));
        }));
      });

      it('should send back 200 with an empty list if there is no domain is found', function(done) {
        helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get('/api/domains?name=abc.com'))
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual([]);
            done();
          }));
        }));
      });
    });

    describe('List domains with hostname query', function() {
      it('should send back 200 with a list of domains filtered by hostname', function(done) {
        helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get(`/api/domains?hostname=${domain1.hostnames[0]}`))
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual([getDomainObjectFromModel(domain1)]);
              done();
            }));
        }));
      });

      it('should send back 200 with an empty list if there is no domain is found', function(done) {
        helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get('/api/domains?hostname=abc.com'))
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.body).to.shallowDeepEqual([]);
              done();
            }));
        }));
      });
    });
  });

  describe('POST /api/domains', function() {
    let platformAdmin;

    beforeEach(function(done) {
      const fixtures = helpers.requireFixture('models/users.js')(helpers.requireBackend('core/db/mongo/models/user'));

      fixtures.newDummyUser(['platformadmin@email.com'])
        .save(helpers.callbacks.noErrorAnd(user => {
          platformAdmin = user;

          core.platformadmin
            .addPlatformAdmin(platformAdmin)
            .then(() => done())
            .catch(err => done(err || 'failed to add platformadmin'));
        }));
    });

    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/domains', done);
    });

    it('should send back 403 if the logged in user is not platformadmin', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).post('/api/domains'))
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

    it('should send back 400 when domain name is not set', function(done) {
      const json = {
        company_name: 'Corporate'
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(json))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'Domain does not have name'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 400 when company name is not set', function(done) {
      const json = {
        name: 'Marketing'
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(json))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'Domain does not have company name'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 400 when administrator is not set', function(done) {
      const json = {
        name: 'Marketing',
        company_name: 'Corporate'
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(json))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'An administrator is required'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 400 when administrator user does not have any email address', function(done) {
      const user = {
        password: 'secret'
      };
      const domain = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: user
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(domain))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'Administrator does not have any email address'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 400 when administrator user does not have password', function(done) {
      const user = {
        email: 'abc@email.com'
      };
      const domain = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: user
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(domain))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'Administrator does not have password'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 400 when administrator email is not valid', function(done) {
      const user = {
        email: 'invalid email',
        password: 'secret'
      };
      const domain = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: user
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(domain))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'Administrator email is not valid'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 409 when hostname is already used by another domain', function(done) {
      const alreadyUsedHostname = {
        name: 'Marketing',
        company_name: 'Corporate',
        hostnames: ['openpaas']
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(alreadyUsedHostname))
          .expect(409)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 409,
                message: 'Conflict',
                details: 'Hostname openpaas is already in use'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 400 when hostnames is not an array', function(done) {
      const notAnArrayHostnames = {
        name: 'Marketing',
        company_name: 'Corporate',
        hostnames: 'not array'
      };
      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(notAnArrayHostnames))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'Hostnames must be an array!'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 201, create a domain with right administrator', function(done) {
      const user = {
        email: 'abc@email.com',
        password: 'secret'
      };

      const json = {
        name: 'Marketing',
        company_name: 'Corporate',
        hostnames: ['hostname'],
        administrator: user
      };

      const coreUser = helpers.requireBackend('core/user');

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(json))
        .expect(201)
        .end(helpers.callbacks.noErrorAnd(response => {
          expect(response.body).to.shallowDeepEqual({
            name: 'marketing',
            company_name: 'corporate'
          });

          Domain.findOne({ name: 'marketing', company_name: 'corporate' }, helpers.callbacks.noErrorAnd(doc => {
            expect(doc).to.exist;

            coreUser.findByEmail(user.email, helpers.callbacks.noErrorAnd(administrator => {
             expect(doc).to.shallowDeepEqual({
               name: 'marketing',
               company_name: 'corporate',
               hostnames: ['hostname'],
               administrators: [{
                 user_id: `${administrator._id}`
               }]
             });
             done();
           }));
          }));
        }));
      }));
    });

    it('should send back 409 when administrator email is already used', function(done) {
      const user = {
        email: user2Domain1Member.emails[0],
        password: 'secret'
      };

      const json = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: user
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post('/api/domains').send(json))
        .expect(409)
        .end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.shallowDeepEqual({
            error: {
              code: 409,
              message: 'Conflict',
              details: 'Administrator email is already used'
            }
          });

          Domain.findOne({ name: 'marketing', company_name: 'corporate' }, helpers.callbacks.noErrorAnd(doc => {
            expect(doc).to.not.exist;
            done();
          }));
        }));
      }));
    });
  });

  describe('PUT /api/domains/:uuid', function() {
    let platformAdmin;

    beforeEach(function(done) {
      const fixtures = helpers.requireFixture('models/users.js')(helpers.requireBackend('core/db/mongo/models/user'));

      fixtures.newDummyUser(['platformadmin@email.com'])
        .save(helpers.callbacks.noErrorAnd(user => {
          platformAdmin = user;

          core.platformadmin
            .addPlatformAdmin(platformAdmin)
            .then(() => done())
            .catch(err => done(err || 'failed to add platformadmin'));
        }));
    });

    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'put', `${API_PATH}/${domain1._id}`, done);
    });

    it('should send back 403 if the logged in user is not platformadmin', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).put(`${API_PATH}/${domain1._id}`))
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

    it('should send back 404 when domain is not found', function(done) {
      const notExistedDomainId = new ObjectId();
      const modifiedDomain = {
        company_name: 'new_company_name'
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).put(`${API_PATH}/${notExistedDomainId}`).send(modifiedDomain))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 404,
                message: 'Not Found',
                details: `No domain found for id: ${notExistedDomainId}`
              }
            });
            done();
          }));
      }));
    });

    it('should send back 400 when company name and hostnames not set', function(done) {
      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).put(`${API_PATH}/${domain1._id}`).send())
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'Company name or hostnames are required'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 409 when hostname is already used by another domain', function(done) {
      const alreadyUsedHostname = {
        hostnames: ['openpaas']
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).put(`${API_PATH}/${domain2._id}`).send(alreadyUsedHostname))
          .expect(409)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 409,
                message: 'Conflict',
                details: 'Hostname openpaas is already in use'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 400 when hostnames is not an array', function(done) {
      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).put(`${API_PATH}/${domain2._id}`).send({ hostnames: 'not an array' }))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 400,
                message: 'Bad Request',
                details: 'Hostnames must be an array!'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 404 when domain id is invalid', function(done) {
      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).put(`${API_PATH}/invalid_id`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              error: {
                code: 404,
                message: 'Not Found',
                details: 'Domain not found'
              }
            });
            done();
          }));
      }));
    });

    it('should send back 204 on successful update company name', function(done) {
      const modifiedDomain = {
        company_name: 'new_company_name'
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).put(`${API_PATH}/${domain1._id}`).send(modifiedDomain))
        .expect(204)
        .end(helpers.callbacks.noError(() => {
          Domain.findById(domain1._id, helpers.callbacks.noErrorAnd(doc => {
            expect(doc.company_name).to.equal('new_company_name');
            done();
          }));
        }));
      }));
    });

    it('should send back 204 on successful update hostnames', function(done) {
      const modifiedDomain = {
        hostnames: ['new_hostname']
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).put(`${API_PATH}/${domain1._id}`).send(modifiedDomain))
          .expect(204)
          .end(helpers.callbacks.noError(() => {
            Domain.findById(domain1._id, helpers.callbacks.noErrorAnd(doc => {
              expect(doc.hostnames[0]).to.equal('new_hostname');
              done();
            }));
          }));
      }));
    });

    it('should send back 204 on successful update company name and hostnames', function(done) {
      const modifiedDomain = {
        company_name: 'new_company_name',
        hostnames: ['new_hostname']
      };

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).put(`${API_PATH}/${domain1._id}`).send(modifiedDomain))
          .expect(204)
          .end(helpers.callbacks.noError(() => {
            Domain.findById(domain1._id, helpers.callbacks.noErrorAnd(doc => {
              expect(doc.hostnames[0]).to.equal('new_hostname');
              expect(doc.company_name).to.equal('new_company_name');
              done();
            }));
          }));
      }));
    });

    it('should publish a domain:updated event on successully updated a domain', function(done) {
      const pubsub = this.helpers.requireBackend('core').pubsub.local;
      const { EVENTS } = this.helpers.requireBackend('core/domain/constants');
      const modifiedDomain = {
        company_name: 'new_company_name',
        hostnames: ['new_hostname']
      };

      pubsub.topic(EVENTS.UPDATED).subscribe(data => {
        expect(data.payload.company_name).to.equal(modifiedDomain.company_name);
        expect(data.payload.hostnames).to.deep.equal(modifiedDomain.hostnames);

        done();
      });

      helpers.api.loginAsUser(app, platformAdmin.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).put(`${API_PATH}/${domain1._id}`).send(modifiedDomain))
          .expect(204)
          .end(err => {
            if (err) return done(err);
          });
      }));
    });
  });

  describe('GET /api/domains/:uuid', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/domains/' + domain1._id, done);
    });

    it('should send back 404 when domain is not found', function(done) {
      const notExistedDomainId = new ObjectId();

      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).get(`${API_PATH}/${notExistedDomainId}`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 404,
                message: 'Not Found',
                details: `No domain found for id: ${notExistedDomainId}`
              }
            });
            done();
          }));
      }));
    });

    it('should send back 403 when current user is not domain member', function(done) {
      helpers.api.loginAsUser(app, user1Domain2Manager.emails[0], password, function(err, loggedInAsUser) {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).get('/api/domains/' + domain1._id)).expect(403).end(done);
      });
    });

    it('should send back 200 with domain information when current user is domain manager', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).get('/api/domains/' + domain1._id)).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.shallowDeepEqual({name: domain1.name, company_name: domain1.company_name});
          done();
        });
      });
    });

    it('should send back 200 with domain information when current user is domain member', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, loggedInAsUser) {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).get('/api/domains/' + domain1._id)).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.shallowDeepEqual({name: domain1.name, company_name: domain1.company_name});
          done();
        });
      });
    });

    it('should send back 400 when domain ID is not a valid ObjectId', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, loggedInAsUser) {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).get('/api/domains/invalid')).expect(400).end(helpers.callbacks.noError(done));
      });
    });
  });

  describe('GET /api/domains/:uuid/members', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/domains/' + domain1._id + '/members', done);
    });

    it('should send back 404 when domain is not found', function(done) {
      const notExistedDomainId = new ObjectId();

      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        requestAsMember(request(app).get(`/api/domains/${notExistedDomainId}/members`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 404,
                message: 'Not Found',
                details: `No domain found for id: ${notExistedDomainId}`
              }
            });
            done();
          }));
      });
    });

    it('should send back 403 when domain members search disabled searchable members', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`))
          .query({ search: 'lng', includesDisabledSearchable: true })
          .expect(403).end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 403,
                message: 'Forbidden',
                details: 'User is not the domain manager'
              }
            });

            done();
          }));
      }));
    });

    it('should send back 403 if domain members trying to ignore the membersCanBeSearched configuration', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
        requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`))
          .query({ search: 'lng', ignoreMembersCanBeSearchedConfiguration: true })
          .expect(403).end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.deep.equal({
            error: {
              code: 403,
              message: 'Forbidden',
              details: 'User is not the domain manager'
            }
          });

          done();
        }));
      }));
    });

    it('should send back 200 with empty array if membersCanBeSearched configuration is disabled', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain1._id);

      config.set({ name: 'membersCanBeSearched', value: false }).then(function() {
        helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
          expect(err).to.not.exist;
          const req = requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`));

          req.expect(200).end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(0 + '');
            expect(res.body).to.shallowDeepEqual([]);

            done();
          });
        });
      });
    });

    it('should send back 200 empty search result if membersCanBeSearched configuration is disabled', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain1._id);

      config.set({ name: 'membersCanBeSearched', value: false }).then(function() {
        helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
          expect(err).to.not.exist;
          const req = requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`));

          req.query({ search: 'lng' });
          req.expect(200).end(helpers.callbacks.noErrorAnd(res => {
            expect(err).to.not.exist;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(0 + '');
            expect(res.body).to.shallowDeepEqual([]);

            done();
          }));
        });
      });
    });

    it('should send back 200 with domain members if membersCanBeSearched configuration is disabled but the domain manager is ignoring it ', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain1._id);

      config.set({ name: 'membersCanBeSearched', value: false }).then(function() {
        helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
          expect(err).to.not.exist;
          const req = requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`));

          req.query({ ignoreMembersCanBeSearchedConfiguration: true });
          req.expect(200).end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');
            expect(res.body).to.shallowDeepEqual(domain1Users.map(user => ({ id: user.id })));

            done();
          });
        });
      });
    });

    it('should send back 200 with search matching members if membersCanBeSearched configuration is disabled but the domain manager is ignoring it ', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain1._id);
      const ids = domain1Users.map(user => user._id);

      helpers.elasticsearch.checkUsersDocumentsIndexed(ids, function(err) {
        expect(err).to.not.exist;

        config.set({ name: 'membersCanBeSearched', value: false }).then(function() {
          helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
            expect(err).to.not.exist;
            const req = requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`));

            req.query({ search: 'lng', ignoreMembersCanBeSearchedConfiguration: true });
            req.expect(200).end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.exist;
              const expectedUsers = domain1Users.slice(0, 3).map(user => ({ _id: user.id }));

              expect(res.headers['x-esn-items-count']).to.exist;
              expect(res.headers['x-esn-items-count']).to.equal(expectedUsers.length + '');
              expect(res.body).to.shallowDeepEqual(expectedUsers);

              done();
            });
          });
        });
      });
    });

    it('should send back 200 with domain members if membersCanBeSearched configuration is enabled', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain1._id);

      config.set({ name: 'membersCanBeSearched', value: true }).then(function() {
        helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
          expect(err).to.not.exist;
          const req = requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`));

          req.expect(200).end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');
            expect(res.body).to.shallowDeepEqual(domain1Users.map(user => ({ id: user.id })));

            done();
          });
        });
      });
    });

    it('should send back 200 with search matching members if membersCanBeSearched configuration is enabled', function(done) {
      const config = new core['esn-config'].EsnConfig('core', domain1._id);
      const ids = domain1Users.map(user => user._id);

      helpers.elasticsearch.checkUsersDocumentsIndexed(ids, function(err) {
        expect(err).to.not.exist;

        config.set({ name: 'membersCanBeSearched', value: true }).then(function() {
          helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, requestAsMember) {
            expect(err).to.not.exist;
            const req = requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`));

            req.query({search: 'lng'}).expect(200).end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.exist;
              const expectedUsers = domain1Users.slice(0, 3).map(user => ({ _id: user.id }));

              expect(res.headers['x-esn-items-count']).to.exist;
              expect(res.headers['x-esn-items-count']).to.equal(expectedUsers.length + '');
              expect(res.body).to.shallowDeepEqual(expectedUsers);

              done();
            });
          });
        });
      });
    });

    it('should send back 200 with all the members of the domain and contain the list size in the header', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.headers['x-esn-items-count']).to.exist;
          expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');

          const expectedBody = domain1Users.map(user => ({ id: user.id }));

          expect(res.body).to.shallowDeepEqual(expectedBody);
          done();
        });
      });
    });

    it('should send back 200 with all the members of the domain and members should have an emails field', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(function(requestAsMember) {
        requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'))
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(function(res) {
            res.body.forEach(function(user) {
              expect(user.emails.length).to.equal(1);
            });

            done();
          }));
      }));
    });

    it('should send back 200 with all the members matching the search terms', function(done) {
      var ids = domain1Users.map(function(user) {
        return user._id;
      });
      helpers.elasticsearch.checkUsersDocumentsIndexed(ids, function(err) {
        expect(err).to.not.exist;

        helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
          expect(err).to.not.exist;
          var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
          req.query({search: 'lng'}).expect(200).end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            var expectedUsers = domain1Users.slice(0, 3).map(user => ({ _id: user.id }));
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(expectedUsers.length + '');
            expect(res.body).to.shallowDeepEqual(expectedUsers);
            done();
          });
        });
      });
    });

    it('should send back 200 with all the members matching the search terms and members should have an emails field', function(done) {
      var ids = domain1Users.map(function(user) { return user._id; });

      helpers.elasticsearch.checkUsersDocumentsIndexed(ids, helpers.callbacks.noErrorAnd(function() {
        helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(function(requestAsMember) {
          requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'))
            .query({search: 'lng'})
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(function(res) {
              res.body.forEach(function(user) {
                expect(user.emails.length).to.equal(1);
              });

              done();
            }));
        }));
      }));
    });

    it('should send back 200 with the first 2 members', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
        req.query({limit: 2}).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.headers['x-esn-items-count']).to.exist;
          expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');
          var expectedUsers = domain1Users.slice(0, 2).map(user => ({ id: user.id }));
          expect(res.body).to.shallowDeepEqual(expectedUsers);
          done();
        });
      });
    });

    it('should send back 200 with the last 2 members', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
        req.query({offset: 2}).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.headers['x-esn-items-count']).to.exist;
          expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');
          var expectedUsers = domain1Users.slice(2, 4).map(user => ({ id: user.id }));
          expect(res.body).to.shallowDeepEqual(expectedUsers);
          done();
        });
      });
    });

    it('should send back 200 with the third member', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/members'));
        req.query({limit: 1, offset: 2}).expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.headers['x-esn-items-count']).to.exist;
          expect(res.headers['x-esn-items-count']).to.equal(domain1Users.length + '');
          var expectedUsers = domain1Users.slice(2, 3).map(user => ({ id: user.id }));
          expect(res.body).to.shallowDeepEqual(expectedUsers);
          done();
        });
      });
    });

    it('should send back 200 with all the members matching the search terms which includes disabled searchable members if requester is domain administrator and includesDisabledSearchable query is true', function(done) {
      core.user.updateStates(
        user2Domain1Member._id,
        [{ name: 'searchable', value: 'disabled' }],
        helpers.callbacks.noErrorAnd(() => {
          helpers.elasticsearch.checkUsersDocumentsIndexed([user2Domain1Member._id], helpers.callbacks.noErrorAnd(function() {
            helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
              requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`))
                .query({ search: 'lng', includesDisabledSearchable: true })
                .expect(200).end(helpers.callbacks.noErrorAnd(res => {
                  expect(res.headers['x-esn-items-count']).to.equal('3');
                  expect(res.body).shallowDeepEqual([{
                    _id: domain1Users[0]._id
                  }, {
                    _id: String(user2Domain1Member._id)
                  }, {
                    _id: domain1Users[2]._id
                  }]);

                  done();
                }));
            }));
          }));
        })
      );
    });

    it('should send back 200 with all the members matching the search terms which searchable feature is not disabled', function(done) {
      core.user.updateStates(
        user2Domain1Member._id,
        [{ name: 'searchable', value: 'disabled' }],
        helpers.callbacks.noErrorAnd(() => {
          helpers.elasticsearch.checkUsersDocumentsIndexed([user2Domain1Member._id], helpers.callbacks.noErrorAnd(function() {
            helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
              requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`))
                .query({ search: 'lng' })
                .expect(200).end(helpers.callbacks.noErrorAnd(res => {
                  expect(res.headers['x-esn-items-count']).to.equal('2');
                  expect(res.body).shallowDeepEqual([{
                    _id: domain1Users[0]._id
                  }, {
                    _id: domain1Users[2]._id
                  }]);

                  done();
                }));
            }));
          }));
        })
      );
    });

    it('should send back 200 with all domain members excluding members that have searchable feature disabled when listing domain members', function(done) {
      core.user.updateStates(
        user2Domain1Member._id,
        [{ name: 'searchable', value: 'disabled' }],
        helpers.callbacks.noErrorAnd(() => {
          helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
            requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`))
              .expect(200).end(helpers.callbacks.noErrorAnd(res => {
              expect(res.headers['x-esn-items-count']).to.equal('3');
              expect(res.body).shallowDeepEqual([
                { _id: domain1Users[0]._id },
                { _id: domain1Users[2]._id },
                { _id: domain1Users[3]._id }
              ]);

              done();
            }));
          }));
        })
      );
    });

    it('should send back 200 with all domain members including members that have searchable feature disabled when listing domain members with includesDisabledSearchable query is true', function(done) {
      core.user.updateStates(
        user2Domain1Member._id,
        [{ name: 'searchable', value: 'disabled' }],
        helpers.callbacks.noErrorAnd(() => {
          helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(requestAsMember => {
            requestAsMember(request(app).get(`/api/domains/${domain1._id}/members`))
              .query({ includesDisabledSearchable: true })
              .expect(200).end(helpers.callbacks.noErrorAnd(res => {
              expect(res.headers['x-esn-items-count']).to.equal('4');
              expect(res.body).shallowDeepEqual([
                { _id: domain1Users[0]._id },
                { _id: String(user2Domain1Member._id) },
                { _id: domain1Users[2]._id },
                { _id: domain1Users[3]._id }
              ]);

              done();
            }));
          }));
        })
      );
    });

    it('should send back 400 when domain ID is not a valid ObjectId', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, loggedInAsUser) {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).get('/api/domains/invalid')).expect(400).end(helpers.callbacks.noError(done));
      });
    });
  });

  describe('HEAD /api/domains/:uuid/members', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'head', `/api/domains/${domain1._id}/members`, done);
    });

    it('should send back 404 when domain is not found', function(done) {
      const notExistedDomainId = new ObjectId();

      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        requestAsMember(request(app).head(`/api/domains/${notExistedDomainId}/members`))
          .expect(404)
          .end(done);
      });
    });

    it('should send back 403 when current user is not domain member', function(done) {
      helpers.api.loginAsUser(app, user1Domain2Manager.emails[0], password, (err, loggedInAsUser) => {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).head(`/api/domains/${domain1._id}/members`)).expect(403).end(done);
      });
    });

    it('should send back valid HTTP headers', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, (err, requestAsMember) => {
        expect(err).to.not.exist;

        requestAsMember(request(app).head(`/api/domains/${domain1._id}/members`))
          .expect(200).end((err, res) => {
            expect(err).to.not.exist;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal(String(domain1Users.length));

            done();
          });
      });
    });
  });

  describe('GET /api/domains/:uuid/manager', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/domains/' + domain1._id + '/manager', done);
    });

    it('should send back 404 when domain is not found', function(done) {
      const notExistedDomainId = new ObjectId();

      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        requestAsMember(request(app).get(`/api/domains/${notExistedDomainId}/manager`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 404,
                message: 'Not Found',
                details: `No domain found for id: ${notExistedDomainId}`
              }
            });
            done();
          }));
      });
    });

    it('should send back 403 when current user is not a domain manager', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/manager'));
        req.expect(403).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          expect(res.body.error).to.deep.equal({
            code: 403,
            message: 'Forbidden',
            details: 'User is not the domain manager'
          });
          done();
        });
      });
    });

    it('should send back 200 with the domain information when current user is a domain manager', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/manager'));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          expect(res.body).to.shallowDeepEqual({name: domain1.name, company_name: domain1.company_name});
          done();
        });
      });
    });
  });

  describe('POST /api/domains/:uuid/members', function() {
    var newUser;

    beforeEach(function() {
      newUser = {
        password: 'secret',
        firstname: 'new',
        lastname: 'member',
        accounts: [{
          type: 'email',
          hosted: true,
          preferredEmailIndex: 0,
          emails: ['newMember@lng.net']
        }]
      };
    });

    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'post', '/api/domains/' + domain1._id + '/members', done);
    });

    it('should send back 400 when request body empty', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/members'));
        req.send({});
        req.expect(400).end(done);
      });
    });

    it('should send back 400 when domain ID is not a valid ObjectId', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, loggedInAsUser) {
        expect(err).to.not.exist;
        loggedInAsUser(request(app).get('/api/domains/invalid')).expect(400).end(helpers.callbacks.noError(done));
      });
    });

    it('should send back 403 when current user is not a domain manager', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/members'));
        req.expect(403).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          expect(res.body.error).to.deep.equal({
            code: 403,
            message: 'Forbidden',
            details: 'User is not the domain manager'
          });
          done();
        });
      });
    });

    it('should send back 409 if email is already in use', function(done) {
      newUser.accounts[0].emails[0] = user1Domain1Manager.emails[0];

      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/members'));
        req.send(newUser);
        req.expect(409).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          expect(res.body.error).to.deep.equal({
            code: 409,
            message: 'Conflict',
            details: `Emails already in use: ${newUser.accounts[0].emails[0]}`
          });
          done();
        });
      });
    });

    it('should send back 404 when domain is not found', function(done) {
      const notExistedDomainId = new ObjectId();

      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        requestAsMember(request(app).post(`/api/domains/${notExistedDomainId}/members`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 404,
                message: 'Not Found',
                details: `No domain found for id: ${notExistedDomainId}`
              }
            });
            done();
          }));
      });
    });

    it('should send back 500 when save fail', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/members'));
        req.send({user: 'invalid user'});
        req.expect(500).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          expect(res.body.error.code).to.equal(500);
          done();
        });
      });
    });

    it('should send back 201 when create success', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/members'));
        req.send(newUser);
        req.expect(201).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exists;
          done();
        });
      });
    });
  });

  describe('GET /api/domains/:uuid/administrators', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/domains/' + domain1._id + '/administrators', done);
    });

    it('should send back 403 when current user is not a domain administrator', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(function(requestAsMember) {
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/administrators'));
        req.expect(403).end(helpers.callbacks.noErrorAnd(function(res) {
          expect(res.body).to.exists;
          expect(res.body.error).to.deep.equal({
            code: 403,
            message: 'Forbidden',
            details: 'User is not the domain manager'
          });
          done();
        }));
      }));
    });

    it('should send back 404 when domain is not found', function(done) {
      const notExistedDomainId = new ObjectId();

      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(function(requestAsMember) {
        requestAsMember(request(app).get(`/api/domains/${notExistedDomainId}/administrators`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 404,
                message: 'Not Found',
                details: `No domain found for id: ${notExistedDomainId}`
              }
            });
            done();
          }));
      }));
    });

    it('should send back 400 when dpmain ID is not a valid ObjectId', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(function(requestAsMember) {
        var req = requestAsMember(request(app).get('/api/domains/invalid/administrators'));

        req.expect(400).end(helpers.callbacks.noError(done));
      }));
    });

    it('should send back 200 when get success', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(function(requestAsMember) {
        var req = requestAsMember(request(app).get('/api/domains/' + domain1._id + '/administrators'));

        req.expect(200).end(helpers.callbacks.noErrorAnd(function(res) {
          expect(res.body).to.shallowDeepEqual([
            {
              _id: user1Domain1Manager.id,
              role: {
                timestamps: {},
                user_id: user1Domain1Manager.id
              }
            }
          ]);
          done();
        }));
      }));
    });

  });

  describe('POST /api/domains/:uuid/administrators', function() {

    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'post', '/api/domains/' + domain1._id + '/administrators', done);
    });

    it('should send back 400 when request body is not an array', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/administrators'));

        req.send({});
        req.expect(400).end(helpers.callbacks.noErrorAnd(function(res) {
          expect(res.body.error.code).to.equal(400);
          done();
        }));
      });
    });

    it('should send back 403 when current user is not a domain manager', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/administrators'));

        req.expect(403).end(helpers.callbacks.noErrorAnd(function(res) {
          expect(res.body.error).to.deep.equal({
            code: 403,
            message: 'Forbidden',
            details: 'User is not the domain manager'
          });
          done();
        }));
      });
    });

    it('should send back 404 when domain is not found', function(done) {
      const notExistedDomainId = new ObjectId();

      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        requestAsMember(request(app).post(`/api/domains/${notExistedDomainId}/administrators`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 404,
                message: 'Not Found',
                details: `No domain found for id: ${notExistedDomainId}`
              }
            });
            done();
          }));
      });
    });

    it('should send back 500 when server fails (userID is invalid)', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/administrators'));

        req.send(['invalid userID']);
        req.expect(500).end(helpers.callbacks.noErrorAnd(function(res) {
          expect(res.body.error.code).to.equal(500);
          done();
        }));
      });
    });

    it('should send back 204 on success', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).post('/api/domains/' + domain1._id + '/administrators'));

        req.send([user2Domain1Member._id]);
        req.expect(204).end(helpers.callbacks.noErrorAnd(function(res) {
          expect(res.body).to.not.exists;
          Domain.findById(domain1._id, function(err, domain) {
            expect(domain.administrator).to.not.exist;
            expect(domain.administrators.some(function(administrator) {
              return administrator.user_id.equals(user2Domain1Member._id);
            })).to.be.true;
            done(err);
          });
        }));
      });
    });

  });

  describe('DELETE /api/domains/:uuid/administrators/:administratorId', function() {

    var endpoint;

    beforeEach(function() {
      endpoint = '/api/domains/' + domain1._id + '/administrators/' + user1Domain1Manager._id;
    });

    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'delete', endpoint, done);
    });

    it('should send back 403 when current user is not a domain manager', function(done) {
      helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).delete(endpoint));

        req.expect(403).end(helpers.callbacks.noErrorAnd(function(res) {
          expect(res.body.error).to.deep.equal({
            code: 403,
            message: 'Forbidden',
            details: 'User is not the domain manager'
          });
          done();
        }));
      });
    });

    it('should send back 403 when an administrator tries to remove himself', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).delete(endpoint));

        req.expect(403).end(helpers.callbacks.noErrorAnd(function(res) {
          expect(res.body.error.code).to.equal(403);
          done();
        }));
      });
    });

    it('should send back 404 when domain is not found', function(done) {
      const notExistedDomainId = new ObjectId();

      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        requestAsMember(request(app).delete(`/api/domains/${notExistedDomainId}/administrators/${user1Domain1Manager._id}`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 404,
                message: 'Not Found',
                details: `No domain found for id: ${notExistedDomainId}`
              }
            });
            done();
          }));
      });
    });

    it('should send back 400 when domainId is invalid', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;
        var req = requestAsMember(request(app).delete('/api/domains/invalid/administrators/' + user1Domain1Manager._id));

        req.expect(400).end(helpers.callbacks.noError(done));
      });
    });

    it('should send back 204 on success', function(done) {
      helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, requestAsMember) {
        expect(err).to.not.exist;

        // add user2 as administrator
        Domain.findOneAndUpdate(
          { _id: domain1._id },
          {
            $push: {
              administrators: { user_id: user2Domain1Member._id }
            }
          },
          function(err) {
            expect(err).to.not.exist;

            var endpoint = '/api/domains/' + domain1._id + '/administrators/' + user2Domain1Member._id;
            var req = requestAsMember(request(app).delete(endpoint));

            req.expect(204).end(helpers.callbacks.noErrorAnd(function(res) {
              expect(res.body).to.not.exists;
              Domain.findById(domain1._id, function(err, domain) {
                // now only user1 is administrator
                expect(domain.administrators.length).to.equal(1);
                expect(String(domain.administrators[0].user_id)).to.equal(String(user1Domain1Manager._id));
                done(err);
              });
            }));
          }
        );

      });
    });

  });
});
