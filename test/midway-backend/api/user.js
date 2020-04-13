const { expect } = require('chai');
const request = require('supertest');
const async = require('async');

describe('User API', function() {
  let app, helpers;
  let models1, models2;
  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;

    this.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }
        models1 = models;
        helpers.api.applyDomainDeployment('linagora_test_domain2', function(err, models) {
          if (err) { return done(err); }
          models2 = models;
          const jobs = models.users.map(function(user) {
            return function(done) {
              user.domains.push({ domain_id: models1.domain._id });
              user.save(done);
            };
          });

          async.parallel(jobs, done);
        });
      });
    });
  });

  function createSimulatedCollaboration(type = 'open', creator, domain, member, title) {
    return function(done) {
      const opts = function(collaboration) {
        if (member) {
          collaboration.members.push({ member: { id: member, objectType: 'user' } });
        }
        collaboration.type = type;

        if (title) {
          collaboration.title = title;
        }

        return collaboration;
      };

      helpers.api.createSimulatedCollaboration(creator, domain, opts, done);
    };
  }

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/user/activitystreams', function() {
    it('should return 401 if user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/user/activitystreams', done);
    });

    it('should return 200 with an empty array if there are no streams', function(done) {
      helpers.api.loginAsUser(app, models1.users[1].emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/user/activitystreams'));

        req.expect(200);
        req.end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body).to.be.an.array;
          expect(res.body.length).to.equal(0);
          done();
        });
      });
    });

    it('should return 200 with an array of writable collaboration streams', function(done) {
      async.parallel([
        createSimulatedCollaboration('open', models1.users[0]._id, models1.domain._id, models2.users[1]._id),
        createSimulatedCollaboration('open', models1.users[0]._id, models1.domain._id, models2.users[1]._id),
        createSimulatedCollaboration('restricted', models1.users[0]._id, models1.domain._id),
        createSimulatedCollaboration('restricted', models1.users[0]._id, models1.domain._id, models2.users[1]._id)
      ], function(err, simulatedCollaborations) {
        expect(err).to.not.exist;

        const correctIds = [
          simulatedCollaborations[0].activity_stream.uuid,
          simulatedCollaborations[1].activity_stream.uuid,
          simulatedCollaborations[3].activity_stream.uuid
        ];

        helpers.api.loginAsUser(app, models2.users[1].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).get('/api/user/activitystreams?writable=true&member=true'));

          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(3);
            expect(correctIds).to.contain(res.body[0].uuid);
            expect(correctIds).to.contain(res.body[1].uuid);
            expect(correctIds).to.contain(res.body[2].uuid);
            done();
          });
        });
      });
    });

    it('should return 200 with all the streams the user can write (includes writable ones where not member)', function(done) {
      async.parallel([
        createSimulatedCollaboration('open', models1.users[0]._id, models1.domain._id, models1.users[0]._id),
        createSimulatedCollaboration('open', models1.users[0]._id, models1.domain._id, models1.users[3]._id),
        createSimulatedCollaboration('restricted', models1.users[0]._id, models1.domain._id),
        createSimulatedCollaboration('restricted', models1.users[0]._id, models1.domain._id, models1.users[3]._id)
      ], function(err, collaborations) {
        if (err) {
          return done(err);
        }

        const correctIds = [
          collaborations[0].activity_stream.uuid,
          collaborations[1].activity_stream.uuid,
          collaborations[3].activity_stream.uuid
        ];

        helpers.api.loginAsUser(app, models1.users[3].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).get('/api/user/activitystreams?writable=true'));

          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;

            expect(res.body.length).to.equal(3);
            expect(correctIds).to.contain(res.body[0].uuid);
            expect(correctIds).to.contain(res.body[1].uuid);
            expect(correctIds).to.contain(res.body[2].uuid);
            done();
          });
        });
      });
    });

    it('should return 200 with an array or collaboration streams filtered by name', function(done) {
      async.parallel([
        createSimulatedCollaboration('open', models1.users[0]._id, models1.domain._id, models2.users[1]._id, 'community1'),
        createSimulatedCollaboration('open', models1.users[0]._id, models1.domain._id, models2.users[1]._id, 'community2'),
        createSimulatedCollaboration('open', models1.users[0]._id, models1.domain._id, models2.users[1]._id, 'community3'),
        createSimulatedCollaboration('open', models1.users[0]._id, models1.domain._id, models2.users[1]._id, 'Node')
      ], function(err, collaborations) {
        if (err) {
          return done(err);
        }

        const correctIds = [
          collaborations[0].activity_stream.uuid,
          collaborations[1].activity_stream.uuid,
          collaborations[2].activity_stream.uuid
        ];

        helpers.api.loginAsUser(app, models2.users[1].emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          const req = loggedInAsUser(request(app).get('/api/user/activitystreams?name=commu'));

          req.expect(200);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.be.an.array;
            expect(res.body.length).to.equal(3);
            expect(correctIds).to.contain(res.body[0].uuid);
            expect(correctIds).to.contain(res.body[1].uuid);
            expect(correctIds).to.contain(res.body[2].uuid);
            done();
          });
        });
      });
    });

    it('should return 200 with an array of community streams with only the community streams in specific domain', function(done) {
      helpers.api.createSimulatedCollaboration(models2.users[1]._id, models1.domain._id, {}, function(err) {
        if (err) {
          return done(err);
        }
        helpers.api.createSimulatedCollaboration(models2.users[1]._id, models2.domain._id, {}, function(err, collaboration) {
          if (err) {
            return done(err);
          }
          const activityStream2 = collaboration.activity_stream.uuid;

          helpers.api.loginAsUser(app, models2.users[1].emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            const req = loggedInAsUser(request(app).get('/api/user/activitystreams?domainid=' + models2.domain._id));

            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.be.an.array;
              expect(res.body.length).to.equal(1);
              expect(res.body[0].uuid).to.equal(activityStream2);
              done();
            });
          });
        });
      });

      it('should return 200 with an array of community streams in all domains', function(done) {
        helpers.api.createSimulatedCollaboration(models2.users[1]._id, models1.domain._id, {}, function(err, collaboration) {
          if (err) {
            return done(err);
          }
          const activityStream1 = collaboration.activity_stream.uuid;

          helpers.api.createSimulatedCollaboration(models2.users[1]._id, models2.domain._id, {}, function(err, collaboration) {
            if (err) {
              return done(err);
            }
            const activityStream2 = collaboration.activity_stream.uuid;

            helpers.api.loginAsUser(app, models2.users[1].emails[0], password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }
              const req = loggedInAsUser(request(app).get('/api/user/activitystreams?domainid=' + models2.domain._id));

              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.be.an.array;
                expect(res.body.length).to.equal(2);
                expect(res.body[0].uuid).to.equal(activityStream1);
                expect(res.body[1].uuid).to.equal(activityStream2);
                done();
              });
            });
          });
        });
      });
    });
  });
});
