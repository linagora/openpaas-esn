const { expect } = require('chai');
const request = require('supertest');

describe('The collaborations membership API', function() {
  const password = 'secret';
  let helpers, app;
  let user, user1, user2, user3, user4, privateSimulatedCollaboration;

  beforeEach(function(done) {
    helpers = this.helpers;
    this.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');

      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) { return done(err); }

        user = models.users[0];
        user1 = models.users[1];
        user2 = models.users[2];
        user3 = models.users[3];
        user4 = models.users[4];

        privateSimulatedCollaboration = models.simulatedCollaborations[1];
        done();
      });
    });
  });

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
  });

  describe('PUT /api/collaborations/:objectType/:id/membership/:user_id', function() {
    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'put', '/api/collaborations/simulatedCollaboration/123/membership/456', done);
    });

    it('should return 400 if user is already member of the collaboration', function(done) {
      helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user1._id));

        req.expect(400);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.text).to.contain('already member');
          done();
        });
      });
    });

    it('should return 200 if user has already made a request for this collaboration', function(done) {
      privateSimulatedCollaboration.membershipRequests.push({ user: user2._id, workflow: 'workflow' });

      privateSimulatedCollaboration.save(err => {
        if (err) { return done(err); }

        helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user2._id));

          req.expect(200);
          req.end(function(err, res) {
            if (err) { return done(err); }
            expect(res.status).to.equal(200);
            expect(res.body.membershipRequest).to.exist;
            expect(res.body.membershipRequests).to.not.exist;
            done();
          });
        });
      });
    });

    describe('when the current user is not a collaboration manager', function() {
      it('should return 403 if current user is not equal to :user_id param', function(done) {
        helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user3._id));

          req.expect(403);
          req.end(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });

      it('should return 200 with the collaboration containing a new request', function(done) {
        helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user2._id));

          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.status).to.equal(200);
            expect(res.body).to.exist;
            expect(res.body.title).to.equal(privateSimulatedCollaboration.title);
            expect(res.body.type).to.equal(privateSimulatedCollaboration.type);
            expect(res.body.membershipRequest).to.exist;
            expect(res.body.membershipRequests).to.not.exist;
            done();
          });
        });
      });
    });

    describe('when the current user is a collaboration manager', function() {
      it('should return 200 with the collaboration containing a new invitation', function(done) {
        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user2._id));

          req.expect(200);
          req.end(function(err) {
            expect(err).to.not.exist;
            helpers.api.getSimulatedCollaboration(privateSimulatedCollaboration._id, (err, collaboration) => {
              expect(err).to.not.exist;
              expect(collaboration.membershipRequests).to.exist;
              expect(collaboration.membershipRequests).to.be.an('array');
              expect(collaboration.membershipRequests).to.have.length(1);
              expect(collaboration.membershipRequests[0].user + '').to.equal(user2.id);
              expect(collaboration.membershipRequests[0].workflow).to.equal('invitation');
              done();
            });
          });
        });
      });

      describe('when the current user is not in the collaboration and adding himself', function() {
        it('should return 200 with the user membership request in the collaboration', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, (err, loggedInAsUser) => {
            if (err) return done(err);

            const req = loggedInAsUser(request(app).put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user2._id));

            req.expect(200).end(err => {
              if (err) return done(err);

              helpers.api.getSimulatedCollaboration(privateSimulatedCollaboration._id, (err, collaboration) => {
                expect(err).to.not.exist;
                expect(collaboration.membershipRequests).to.exist;
                expect(collaboration.membershipRequests).to.be.an('array');
                expect(collaboration.membershipRequests).to.have.length(1);
                expect(collaboration.membershipRequests[0].user + '').to.equal(user2.id);
                expect(collaboration.membershipRequests[0].workflow).to.equal('request');
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('GET /api/collaborations/:objectType/:id/membership', function() {
    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/collaborations/simulatedCollaboration/123/membership', done);
    });

    it('should return 404 if collaboration does not exist', function(done) {
      const ObjectId = require('bson').ObjectId;
      const id = new ObjectId();

      helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + id + '/membership'));

        req.expect(404);
        req.end(function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });

    describe('When not collaboration manager', function() {
      it('should return HTTP 403', function(done) {
        helpers.api.loginAsUser(app, user1.emails[0], password, (err, loggedInAsUser) => {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership'));

          req.expect(403);
          req.end(done);
        });
      });
    });

    describe('When collaboration manager', function() {
      it('should return the membership request list', function(done) {
        privateSimulatedCollaboration.membershipRequests.push({ user: user2._id, workflow: 'request' });
        privateSimulatedCollaboration.save(err => {
          if (err) { return done(err); }

          helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership'));

            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an('array');
              expect(res.body.length).to.equal(1);
              expect(res.body[0].user).to.exist;
              expect(res.body[0].user._id).to.exist;
              expect(res.body[0].user.password).to.not.exist;
              expect(res.body[0].metadata).to.exist;
              done();
            });
          });
        });
      });

      it('should return number of collaboration membership requests in the header', function(done) {
        privateSimulatedCollaboration.membershipRequests = [
          { user: user2._id, workflow: 'request' },
          { user: user3._id, workflow: 'request' }
        ];

        privateSimulatedCollaboration.save(err => {
          if (err) { return done(err); }

          helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership'));

            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.headers['x-esn-items-count']).to.equal('2');
              done();
            });
          });
        });
      });
    });

    it('should return sliced collaboration membership requests', function(done) {
      privateSimulatedCollaboration.membershipRequests = [
        { user: user2._id, workflow: 'request' },
        { user: user3._id, workflow: 'request' }
      ];

      privateSimulatedCollaboration.save(err => {
        if (err) { return done(err); }

        helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).get('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership'));

          req.query({ limit: 1, offset: 1 });
          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.headers['x-esn-items-count']).to.equal('2');
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(1);
            done();
          });
        });
      });
    });
  });

  describe('DELETE /api/collaborations/simulatedCollaboration/:id/membership/:user_id', function() {
    beforeEach(function(done) {
      privateSimulatedCollaboration.membershipRequests = [{
        user: user2._id,
        workflow: 'invitation',
        timestamp: {
          creation: new Date(1419509532000)
        }
      },
      {
        user: user3._id,
        workflow: 'request',
        timestamp: {
          creation: new Date(1419509532000)
        }
      }];

      privateSimulatedCollaboration.save(done);
    });

    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'delete', '/api/collaborations/simulatedCollaboration/123/membership/456', done);
    });

    describe('when current user is not collaboration manager', function() {
      it('should return 403 if current user is not the target user', function(done) {
        helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(
            request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user2._id)
          );

          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.status).to.equal(403);
            expect(res.text).to.match(/Current user is not the target user/);
            done();
          });
        });
      });

      it('should return 204 with the collaboration having no more membership requests', function(done) {
        privateSimulatedCollaboration.membershipRequests = [];

        privateSimulatedCollaboration.save(err => {
          expect(err).to.not.exist;

          helpers.api.loginAsUser(app, user1.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user1._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
              done();
            });
          });
        });
      });

      it('should return 204 even if the collaboration had no membership request for this user', function(done) {
        privateSimulatedCollaboration.membershipRequests = [{
          user: user2._id,
          workflow: 'invitation',
          timestamp: {
            creation: new Date(1419509532000)
          }
        }];

        privateSimulatedCollaboration.save(err => {
          expect(err).to.not.exist;

          helpers.api.loginAsUser(app, user3.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user3._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
              done();
            });
          });
        });
      });

      describe('when the workflow is invitation', function() {
        it('should return 204 and remove the membershipRequest of the collaboration', function(done) {
          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user2._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
              helpers.api.getSimulatedCollaboration(privateSimulatedCollaboration._id, function(err, collaboration) {
                if (err) {return done(err);}
                const requests = collaboration.membershipRequests.filter(function(membershipRequest) {
                  return membershipRequest.user.equals(user2._id);
                });

                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in collaboration:membership:invitation:decline topic', function(done) {
          const pubsub = helpers.requireBackend('core').pubsub.local;
          const topic = pubsub.topic('collaboration:membership:invitation:decline');

          topic.subscribe(function(message) {
            expect(user2._id.equals(message.author)).to.be.true;
            expect(privateSimulatedCollaboration._id.equals(message.target)).to.be.true;
            expect(privateSimulatedCollaboration._id.equals(message.collaboration.id)).to.be.true;
            done();
          });

          helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user2._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
            });
          });
        });
      });

      describe('when the workflow is request', function() {
        it('should return 204 and remove the membershipRequest of the collaboration', function(done) {
          helpers.api.loginAsUser(app, user3.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user3._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
              helpers.api.getSimulatedCollaboration(privateSimulatedCollaboration._id, function(err, collaboration) {
                if (err) {return done(err);}
                const requests = collaboration.membershipRequests.filter(function(membershipRequest) {
                  return membershipRequest.user.equals(user3._id);
                });

                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in collaboration:membership:request:cancel topic', function(done) {
          const pubsub = helpers.requireBackend('core').pubsub.local;
          const topic = pubsub.topic('collaboration:membership:request:cancel');

          topic.subscribe(function(message) {
            expect(user3._id.equals(message.author)).to.be.true;
            expect(privateSimulatedCollaboration._id.equals(message.target)).to.be.true;
            expect(privateSimulatedCollaboration._id.equals(message.collaboration.id)).to.be.true;
            done();
          });

          helpers.api.loginAsUser(app, user3.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user3._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
            });
          });
        });
      });
    });

    describe('when current user is collaboration manager', function() {
      describe('and target user does not have membershipRequests', function() {
        it('should return 204, and let the membershipRequests array unchanged', function(done) {
          helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user4._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
              helpers.api.getSimulatedCollaboration(privateSimulatedCollaboration._id, function(err, collaboration) {
                if (err) {return done(err);}
                expect(collaboration.membershipRequests).to.have.length(2);
                done();
              });
            });
          });
        });
      });

      describe('and workflow = invitation', function() {
        it('should return 204 and remove the membershipRequest of the collaboration', function(done) {
          helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user2._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
              helpers.api.getSimulatedCollaboration(privateSimulatedCollaboration._id, function(err, collaboration) {
                if (err) {return done(err);}
                const requests = collaboration.membershipRequests.filter(function(membershipRequest) {
                  return membershipRequest.user.equals(user2._id);
                });

                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in collaboration:membership:invitation:cancel topic', function(done) {
          const pubsub = helpers.requireBackend('core').pubsub.local;
          const topic = pubsub.topic('collaboration:membership:invitation:cancel');

          topic.subscribe(function(message) {
            expect(user._id.equals(message.author)).to.be.true;
            expect(user2._id.equals(message.target)).to.be.true;
            expect(privateSimulatedCollaboration._id.equals(message.collaboration.id)).to.be.true;
            done();
          });

          helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user2._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
            });
          });
        });
      });

      describe('and workflow = request', function() {
        it('should return 204 and remove the membershipRequest of the collaboration', function(done) {
          helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user3._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
              helpers.api.getSimulatedCollaboration(privateSimulatedCollaboration._id, function(err, collaboration) {
                if (err) {return done(err);}
                const requests = collaboration.membershipRequests.filter(function(mr) {
                  return mr.user.equals(user3._id);
                });

                expect(requests).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should publish a message in collaboration:membership:request:refuse topic', function(done) {
          const pubsub = helpers.requireBackend('core').pubsub.local;
          const topic = pubsub.topic('collaboration:membership:request:refuse');

          topic.subscribe(function(message) {
            expect(user._id.equals(message.author)).to.be.true;
            expect(user3._id.equals(message.target)).to.be.true;
            expect(privateSimulatedCollaboration._id.equals(message.collaboration.id)).to.be.true;
            done();
          });

          helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) { return done(err); }
            const req = loggedInAsUser(
              request(app).delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user3._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
            });
          });
        });
      });
    });

    describe('pubsub events', function() {
      let loggedInAsManager, loggedInAsUser;

      beforeEach(function(done) {
        helpers.api.loginAsUser(app, user.emails[0], password, function(err, _loggedInAsUser) {
          if (err) return done(err);
          loggedInAsManager = _loggedInAsUser;
          helpers.api.loginAsUser(app, user3.emails[0], password, function(err, _loggedInAsUser) {
            if (err) return done(err);
            loggedInAsUser = _loggedInAsUser;
            done();
          });
        });
      });

      describe('when admin refuses a join request', function() {
        it('should add a usernotification for the user', function(done) {
          const maxtries = 10;
          let currenttry = 0;

          function checkusernotificationexists() {
            if (currenttry === maxtries) {
              return done(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            const Usernotification = require('../../../../backend/core/db/mongo/models/usernotification');

            Usernotification.find(
              {
                category: 'collaboration:membership:refused',
                target: user3._id
              },
              function(err, notifications) {
                if (err) { return done(err); }
                if (!notifications.length) {
                  checkusernotificationexists();

                  return;
                }

                return done(null, notifications[0]);
              }
            );
          }

          const req = loggedInAsUser(
            request(app)
              .put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user3._id)
          );

          req.end(function() {
            const req = loggedInAsManager(
              request(app)
                .delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user3._id)
            );

            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.status).to.equal(204);
              checkusernotificationexists();
            });
          });
        });
      });

      describe('when manager cancels an invitation', function() {
        it('should remove the attendee usernotification', function(done) {
          const maxtries = 10;
          let currenttry = 0;

          function checkusernotificationexists(callback) {
            if (currenttry === maxtries) {
              return callback(new Error('Unable to find user notification after 10 tries'));
            }
            currenttry++;

            const Usernotification = require('../../../../backend/core/db/mongo/models/usernotification');

            Usernotification.find(
              {
                category: 'collaboration:membership:invite',
                target: user4._id
              },
              function(err, notifications) {
                if (err) { return callback(err); }
                if (!notifications.length) {
                  checkusernotificationexists(callback);

                  return;
                }

                return callback(null, notifications[0]);
              }
            );
          }

          function checkusernotificationdisappear() {
            if (currenttry === maxtries) {
              return done(new Error('Still finding user notification after 10 tries'));
            }
            currenttry++;

            const Usernotification = require('../../../../backend/core/db/mongo/models/usernotification');

            Usernotification.find(
              {
                category: 'collaboration:membership:invite',
                target: user4._id
              },
              function(err, notifications) {
                if (err) { return done(err); }
                if (notifications.length) {
                  checkusernotificationdisappear();

                  return;
                }

                return done();
              }
            );
          }

          const req = loggedInAsManager(
            request(app)
              .put('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user4._id)
          );

          req.end(function() {
            checkusernotificationexists(function(err) {
              if (err) { return done(err); }
              const req = loggedInAsManager(
                request(app)
                  .delete('/api/collaborations/simulatedCollaboration/' + privateSimulatedCollaboration._id + '/membership/' + user4._id)
              );

              req.end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.status).to.equal(204);
                currenttry = 0;
                checkusernotificationdisappear();
              });
            });
          });
        });
      });
    });
  });
});
