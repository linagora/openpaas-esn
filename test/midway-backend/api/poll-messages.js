const request = require('supertest');
const { expect } = require('chai');

describe('The messages API', function() {
  let app, helpers, models;
  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;

    this.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      helpers.requireBackend('core/db/mongo/models/pollmessage');

      helpers.api.applyDomainDeployment('linagora_IT', function(err, _models) {
        if (err) {
          return done(err);
        }
        models = _models;
        done();
      });
    });
  });

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
  });

  describe('poll messages', function() {
    describe('POST /api/messages', function() {
      it('should allow posting poll messages', function(done) {
        const target = {
          objectType: 'activitystream',
          id: models.simulatedCollaborations[0].activity_stream.uuid
        };

        helpers.api.loginAsUser(app, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).post('/api/messages'));

          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {
                pollChoices: [{label: 'one'}, {label: 'two'}]
              }
            },
            targets: [target]
          }).expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body._id).to.exist;
            done();
          });
        });
      });
      it('should not allow posting poll messages without description', function(done) {
        const target = {
          objectType: 'activitystream',
          id: models.simulatedCollaborations[0].activity_stream.uuid
        };

        helpers.api.loginAsUser(app, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).post('/api/messages'));

          req.send({
            object: {
              objectType: 'poll',
              data: {
                pollChoices: [{label: 'one'}, {label: 'two'}]
              }
            },
            targets: [target]
          }).expect(500)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('validation');
            done();
          });
        });
      });
      it('should not allow posting poll messages without pollChoices property', function(done) {
        const target = {
          objectType: 'activitystream',
          id: models.simulatedCollaborations[0].activity_stream.uuid
        };

        helpers.api.loginAsUser(app, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).post('/api/messages'));

          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {}
            },
            targets: [target]
          }).expect(500)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('Validation');
            done();
          });
        });
      });
      it('should not allow posting poll messages with an empty pollChoices property', function(done) {
        const target = {
          objectType: 'activitystream',
          id: models.simulatedCollaborations[0].activity_stream.uuid
        };

        helpers.api.loginAsUser(app, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).post('/api/messages'));

          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {
                pollChoices: []
              }
            },
            targets: [target]
          }).expect(500)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('Validation');
            done();
          });
        });
      });
      it('should not allow posting poll messages with a pollChoices of invalid choices', function(done) {
        const target = {
          objectType: 'activitystream',
          id: models.simulatedCollaborations[0].activity_stream.uuid
        };

        helpers.api.loginAsUser(app, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).post('/api/messages'));

          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {
                pollChoices: [{label: 'three'}, {one: 'one'}, {two: 'two'}]
              }
            },
            targets: [target]
          }).expect(500).end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('Validation');
            done();
          });
        });
      });
      it('should not allow posting poll messages with less than two choices', function(done) {
        const target = {
          objectType: 'activitystream',
          id: models.simulatedCollaborations[0].activity_stream.uuid
        };

        helpers.api.loginAsUser(app, models.users[0].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).post('/api/messages'));

          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {
                pollChoices: [{label: 'three'}]
              }
            },
            targets: [target]
          }).expect(500)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('Validation');
            done();
          });
        });
      });
    });
    describe('PUT /api/messages/:id/vote/:vote', function() {
      describe('when user does not have read right on the message', function() {
        let messageId, loggedInAsUser;

        beforeEach(function(done) {
          const target = {
            objectType: 'activitystream',
            id: models.simulatedCollaborations[1].activity_stream.uuid
          };

          helpers.api.loginAsUser(app, models.users[0].emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            const req = loggedInAsUser(request(app).post('/api/messages'));

            req.send({
              object: {
                description: 'poll1',
                objectType: 'poll',
                data: {
                  pollChoices: [{label: 'one'}, {label: 'two'}, {label: 'three'}]
                }
              },
              targets: [target]
            }).expect(201)
              .end(function(err, res) {
                expect(err).to.not.exist;
                messageId = res.body._id;
                done();
              });
          });
        });

        beforeEach(function(done) {
          helpers.api.loginAsUser(app, models.users[3].emails[0], password, function(err, _loggedInAsUser) {
            if (err) return done(err);

            loggedInAsUser = _loggedInAsUser;
            done();
          });
        });

        it('should not be able to vote', function(done) {
          const req = loggedInAsUser(request(app).put('/api/messages/' + messageId + '/vote/0'));

          req.send({})
            .expect(403)
            .end(done);
        });
      });

      describe('when user have read right on the message', function() {
        let messageId, loggedInAsUser;

        beforeEach(function(done) {
          const target = {
            objectType: 'activitystream',
            id: models.simulatedCollaborations[2].activity_stream.uuid
          };

          helpers.api.loginAsUser(app, models.users[0].emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            const req = loggedInAsUser(request(app).post('/api/messages'));

            req.send({
              object: {
                description: 'poll1',
                objectType: 'poll',
                data: {
                  pollChoices: [{label: 'one'}, {label: 'two'}, {label: 'three'}]
                }
              },
              targets: [target]
            }).expect(201)
              .end(function(err, res) {
                if (err) return done(err);
                messageId = res.body._id;
                done();
              });
          });
        });

        beforeEach(function(done) {
          helpers.api.loginAsUser(app, models.users[1].emails[0], password, function(err, _loggedInAsUser) {
            if (err) return done(err);

            loggedInAsUser = _loggedInAsUser;
            done();
          });
        });

        it('should be able to vote', function(done) {
          const req = loggedInAsUser(request(app).put('/api/messages/' + messageId + '/vote/0'));

          req.send({});
          req.expect(200)
          .end(done);
        });

        it('should not be able to vote twice on the same choice', function(done) {
          const liau = loggedInAsUser;
          const req = liau(request(app).put('/api/messages/' + messageId + '/vote/0'));

          req.send({})
          .expect(200)
          .end(function() {
            const req2 = liau(request(app).put('/api/messages/' + messageId + '/vote/0'));

            req2.send({})
            .expect(403)
            .end(function() {
              done();
            });
          });
        });
        it('should not be able to vote once again, but on another choice', function(done) {
          const liau = loggedInAsUser;
          const req = liau(request(app).put('/api/messages/' + messageId + '/vote/0'));

          req.send({})
          .expect(200)
          .end(function() {
            const req2 = liau(request(app).put('/api/messages/' + messageId + '/vote/1'));

            req2.send({})
            .expect(403)
            .end(function() {
              done();
            });
          });
        });
      });
    });
  });
});
