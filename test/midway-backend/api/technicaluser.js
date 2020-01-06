const { expect } = require('chai');
const request = require('supertest');
const {ObjectId} = require('bson').ObjectId;

describe('The technicalusers API', function() {
  let app;
  let core;
  let domain;
  let user, platformAdminUser, domainAdminUser;
  let TechnicalUser;
  let technicalUser1, technicalUser2;
  let helpers;
  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;

    this.mongoose = require('mongoose');

    core = this.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      TechnicalUser = helpers.requireBackend('core/db/mongo/models/technical-user');

      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        expect(err).to.not.exist;
        domain = models.domain;

        technicalUser1 = {
          _id: new ObjectId(),
          name: 'Sabre',
          description: 'Sabre\'s dummy description',
          type: 'dav',
          domain: domain._id,
          data: 'Sabre\'s dummy data'
        };

        technicalUser2 = {
          _id: new ObjectId(),
          name: 'James',
          description: 'James\' dummy description',
          type: 'dav',
          domain: domain._id,
          data: 'James\'s dummy data'
        };

        helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models2) {
          expect(err).to.not.exist;
          user = models2.users[0];
          platformAdminUser = models2.users[1];
          domainAdminUser = models2.users[2];
          done();
        });
      });
    });
  });

  beforeEach(function(done) {
    core.platformadmin
      .addPlatformAdmin(platformAdminUser)
      .then(() => done())
      .catch(err => done(err || 'failed to add platformadmin'));
  });

  beforeEach(function(done) {
    core.user.domain
      .addDomainAdministrator(domain, domainAdminUser, err => {
        if (err) {
          done(err);
        }
        done();
      });
  });

  beforeEach(function(done) {
    core['technical-user'].add(technicalUser1, err => {
      expect(err).not.to.exist;
      core['technical-user'].add(technicalUser2, err => {
        expect(err).not.to.exist;
        done();
      });
    });
  });

  afterEach(function(done) {
      this.helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/domains/:uuid/technicalusers', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', `/api/domains/${domain._id}/technicalusers`, done);
    });

    it('should send back 400 when the domain Id is invalid', function(done) {
      const invalidDomainId = '9999';

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).get(`/api/domains/${invalidDomainId}/technicalusers`))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 400,
                message: 'Bad request',
                details: 'Invalid domain id'
              }
            });
            done();
          }));
      });
    });

    it('should send back 403 if the logged in user is not platform admin or domain admin', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).get(`/api/domains/${domain._id}/technicalusers`))
          .expect(403)
          .end(helpers.callbacks.noError(done));
      });
    });

    it('should send back 404 if the domain Id is not found', function(done) {
      const notExistedDomainId = new ObjectId();
      const expectedResponse = {
        error: {
          code: 404,
          message: 'Not Found',
          details: `No domain found for id: ${notExistedDomainId}`
        }
      };

      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).get(`/api/domains/${notExistedDomainId}/technicalusers`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal(expectedResponse);
            done();
          }));
      });
    });

    it('should send back 200 with a list of technical users when user is platform admin', function(done) {
      let technicalUsersList = [technicalUser1, technicalUser2];

      technicalUsersList = technicalUsersList.map(technicalUser => {
        const { name, description, type, data } = technicalUser;
        return {name, description, type, data};
      });

      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        const req = loggedInAsUser(request(app).get(`/api/domains/${domain._id}/technicalusers`));

        req.expect(200).end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.exist;
          expect(res.body).to.shallowDeepEqual(technicalUsersList);
          done();
        }));
      }));
    });

    it('should send back 200 with a list of technical users when user is domain admin', function(done) {
      let technicalUsersList = [technicalUser1, technicalUser2];

      technicalUsersList = technicalUsersList.map(technicalUser => {
        const { name, description, type, data } = technicalUser;
        return {name, description, type, data};
      });

      helpers.api.loginAsUser(app, domainAdminUser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        const req = loggedInAsUser(request(app).get(`/api/domains/${domain._id}/technicalusers`));

        req.expect(200).end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.exist;
          expect(res.body).to.shallowDeepEqual(technicalUsersList);
          done();
        }));
      }));
    });

    it('should send back 200 with 1 technical user when the request offset is 1', function(done) {
      const expectedResponse = [
        {
          name: 'Sabre',
          description: 'Sabre\'s dummy description',
          data: 'Sabre\'s dummy data',
          type: 'dav'
        }
      ];

      helpers.api.loginAsUser(app, domainAdminUser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        const LIMIT = 1;
        const req = loggedInAsUser(request(app).get(`/api/domains/${domain._id}/technicalusers`));

        req.query({limit: LIMIT })
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.exist;
            expect(res.body).to.shallowDeepEqual(expectedResponse);
            done();
        }));
      }));
    });
  });

  describe('POST /api/domains/:uuid/technicalusers', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'post', `/api/domains/${domain._id}/technicalusers`, done);
    });

    it('should send back 400 when the domain Id is invalid', function(done) {
      const invalidDomainId = '9999';

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).post(`/api/domains/${invalidDomainId}/technicalusers`))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 400,
                message: 'Bad request',
                details: 'Invalid domain id'
              }
            });
            done();
          }));
      });
    });

    it('should send back 403 if the logged in user is not platform admin or domain admin', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).post(`/api/domains/${domain._id}/technicalusers`))
          .expect(403)
          .end(helpers.callbacks.noError(done));
      });
    });

    it('should send back 404 if the domain Id is not found', function(done) {
      const notExistedDomainId = new ObjectId();
      const expectedResponse = {
        error: {
          code: 404,
          message: 'Not Found',
          details: `No domain found for id: ${notExistedDomainId}`
        }
      };

      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).post(`/api/domains/${notExistedDomainId}/technicalusers`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal(expectedResponse);
            done();
          }));
      });
    });

    it('should send back 201 and created technical user when user is platform admin', function(done) {
      const json = {
        name: 'Dummy',
        description: 'Foo',
        type: 'Dav',
        data: 'Bar'
      };

      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post(`/api/domains/${domain._id}/technicalusers`).send(json))
        .expect(201)
        .end(helpers.callbacks.noErrorAnd(() => {
          TechnicalUser.findOne({ name: 'Dummy' }, helpers.callbacks.noErrorAnd(doc => {
            expect(doc).to.exist;
            expect(doc).to.shallowDeepEqual({
              name: 'Dummy',
              description: 'Foo',
              domain: domain._id,
              type: 'Dav',
              data: 'Bar'
            });
            done();
          }));
        }));
      }));
    });

    it('should send back 201 and created technical user when user is domain admin', function(done) {
      const json = {
        name: 'Dummy',
        description: 'Foo',
        type: 'Dav',
        data: 'Bar'
      };

      helpers.api.loginAsUser(app, domainAdminUser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).post(`/api/domains/${domain._id}/technicalusers`).send(json))
        .expect(201)
        .end(helpers.callbacks.noErrorAnd(() => {
          TechnicalUser.findOne({ name: 'Dummy' }, helpers.callbacks.noErrorAnd(doc => {
            expect(doc).to.exist;
            expect(doc).to.shallowDeepEqual({
              name: 'Dummy',
              description: 'Foo',
              domain: domain._id,
              type: 'Dav',
              data: 'Bar'
            });
            done();
          }));
        }));
      }));
    });
  });

  describe('PUT /api/domains/:uuid/technicalusers/:technicalUserId', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'put', `/api/domains/${domain._id}/technicalusers/${technicalUser1._id}`, done);
    });

    it('should send back 400 when the domain Id is invalid', function(done) {
      const invalidDomainId = '9999';

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).put(`/api/domains/${invalidDomainId}/technicalusers/${technicalUser1._id}`))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 400,
                message: 'Bad request',
                details: 'Invalid domain id'
              }
            });
            done();
          }));
      });
    });

    it('should send back 403 if the logged in user is not platform admin or domain admin', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).put(`/api/domains/${domain._id}/technicalusers/${technicalUser1._id}`))
          .expect(403)
          .end(helpers.callbacks.noError(done));
      });
    });

    it('should send back 404 if the domain Id is not found', function(done) {
      const notExistedDomainId = new ObjectId();
      const expectedResponse = {
        error: {
          code: 404,
          message: 'Not Found',
          details: `No domain found for id: ${notExistedDomainId}`
        }
      };

      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).put(`/api/domains/${notExistedDomainId}/technicalusers/${technicalUser1._id}`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal(expectedResponse);
            done();
          }));
      });
    });

    it('should send back 404 if the technical user Id is not found', function(done) {
      const notExistedTechnicalUserId = new ObjectId();
      const expectedResponse = {
        error: {
          code: 404,
          message: 'Not Found',
          details: `No technical user found for id: ${notExistedTechnicalUserId}`
        }
      };

      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).put(`/api/domains/${domain._id}/technicalusers/${notExistedTechnicalUserId}`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal(expectedResponse);
            done();
          }));
      });
    });

    it('should send back 204 on success when user is platform admin', function(done) {
      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).put(`/api/domains/${domain._id}/technicalusers/${technicalUser1._id}`))
          .expect(204)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.not.exists;
            done();
          }));
      });
    });

    it('should send back 204 on success when user is platform admin', function(done) {
      helpers.api.loginAsUser(app, domainAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).put(`/api/domains/${domain._id}/technicalusers/${technicalUser1._id}`))
          .expect(204)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.not.exists;
            done();
          }));
      });
    });

  });

  describe('DELETE /api/domains/:uuid/technicalusers/:technicalUserId', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'delete', `/api/domains/${domain._id}/technicalusers/${technicalUser1._id}`, done);
    });

    it('should send back 400 when the domain Id is invalid', function(done) {
      const invalidDomainId = '9999';

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).delete(`/api/domains/${invalidDomainId}/technicalusers/${technicalUser1._id}`))
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal({
              error: {
                code: 400,
                message: 'Bad request',
                details: 'Invalid domain id'
              }
            });
            done();
          }));
      });
    });

    it('should send back 403 if the logged in user is not platform admin or domain admin', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).delete(`/api/domains/${domain._id}/technicalusers/${technicalUser1._id}`))
          .expect(403)
          .end(helpers.callbacks.noError(done));
      });
    });

    it('should send back 404 if the domain Id is not found', function(done) {
      const notExistedDomainId = new ObjectId();
      const expectedResponse = {
        error: {
          code: 404,
          message: 'Not Found',
          details: `No domain found for id: ${notExistedDomainId}`
        }
      };

      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).delete(`/api/domains/${notExistedDomainId}/technicalusers/${technicalUser1._id}`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal(expectedResponse);
            done();
          }));
      });
    });

    it('should send back 404 if the technical user Id is not found', function(done) {
      const notExistedTechnicalUserId = new ObjectId();
      const expectedResponse = {
        error: {
          code: 404,
          message: 'Not Found',
          details: `No technical user found for id: ${notExistedTechnicalUserId}`
        }
      };

      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).delete(`/api/domains/${domain._id}/technicalusers/${notExistedTechnicalUserId}`))
          .expect(404)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.deep.equal(expectedResponse);
            done();
          }));
      });
    });

    it('should send back 204 on success when user is platform admin', function(done) {
      helpers.api.loginAsUser(app, platformAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).delete(`/api/domains/${domain._id}/technicalusers/${technicalUser1._id}`))
          .expect(204)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.not.exists;
            done();
          }));
      });
    });

    it('should send back 204 on success when user is domain admin', function(done) {
      helpers.api.loginAsUser(app, domainAdminUser.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).delete(`/api/domains/${domain._id}/technicalusers/${technicalUser1._id}`))
          .expect(204)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.not.exists;
            done();
          }));
      });
    });
  });
});
