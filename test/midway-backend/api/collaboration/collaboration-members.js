const { expect } = require('chai');
const request = require('supertest');
const { ObjectId } = require('bson');

describe('The collaborations members API', function() {
  const password = 'secret';
  let app, helpers;
  let domain, simulatedCollaboration, privateSimulatedCollaboration, user, user1, user2;

  beforeEach(function(done) {
    helpers = this.helpers;
    this.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');

      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }

        domain = models.domain;
        user = models.users[0];
        user1 = models.users[1];
        user2 = models.users[2]; // not member of simulated collaboration

        simulatedCollaboration = models.simulatedCollaborations[0];
        privateSimulatedCollaboration = models.simulatedCollaborations[1];
        done();
      });
    });
  });

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
  });

  describe('PUT /api/collaborations/:objectType/:id/members/:user_id', function() {
    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'put', '/api/collaborations/simulatedCollaboration/123/members/456', done);
    });

    it('should return 404 if collaboration does not exist', function(done) {
      const id = new ObjectId();

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + id + '/members/123'));

        req.expect(404);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('When current user is not collaboration manager', function() {
      it('should return 400 if collaboration is not open and user was not invited into the collaboration', function(done) {
        helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/members/' + user._id));

          req.expect(400);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });

      it('should return 400 if current user is not equal to :user_id param', function(done) {
        helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user._id));

          req.expect(400);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });

      it('should add the current user as member if collaboration is open', function(done) {
        helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user2._id));

          req.expect(204);
          req.end(function(err) {
            expect(err).to.not.exist;
            helpers.api.getSimulatedCollaboration(simulatedCollaboration._id, (err, collaboration) => {
              if (err) { return done(err); }

              const members = collaboration.members;

              expect(members.length).to.equal(3);
              expect(members.map(member => member.member.id)).to.contain(user2._id);
              done();
            });
          });
        });
      });

      it('should not add the current user as member if already in', function(done) {
        helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user1._id));

          req.expect(204);
          req.end(function(err) {
            expect(err).to.not.exist;
            helpers.api.getSimulatedCollaboration(simulatedCollaboration._id, (err, collaboration) => {
              if (err) { return done(err); }

              const members = collaboration.members;

              expect(members.length).to.equal(2);
              done();
            });
          });
        });
      });

      it('should add the user to collaboration if the collaboration is not open but the user was invited', function(done) {
        simulatedCollaboration.membershipRequests.push({ user: user2._id, workflow: 'invitation' });
        simulatedCollaboration.save(function(err, collaboration) {
          if (err) {return done(err);}

          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members/' + user2._id));

            req.expect(204);
            req.end(function(err) {
              expect(err).to.not.exist;
              helpers.api.getSimulatedCollaboration(simulatedCollaboration._id, (err, collaboration) => {
                if (err) { return done(err); }

                const members = collaboration.members;

                expect(members.length).to.equal(3);
                expect(members.map(member => member.member.id)).to.contain(user2._id);
                done();
              });
            });
          });
        });
      });
    });

    describe('When current user is collaboration manager', function() {
      it('should send back 400 when trying to add himself', function(done) {
        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user._id));

          req.expect(400);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });

      it('should send back 400 when trying to add a user who does not asked for membership', function(done) {
        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/members/' + user2._id));

          req.expect(400);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });

      it('should send back 204 when domain admin trying to add himself to the collaboration', function(done) {
        helpers.api.createSimulatedCollaboration(user1, domain, {
          membershipRequests: [{
            user: user._id, workflow: 'request'
          }]
        }, (err, createdCollaboration) => {
          if (err) return done(err);

          helpers.api.loginAsUser(app, user.emails[0], password, (err, loggedInAsUser) => {
            if (err) return done(err);

            const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + createdCollaboration._id + '/members/' + user._id));

            req.expect(204).end(err => {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      it('should send back 204 when user is added to members', function(done) {
        helpers.api.createSimulatedCollaboration(user, domain, {
          membershipRequests: [{
            user: user2._id, workflow: 'request'
          }]
        }, (err, createdCollaboration) => {
          if (err) return done(err);

          helpers.api.loginAsUser(app, user.emails[0], password, (err, loggedInAsUser) => {
            if (err) return done(err);

            const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + createdCollaboration._id + '/members/' + user2._id));

            req.expect(204).end(err => {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      it('should send back 204 if the withoutInvite query parameter is true (even with no membership request)', function(done) {
        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/members/' + user2._id + '?withoutInvite=true'));

          req.expect(204);
          req.end(function(err) {
            expect(err).to.not.exist;
            helpers.api.getSimulatedCollaboration(privateSimulatedCollaboration._id, (err, collaboration) => {
              if (err) { return done(err); }

              const members = collaboration.members;

              expect(members.length).to.equal(3);
              expect(members.map(member => member.member.id)).to.contain(user2._id);
              done();
            });
          });
        });
      });
    });
  });

  describe('GET /api/collaborations/:objectType/:id/members', function() {
    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/collaborations/simulatedCollaboration/123/members', done);
    });

    it('should return 500 if objectType is invalid', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }
        const req = loggedInAsUser(request(app).get('/api/collaborations/badone/123456/members'));

        req.expect(500);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.error).to.exist;
          done();
        });
      });
    });

    describe('access rights and collaborations', function() {
      describe('open collaborations', function() {
        it('should return 200 if user is not a member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if user is a member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('restricted collaborations', function() {
        let collaboration;

        beforeEach(function(done) {
          helpers.api.createSimulatedCollaboration(user, domain, {
            type: 'restricted',
            members: [{
              member: {
                id: user1._id,
                objectType: 'user'
              }
            }]
          }, (err, createdCollaboration) => {
            if (err) { return done(err); }

            collaboration = createdCollaboration;
            done();
          });
        });

        it('should return 200 if user is not a member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if user is a member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('private collaborations', function() {
        it('should return 403 if user is not a member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/members'));

            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if user is a member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('confidential collaborations', function() {
        let collaboration;

        beforeEach(function(done) {
          helpers.api.createSimulatedCollaboration(user, domain, {
            type: 'confidential',
            members: [{
              member: {
                id: user1._id,
                objectType: 'user'
              }
            }]
          }, (err, createdCollaboration) => {
            if (err) { return done(err); }

            collaboration = createdCollaboration;
            done();
          });
        });

        it('should return 403 if user is not a member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members'));

            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if user is a member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
    });

    it('should return 404 if collaboration does not exist', function(done) {
      const id = new ObjectId();

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }

        const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + id + '/members'));

        req.expect(404);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should return the members list', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }
        const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(2);
          expect(res.body[0].user).to.exist;
          expect(res.body[0].user._id).to.exist;
          expect(res.body[0].user.password).to.not.exist;
          expect(res.body[0].metadata).to.exist;
          done();
        });
      });
    });

    it('should return the filtered members list', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }
        const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members?objectTypeFilter=user&limit=1'));

        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(1);
          expect(res.headers['x-esn-items-count']).to.equal('2');
          done();
        });
      });
    });

    it('should return the inverse filtered members list', function(done) {
      helpers.api.createSimulatedCollaboration(user, domain, {
        members: [{
          member: {
            id: user1._id,
            objectType: 'user'
          }
        }, {
          member: {
            id: 'foo@lng.com',
            objectType: 'email'
          }
        }]
      }, (err, createdCollaboration) => {
        if (err) { return done(err); }

        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) { return done(err); }
          const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + createdCollaboration._id + '/members?objectTypeFilter=!user&limit=1'));

          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(1);
            expect(res.body[0].objectType).to.equal('email');
            expect(res.headers['x-esn-items-count']).to.equal('1');
            done();
          });
        });
      });
    });

    it('should return the member list filtered by id', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, (err, loggedInAsUser) => {
        loggedInAsUser(request(app).get(`/api/collaborations/simulatedCollaboration/${simulatedCollaboration._id}/members?idFilter=${user1.id}`))
          .expect(200)
          .end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(1);
            expect(res.body[0].objectType).to.equal('user');
            expect(res.body[0].id).to.equal(String(user1.id));
            expect(res.headers['x-esn-items-count']).to.equal('1');
            done();
          });
      });
    });

    it('should return the sliced members list', function(done) {
      simulatedCollaboration.members = simulatedCollaboration.members.concat([
        {member: {id: new ObjectId(), objectType: 'user'}},
        {member: {id: new ObjectId(), objectType: 'user'}},
        {member: {id: new ObjectId(), objectType: 'user'}},
        {member: {id: new ObjectId(), objectType: 'user'}}
      ]);

      simulatedCollaboration.save(err => {
        if (err) { return done(err); }

        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) { return done(err); }
          const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

          req.query({limit: 3, offset: 1});
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(3);
            done();
          });
        });
      });
    });

    it('should return number of members in the header', function(done) {
      simulatedCollaboration.members = simulatedCollaboration.members.concat([
        {member: {id: new ObjectId(), objectType: 'user'}},
        {member: {id: new ObjectId(), objectType: 'user'}},
        {member: {id: new ObjectId(), objectType: 'user'}},
        {member: { id: new ObjectId(), objectType: 'user'}}
      ]);

      simulatedCollaboration.save(err => {
        if (err) { return done(err); }

        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) { return done(err); }
          const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

          req.query({limit: 3, offset: 1});
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.headers['x-esn-items-count']).to.equal('6');
            done();
          });
        });
      });
    });

    it('should return denormalized collaboration members (user member)', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, (err, loggedInAsUser) => {
        if (err) { return done(err); }

        const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

        req.query({ limit: 1 });
        req.expect(200);
        req.end((err, res) => {
          expect(err).to.not.exist;
          expect(res.body).to.have.length(1);
          expect(res.body[0]).to.shallowDeepEqual({
            objectType: 'user',
            id: user.id,
            user: {
              _id: user.id
            }
          });
          expect(res.body[0].user.accounts).to.not.exist;
          expect(res.body[0].user.password).to.not.exist;
          done();
        });
      });
    });

    it('should return denormalized collaboration members (email member)', function(done) {
      helpers.api.createSimulatedCollaboration(user, domain, {
        members: [{
          member: {
            id: user1._id,
            objectType: 'user'
          }
        }, {
          member: {
            id: 'foo@lng.com',
            objectType: 'email'
          }
        }]
      }, (err, createdCollaboration) => {
        if (err) {
          return done(err);
        }

        helpers.api.loginAsUser(app, user.emails[0], password, (err, loggedInAsUser) => {
          expect(err).to.not.exist;

          const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + createdCollaboration._id + '/members'));

          req.query({ objectTypeFilter: 'email' });
          req.expect(200);
          req.end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body).to.have.length(1);
            expect(res.body[0]).to.shallowDeepEqual({
              objectType: 'email',
              id: 'foo@lng.com',
              email: 'foo@lng.com'
            });
            done();
          });
        });
      });
    });
  });

  describe('DELETE /api/collaborations/:objectType/:id/members/:user_id', function() {
    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'delete', '/api/collaborations/simulatedCollaboration/123/members/123', done);
    });

    it('should return 404 if collaboration does not exist', function(done) {
      const id = new ObjectId();

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).delete('/api/collaborations/simulatedCollaboration/' + id + '/members/123'));

        req.expect(404);
        req.end(function(err) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    it('should return 403 if current user is the collaboration creator and tries to remove himself', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).delete('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user._id));

        req.expect(403);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should remove the current user from members if in', function(done) {
      helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).delete('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user1._id));

        req.expect(204);
        req.end(function(err) {
          expect(err).to.not.exist;
          helpers.api.getSimulatedCollaboration(simulatedCollaboration._id, (err, collaboration) => {
            if (err) {
              return done(err);
            }
            expect(collaboration.members.length).to.equal(1);
            expect(String(collaboration.members[0].member.id)).to.equal(String(user._id));
            done();
          });
        });
      });
    });

    it('should remove the user from members if already in and current user creator', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).delete('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user1._id));

        req.expect(204);
        req.end(function(err) {
          expect(err).to.not.exist;
          helpers.api.getSimulatedCollaboration(simulatedCollaboration._id, (err, collaboration) => {
            if (err) {
              return done(err);
            }
            expect(collaboration.members.length).to.equal(1);
            expect(String(collaboration.members[0].member.id)).to.equal(String(user._id));
            done();
          });
        });
      });
    });
  });

  describe('GET /api/collaborations/:objectType/:id/members', function() {
    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/collaborations/simulatedCollaboration/123/members', done);
    });

    describe('access rights', function() {
      describe('open collaborations', function() {
        it('should return 200 if user is not a member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if user is a member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('restricted collaborations', function() {
        let collaboration;

        beforeEach(function(done) {
          helpers.api.createSimulatedCollaboration(user, domain, {
            type: 'restricted',
            members: [{
              member: {
                id: user1._id,
                objectType: 'user'
              }
            }]
          }, (err, createdCollaboration) => {
            if (err) { return done(err); }

            collaboration = createdCollaboration;
            done();
          });
        });

        it('should return 200 if user is not a member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('private collaborations', function() {
        it('should return 403 if user is not a member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/members'));

            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('confidential collaborations', function() {
        let collaboration;

        beforeEach(function(done) {
          helpers.api.createSimulatedCollaboration(user, domain, {
            type: 'confidential',
            members: [{
              member: {
                id: user1._id,
                objectType: 'user'
              }
            }]
          }, (err, createdCollaboration) => {
            if (err) { return done(err); }

            collaboration = createdCollaboration;
            done();
          });
        });

        it('should return 403 if user is not a member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members'));

            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
        it('should return 200 if user is a member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members'));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
    });

    it('should return 404 if collaboration does not exist', function(done) {
      const id = new ObjectId();

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + id + '/members'));

        req.expect(404);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    it('should return the members list', function(done) {
      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }
        const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(2);
          expect(res.body[0].user).to.exist;
          expect(res.body[0].user._id).to.exist;
          expect(res.body[0].user.password).to.not.exist;
          expect(res.body[0].metadata).to.exist;
          done();
        });
      });
    });

    it('should return the sliced members list', function(done) {
      simulatedCollaboration.members = simulatedCollaboration.members.concat([
        { member: { id: new ObjectId(), objectType: 'user' } },
        { member: { id: new ObjectId(), objectType: 'user' } },
        { member: { id: new ObjectId(), objectType: 'user' } },
        { member: { id: new ObjectId(), objectType: 'user' } }
      ]);

      simulatedCollaboration.save(err => {
        if (err) { return done(err); }

        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) { return done(err); }
          const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

          req.query({limit: 3, offset: 1});
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(3);
            done();
          });
        });
      });
    });

    it('should return number of collaboration members in the header', function(done) {
      simulatedCollaboration.members = simulatedCollaboration.members.concat([
        { member: { id: new ObjectId(), objectType: 'user' } },
        { member: { id: new ObjectId(), objectType: 'user' } },
        { member: { id: new ObjectId(), objectType: 'user' } },
        { member: { id: new ObjectId(), objectType: 'user' } }
      ]);

      simulatedCollaboration.save(err => {
        if (err) { return done(err); }

        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) { return done(err); }
          const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members'));

          req.query({limit: 3, offset: 1});
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.headers['x-esn-items-count']).to.equal('6');
            done();
          });
        });
      });
    });
  });

  describe('GET /api/collaborations/:objectType/:id/members/:user_id', function() {
    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/collaborations/simulatedCollaboration/123/members/456', done);
    });

    it('should return 404 if collaboration does not exist', function(done) {
      const id = new ObjectId();
      const userId = new ObjectId();

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + id + '/members/' + userId));

        req.expect(404);
        req.end(function(err) {
          expect(err).to.be.null;
          done();
        });
      });
    });

    describe('access rights', function() {
      describe('open collaborations', function() {
        it('should return 200 if the user is not a collaboration member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user._id));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a collaboration member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user._id));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('restricted collaborations', function() {
        let collaboration;

        beforeEach(function(done) {
          helpers.api.createSimulatedCollaboration(user, domain, {
            type: 'restricted',
            members: [{
              member: {
                id: user1._id,
                objectType: 'user'
              }
            }]
          }, (err, createdCollaboration) => {
            if (err) { return done(err); }

            collaboration = createdCollaboration;
            done();
          });
        });

        it('should return 200 if the user is not a collaboration member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members/' + user1._id));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a collaboration member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members/' + user1._id));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('private collaborations', function() {
        it('should return 403 if the user is not a collaboration member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/members/' + user._id));

            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a collaboration member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/members/' + user._id));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });

      describe('confidential collaborations', function() {
        let collaboration;

        beforeEach(function(done) {
          helpers.api.createSimulatedCollaboration(user, domain, {
            type: 'confidential',
            members: [{
              member: {
                id: user1._id,
                objectType: 'user'
              }
            }]
          }, (err, createdCollaboration) => {
            if (err) { return done(err); }

            collaboration = createdCollaboration;
            done();
          });
        });

        it('should return 403 if the user is not a collaboration member', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members/' + user1._id));

            req.expect(403);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });

        it('should return 200 if the user is a collaboration member', function(done) {
          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + collaboration._id + '/members/' + user1._id));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;
              done();
            });
          });
        });
      });
    });

    it('should return 200 if current user and input user is a collaboration member', function(done) {
      helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + simulatedCollaboration._id + '/members/' + user._id));

        req.expect(200);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });
  });
});
