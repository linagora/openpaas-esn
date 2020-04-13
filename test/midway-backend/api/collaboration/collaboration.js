const { expect } = require('chai');
const request = require('supertest');

describe('The collaborations API', function() {
  let app, helpers;
  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;

    this.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      done();
    });
  });

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/collaborations/membersearch', function() {
    let simulatedCollaborations, user, user2, user3;

    beforeEach(function(done) {
      helpers.api.applyDomainDeployment('collaborationMembers', function(err, models) {
        if (err) { return done(err); }
        user = models.users[0];
        user2 = models.users[1];
        user3 = models.users[2];
        simulatedCollaborations = models.simulatedCollaborations;
        done();
      });
    });

    it('should 401 when not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/collaborations/membersearch?objectType=user&id=123456789', done);
    });

    it('should 400 when req.query.objectType is not set', function(done) {
      helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }

        const req = loggedInAsUser(request(app).get('/api/collaborations/membersearch?id=' + user3._id));

        req.expect(400);
        done();
      });
    });

    it('should 400 when req.query.id is not set', function(done) {
      helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }

        const req = loggedInAsUser(request(app).get('/api/collaborations/membersearch?objectType=simulatedCollaboration'));

        req.expect(400);
        done();
      });
    });

    it('should find all the collaborations where the given tuple is a member of', function(done) {
      const tuple = {
        objectType: 'email',
        id: 'alice@email.com'
      };

      const privateCollaboration = simulatedCollaborations[1];

      privateCollaboration.members = privateCollaboration.members.concat([{ member: tuple }]);
      privateCollaboration.save(err => {
        if (err) {
          return done(err);
        }

        helpers.api.loginAsUser(app, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) { return done(err); }

          const req = loggedInAsUser(
            request(app)
              .get(`/api/collaborations/membersearch?objectType=${tuple.objectType}&id=${tuple.id}`)
          );

          req.expect(200);
          req.end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(1);
            expect(res.body[0]._id).to.equal(privateCollaboration.id);
            done();
          });
        });
      });
    });

    it('should find all the visible collaborations where the given tuple is a member of', function(done) {
      const aliceTuple = {
        objectType: 'email',
        id: 'alice@email.com'
      };
      const privateCollaboration = simulatedCollaborations[1];
      const restrictedCollaboration = simulatedCollaborations[2];

      privateCollaboration.members = privateCollaboration.members.concat([{ member: aliceTuple }]);
      restrictedCollaboration.members = restrictedCollaboration.members.concat([{ member: aliceTuple }]);

      Promise.all([
        privateCollaboration.save(),
        restrictedCollaboration.save()
      ]).then(() => {
        helpers.api.loginAsUser(app, user3.emails[0], password, (err, loggedInAsUser) => {
          if (err) { return done(err); }

          const req = loggedInAsUser(request(app).get(`/api/collaborations/membersearch?objectType=${aliceTuple.objectType}&id=${aliceTuple.id}`));

          req.expect(200);
          req.end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(2);
            expect([res.body[0]._id, res.body[1]._id]).to.shallowDeepEqual([privateCollaboration.id, restrictedCollaboration.id]);
            done();
          });
        });
      }).catch(err => done(err || new Error('should resolve')));
    });
  });

  describe('GET /api/collaborations/writable', function() {
    let simulatedCollaborations, user2;

    beforeEach(function(done) {
      helpers.api.applyDomainDeployment('openAndPrivateCollaborations', function(err, models) {
        if (err) { return done(err); }
        simulatedCollaborations = models.simulatedCollaborations;
        user2 = models.users[2];
        done();
      });
    });

    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/collaborations/writable', done);
    });

    it('should return the list of collaborations the user can write into', function(done) {
      const correctIds = [simulatedCollaborations[0].id, simulatedCollaborations[1].id, simulatedCollaborations[3].id];

      helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/collaborations/writable'));

        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an.array;
          expect(res.body).to.have.length(correctIds.length);
          res.body.forEach(function(returnedCollaboration) {
            expect(correctIds).to.contain(returnedCollaboration._id);
          });
          done();
        });
      });
    });
  });
});
