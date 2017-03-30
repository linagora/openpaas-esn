const expect = require('chai').expect;
const request = require('supertest');
const ObjectId = require('bson').ObjectId;

describe('The superadmins API', function() {

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

  function noErrorHaveSuperadmins(expectedSuperadmins, done) {
    const expectedSuperadminIds = expectedSuperadmins.map(user => user.id);

    return err => {
      expect(err).to.not.exist;

      core.superadmin.getAllSuperAdmins().then(superadmins => {
        expect(superadmins).to.shallowDeepEqual(expectedSuperadminIds);
        done();
      });
    };
  }

  describe('POST /api/superadmins/init', function() {

    it('should send back 204 when succeeded to set superadmin by email', function(done) {
      request(webserver.application)
        .post('/api/superadmins/init')
        .send({
          type: 'email',
          data: userAlice.emails[0]
        })
        .expect(204)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.superadmin.getAllSuperAdmins().then(superadmins => {
            expect(superadmins).to.contain(userAlice.id);
            done();
          });
        }));
    });

    it('should send back 204 when succeeded to set superadmin by id', function(done) {
      request(webserver.application)
        .post('/api/superadmins/init')
        .send({
          type: 'id',
          data: userAlice.id
        })
        .expect(204)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.superadmin.getAllSuperAdmins().then(superadmins => {
            expect(superadmins).to.contain(userAlice.id);
            done();
          });
        }));
    });

    it('should send back 400 when type is not supported', function(done) {
      request(webserver.application)
        .post('/api/superadmins/init')
        .send({
          type: 'name',
          data: userAlice.id
        })
        .expect(400)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.superadmin.getAllSuperAdmins().then(superadmins => {
            expect(superadmins).to.have.length(0);
            done();
          });
        }));
    });

    it('should send back 400 when type is id but data is not a valid ObjectId', function(done) {
      request(webserver.application)
        .post('/api/superadmins/init')
        .send({
          type: 'id',
          data: 'not an ObjectId'
        })
        .expect(400)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.superadmin.getAllSuperAdmins().then(superadmins => {
            expect(superadmins).to.have.length(0);
            done();
          });
        }));
    });

    it('should send back 404 when user is not found by ID', function(done) {
      request(webserver.application)
        .post('/api/superadmins/init')
        .send({
          type: 'id',
          data: new ObjectId()
        })
        .expect(404)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.superadmin.getAllSuperAdmins().then(superadmins => {
            expect(superadmins).to.have.length(0);
            done();
          });
        }));
    });

    it('should send back 404 when user is not found by email', function(done) {
      request(webserver.application)
        .post('/api/superadmins/init')
        .send({
          type: 'email',
          data: 'not_alice@email.com'
        })
        .expect(404)
        .end(helpers.callbacks.noErrorAnd(() => {
          core.superadmin.getAllSuperAdmins().then(superadmins => {
            expect(superadmins).to.have.length(0);
            done();
          });
        }));
    });

    it('should send back 403 when there is already superadmin in the system', function(done) {
      core.superadmin
        .addSuperAdmin(userAlice)
        .done(() => {
          request(webserver.application)
            .post('/api/superadmins/init')
            .send({
              type: 'email',
              data: 'bob@email.com'
            })
            .expect(403)
            .end(helpers.callbacks.noErrorAnd(() => {
              core.superadmin.getAllSuperAdmins().then(superadmins => {
                expect(superadmins).to.have.length(1);
                expect(superadmins).to.contain(userAlice.id);
                done();
              });
            }));
        });
    });

  });

  describe('GET /api/superadmins', function() {
    let userSuperAdmin;

    beforeEach(function(done) {
      fixtures.newDummyUser(['superadmin@email.com']).save(helpers.callbacks.noErrorAnd(user => {
        userSuperAdmin = user;
        core.superadmin
          .addSuperAdmin(user)
          .then(() => done())
          .catch(err => done(err || 'failed to add superadmin'));
      }));
    });

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/superadmins', done);
    });

    it('should send back 403 if the logged in user is not superadmin', function(done) {
      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).get('/api/superadmins'))
          .expect(403)
          .end(helpers.callbacks.noError(done));
      });
    });

    it('should send back 200 with a list of superadmins', function(done) {
      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).get('/api/superadmins'))
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual([{
              id: userSuperAdmin.id,
              firstname: userSuperAdmin.firstname,
              lastname: userSuperAdmin.lastname,
              email: userSuperAdmin.emails[0]
            }]);
            done();
          }));
      });
    });
  });

  describe('POST /api/superadmins', function() {
    let userSuperAdmin;

    beforeEach(function(done) {
      fixtures.newDummyUser(['superadmin@email.com']).save(helpers.callbacks.noErrorAnd(user => {
        userSuperAdmin = user;
        core.superadmin
          .addSuperAdmin(user)
          .then(() => done())
          .catch(err => done(err || 'failed to add superadmin'));
      }));
    });

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'post', '/api/superadmins', done);
    });

    it('should send back 204 when succeeded to set superadmin by email', function(done) {
      const expectedSuperadmins = [userSuperAdmin, userAlice];

      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/superadmins'))
          .send({
            type: 'email',
            data: userAlice.emails[0]
          })
          .expect(204)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    it('should send back 204 when succeeded to set superadmin by id', function(done) {
      const expectedSuperadmins = [userSuperAdmin, userAlice];

      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/superadmins'))
          .send({
            type: 'id',
            data: userAlice.id
          })
          .expect(204)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    it('should send back 400 when type is not supported', function(done) {
      const expectedSuperadmins = [userSuperAdmin];

      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/superadmins'))
          .send({
            type: 'name',
            data: userAlice.id
          })
          .expect(400)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    it('should send back 400 when type is id but data is not a valid ObjectId', function(done) {
      const expectedSuperadmins = [userSuperAdmin];

      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/superadmins'))
          .send({
            type: 'id',
            data: 'not an ObjectId'
          })
          .expect(400)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    it('should send back 403 if the logged user is not superadmin', function(done) {
      const expectedSuperadmins = [userSuperAdmin];

      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/superadmins'))
          .send({
            type: 'id',
            data: userAlice.id
          })
          .expect(403)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    it('should send back 404 when user is not found by ID', function(done) {
      const expectedSuperadmins = [userSuperAdmin];

      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/superadmins'))
          .send({
            type: 'id',
            data: new ObjectId()
          })
          .expect(404)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    it('should send back 404 when user is not found by email', function(done) {
      const expectedSuperadmins = [userSuperAdmin];

      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).post('/api/superadmins'))
          .send({
            type: 'email',
            data: 'bob@email.com'
          })
          .expect(404)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });
  });

  describe('DELETE /api/superadmins', function() {
    let userSuperAdmin;

    beforeEach(function(done) {
      fixtures.newDummyUser(['superadmin@email.com']).save(helpers.callbacks.noErrorAnd(user => {
        userSuperAdmin = user;
        core.superadmin
          .addSuperAdmin(user)
          .then(() => done())
          .catch(err => done(err || 'failed to add superadmin'));
      }));
    });

    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/superadmins', done);
    });

    it('should send back 403 if the logged in user is not superadmin', function(done) {
      const expectedSuperadmins = [userSuperAdmin];

      sendRequestAsUser(userAlice, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).delete('/api/superadmins'))
          .expect(403)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    it('should send back 403 if the superadmin is trying to remove himself by ID', function(done) {
      const query = { type: 'id', data: userSuperAdmin.id };
      const expectedSuperadmins = [userSuperAdmin];

      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).delete('/api/superadmins').query(query))
          .expect(403)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    it('should send back 403 if the superadmin is trying to remove himself by email', function(done) {
      const query = { type: 'email', data: userSuperAdmin.emails[0] };
      const expectedSuperadmins = [userSuperAdmin];

      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).delete('/api/superadmins').query(query))
          .expect(403)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    it('should send back 400 if type is not supported', function(done) {
      const query = { type: 'name', data: userSuperAdmin.firstname };
      const expectedSuperadmins = [userSuperAdmin];

      sendRequestAsUser(userSuperAdmin, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).delete('/api/superadmins').query(query))
          .expect(400)
          .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
      });
    });

    describe('send back 204 when remove success', function() {

      beforeEach(function(done) {
        core.superadmin
          .addSuperAdmin(userAlice)
          .then(() => done())
          .catch(err => done(err || 'cannot add Alice as superadmin'));
      });

      it('remove by ID', function(done) {
        const query = { type: 'id', data: userSuperAdmin.id };
        const expectedSuperadmins = [userAlice];

        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(request(webserver.application).delete('/api/superadmins').query(query))
            .expect(204)
            .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
        });
      });

      it('remove by email', function(done) {
        const query = { type: 'email', data: userSuperAdmin.emails[0] };
        const expectedSuperadmins = [userAlice];

        sendRequestAsUser(userAlice, loggedInAsUser => {
          loggedInAsUser(request(webserver.application).delete('/api/superadmins').query(query))
            .expect(204)
            .end(noErrorHaveSuperadmins(expectedSuperadmins, done));
        });
      });
    });
  });
});
