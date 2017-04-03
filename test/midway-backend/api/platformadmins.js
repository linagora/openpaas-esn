const expect = require('chai').expect;
const request = require('supertest');
const ObjectId = require('bson').ObjectId;

describe('The platformadmins API', function() {

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
          done();
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

  function noErrorHavePlatformAdmins(expectedPlatformAdmins, done) {
    const expectedPlatformAdminIds = expectedPlatformAdmins.map(user => user.id);

    return err => {
      expect(err).to.not.exist;

      core.platformadmin.getAllPlatformAdmins().then(platformadmins => {
        expect(platformadmins).to.shallowDeepEqual(expectedPlatformAdminIds);
        done();
      });
    };
  }

  describe('POST /api/platformadmins/init', function() {

    it('should send back 204 when succeeded to set platformadmin by email', function(done) {
      request(webserver.application)
        .post('/api/platformadmins/init')
        .send({
          type: 'email',
          data: userAlice.emails[0]
        })
        .expect(204)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.platformadmin.getAllPlatformAdmins().then(platformadmins => {
            expect(platformadmins).to.contain(userAlice.id);
            done();
          });
        }));
    });

    it('should send back 204 when succeeded to set platformadmin by id', function(done) {
      request(webserver.application)
        .post('/api/platformadmins/init')
        .send({
          type: 'id',
          data: userAlice.id
        })
        .expect(204)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.platformadmin.getAllPlatformAdmins().then(platformadmins => {
            expect(platformadmins).to.contain(userAlice.id);
            done();
          });
        }));
    });

    it('should send back 400 when type is not supported', function(done) {
      request(webserver.application)
        .post('/api/platformadmins/init')
        .send({
          type: 'name',
          data: userAlice.id
        })
        .expect(400)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.platformadmin.getAllPlatformAdmins().then(platformadmins => {
            expect(platformadmins).to.have.length(0);
            done();
          });
        }));
    });

    it('should send back 400 when type is id but data is not a valid ObjectId', function(done) {
      request(webserver.application)
        .post('/api/platformadmins/init')
        .send({
          type: 'id',
          data: 'not an ObjectId'
        })
        .expect(400)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.platformadmin.getAllPlatformAdmins().then(platformadmins => {
            expect(platformadmins).to.have.length(0);
            done();
          });
        }));
    });

    it('should send back 404 when user is not found by ID', function(done) {
      request(webserver.application)
        .post('/api/platformadmins/init')
        .send({
          type: 'id',
          data: new ObjectId()
        })
        .expect(404)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.platformadmin.getAllPlatformAdmins().then(platformadmins => {
            expect(platformadmins).to.have.length(0);
            done();
          });
        }));
    });

    it('should send back 404 when user is not found by email', function(done) {
      request(webserver.application)
        .post('/api/platformadmins/init')
        .send({
          type: 'email',
          data: 'not_alice@email.com'
        })
        .expect(404)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.platformadmin.getAllPlatformAdmins().then(platformadmins => {
            expect(platformadmins).to.have.length(0);
            done();
          });
        }));
    });

    it('should send back 403 when there is already platformadmin in the system', function(done) {
      core.platformadmin
        .addPlatformAdmin(userAlice)
        .done(() => {
          request(webserver.application)
            .post('/api/platformadmins/init')
            .send({
              type: 'email',
              data: 'bob@email.com'
            })
            .expect(403)
            .end(helpers.callbacks.noErrorAnd(() => {
              core.platformadmin.getAllPlatformAdmins().then(platformadmins => {
                expect(platformadmins).to.have.length(1);
                expect(platformadmins).to.contain(userAlice.id);
                done();
              });
            }));
        });
    });

  });

  describe('GET /api/platformadmins', function() {
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

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/platformadmins', done);
    });

    it('should send back 403 if the logged in user is not platformadmin', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).get('/api/platformadmins'))
          .expect(403)
          .end(helpers.callbacks.noError(done));
      });
    });

    it('should send back 200 with a list of platformadmins', function(done) {
      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).get('/api/platformadmins'))
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual([{
              id: userPlatformAdmin.id,
              firstname: userPlatformAdmin.firstname,
              lastname: userPlatformAdmin.lastname,
              email: userPlatformAdmin.emails[0]
            }]);
            done();
          }));
      });
    });
  });

  describe('POST /api/platformadmins', function() {
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

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'post', '/api/platformadmins', done);
    });

    it('should send back 204 when succeeded to set platformadmin by email', function(done) {
      const expectedPlatformAdmins = [userPlatformAdmin, userAlice];

      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/platformadmins'))
          .send({
            type: 'email',
            data: userAlice.emails[0]
          })
          .expect(204)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    it('should send back 204 when succeeded to set platformadmin by id', function(done) {
      const expectedPlatformAdmins = [userPlatformAdmin, userAlice];

      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/platformadmins'))
          .send({
            type: 'id',
            data: userAlice.id
          })
          .expect(204)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    it('should send back 400 when type is not supported', function(done) {
      const expectedPlatformAdmins = [userPlatformAdmin];

      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/platformadmins'))
          .send({
            type: 'name',
            data: userAlice.id
          })
          .expect(400)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    it('should send back 400 when type is id but data is not a valid ObjectId', function(done) {
      const expectedPlatformAdmins = [userPlatformAdmin];

      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/platformadmins'))
          .send({
            type: 'id',
            data: 'not an ObjectId'
          })
          .expect(400)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    it('should send back 403 if the logged user is not platformadmin', function(done) {
      const expectedPlatformAdmins = [userPlatformAdmin];

      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/platformadmins'))
          .send({
            type: 'id',
            data: userAlice.id
          })
          .expect(403)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    it('should send back 404 when user is not found by ID', function(done) {
      const expectedPlatformAdmins = [userPlatformAdmin];

      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/platformadmins'))
          .send({
            type: 'id',
            data: new ObjectId()
          })
          .expect(404)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    it('should send back 404 when user is not found by email', function(done) {
      const expectedPlatformAdmins = [userPlatformAdmin];

      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/platformadmins'))
          .send({
            type: 'email',
            data: 'bob@email.com'
          })
          .expect(404)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });
  });

  describe('DELETE /api/platformadmins', function() {
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

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/platformadmins', done);
    });

    it('should send back 403 if the logged in user is not platformadmin', function(done) {
      const expectedPlatformAdmins = [userPlatformAdmin];

      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).delete('/api/platformadmins'))
          .expect(403)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    it('should send back 403 if the platformadmin is trying to remove himself by ID', function(done) {
      const query = { type: 'id', data: userPlatformAdmin.id };
      const expectedPlatformAdmins = [userPlatformAdmin];

      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).delete('/api/platformadmins').query(query))
          .expect(403)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    it('should send back 403 if the platformadmin is trying to remove himself by email', function(done) {
      const query = { type: 'email', data: userPlatformAdmin.emails[0] };
      const expectedPlatformAdmins = [userPlatformAdmin];

      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).delete('/api/platformadmins').query(query))
          .expect(403)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    it('should send back 400 if type is not supported', function(done) {
      const query = { type: 'name', data: userPlatformAdmin.firstname };
      const expectedPlatformAdmins = [userPlatformAdmin];

      sendRequestAsUser(userPlatformAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).delete('/api/platformadmins').query(query))
          .expect(400)
          .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
      });
    });

    describe('send back 204 when remove success', function() {

      beforeEach(function(done) {
        core.platformadmin
          .addPlatformAdmin(userAlice)
          .then(() => done())
          .catch(err => done(err || 'cannot add Alice as platformadmin'));
      });

      it('remove by ID', function(done) {
        const query = { type: 'id', data: userPlatformAdmin.id };
        const expectedPlatformAdmins = [userAlice];

        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(request(webserver.application).delete('/api/platformadmins').query(query))
            .expect(204)
            .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
        });
      });

      it('remove by email', function(done) {
        const query = { type: 'email', data: userPlatformAdmin.emails[0] };
        const expectedPlatformAdmins = [userAlice];

        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(request(webserver.application).delete('/api/platformadmins').query(query))
            .expect(204)
            .end(noErrorHavePlatformAdmins(expectedPlatformAdmins, done));
        });
      });
    });
  });
});
