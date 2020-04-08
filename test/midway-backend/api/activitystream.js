const { expect } = require('chai');
const request = require('supertest');
const uuidV4 = require('uuid/v4');
const mockery = require('mockery');

describe('The activitystreams API', function() {
  let app;
  const password = 'secret';

  before(function() {
    this.helpers.requireBackend('core/db/mongo/models/domain');
    this.helpers.requireBackend('core/db/mongo/models/user');
    this.helpers.requireBackend('core/db/mongo/models/timelineentry');
  });

  beforeEach(function() {
    this.mongoose = require('mongoose');
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('Tests', function() {

    beforeEach(function(done) {
      const self = this;

      this.testEnv.initCore(function(err) {
        expect(err).to.not.exist;
        app = self.helpers.requireBackend('webserver').webserver.application;
        done();
      });
    });

    describe('Activity Stream tests', function() {
      let TimelineEntry;
      let activitystreamId, community, privateCommunity, privateActivitystreamId;
      let user, userNotInPrivateCommunity;
      const email = 'itadmin@lng.net';

      beforeEach(function(done) {
        TimelineEntry = this.mongoose.model('TimelineEntry');
        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          user = models.users[0];
          userNotInPrivateCommunity = models.users[2];
          community = models.communities[0];
          privateCommunity = models.communities[1];
          activitystreamId = models.communities[0].activity_stream.uuid;
          privateActivitystreamId = privateCommunity.activity_stream.uuid;
          const timelineentryJSON = {
            actor: {
              objectType: 'user',
              _id: user._id
            },
            object: {
              _id: user._id
            },
            target: [
              {objectType: 'activitystream', _id: activitystreamId}
            ]
          };
          const timelineEntry = new TimelineEntry(timelineentryJSON);

          timelineEntry.save(function(err) {
            expect(err).to.not.exist;
            done();
          });
        });
      });

      describe('GET /api/activitystreams/:uuid', function() {

        it('should send back 401 when not logged in', function(done) {
          this.helpers.api.requireLogin(app, 'get', '/api/activitystreams/' + activitystreamId, done);
        });

        it('should send back 404 when the activity stream does not exist', function(done) {
          const incorrectUUID = uuidV4();

          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + incorrectUUID))
              .expect(404, done);
          });
        });

        it('should send back 400 when limit parameter is incorrect', function(done) {
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '?limit=-12'))
              .expect(400, done);
          });
        });

        it('should send back 400 when "before" parameter is incorrect', function(done) {
          const date = new Date();

          date.setDate(date.getDate() - 1);
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '?before=pipo'))
              .expect(400, done);
          });
        });

        it('should send back 400 when "after" parameter is incorrect', function(done) {
          const date = new Date();

          date.setDate(date.getDate() - 1);
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '?after=pipo'))
              .expect(400, done);
          });
        });

        it('should send back 200 when the activity stream exists but not send back timeline entries in private community', function(done) {
          const self = this;
          const timelineentryPrivate = {
            actor: {
              objectType: 'user',
              _id: user._id
            },
            object: {
              _id: user._id
            },
            target: [
              {objectType: 'activitystream', _id: privateActivitystreamId}
            ]
          };
          const timelineEntry = new TimelineEntry(timelineentryPrivate);

          timelineEntry.save(function(err) {
            expect(err).to.not.exist;

            self.helpers.api.loginAsUser(app, userNotInPrivateCommunity.emails[0], password, function(err, loggedInAsUser) {
              expect(err).to.not.exist;

              const req = loggedInAsUser(request(app).get('/api/activitystreams/' + privateActivitystreamId + '?limit=10'));

              req.expect(200);
              req.end(function(err, res) {
                expect(err).to.not.exist;

                const entryArray = res.body;

                expect(entryArray).to.be.not.null;
                expect(entryArray).to.have.length(0);
                done();
              });
            });
          });
        });

        it('should send back 200 when activitystream exists with timeline entries', function(done) {
          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '?limit=10'))
              .expect(200).end(function(err, res) {
                expect(err).to.not.exist;

                const entryArray = res.body;

                expect(entryArray).to.be.not.null;
                expect(entryArray).to.have.length(1);

                const expectedEntry = {
                  actor: {
                    _id: user._id.toString(),
                    objectType: 'user'
                  },
                  target: [{
                    _id: activitystreamId,
                    objectType: 'activitystream'
                  }]
                };

                expect(entryArray[0]).to.shallowDeepEqual(expectedEntry);
                done();
              });
          });
        });
      });

      describe('GET /api/activitystreams/:uuid/resource', function() {

        it('should send back 401 when not logged in', function(done) {
          this.helpers.api.requireLogin(app, 'get', '/api/activitystreams/' + activitystreamId + '/resource', done);
        });

        it('should send back 404 when the activity stream does not exist', function(done) {
          const incorrectUUID = uuidV4();

          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + incorrectUUID + '/resource'))
              .expect(404, done);
          });
        });

        it('should send back 200 with activity stream associated resource', function(done) {
          const self = this;

          this.helpers.api.loginAsUser(app, email, password, function(err, loggedInAsUser) {
            expect(err).to.not.exist;
            loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '/resource'))
              .expect(200).end(function(err, res) {
                expect(err).to.not.exist;

                const expectedObject = {
                  objectType: 'community',
                  object: self.helpers.toComparableObject(community)
                };

                expect(res.body).to.shallowDeepEqual(expectedObject);
                done();
              });
          });
        });
      });
    });

    describe('Tracker tests', function() {
      let domain;
      let community;
      let user;
      let user2;
      let activitystreamId;

      beforeEach(function(done) {
        const self = this;

        this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          expect(err).to.not.exist;

          domain = models.domain;
          user = models.users[0];
          user2 = models.users[1];

          self.helpers.api.createCommunity('Node', user, domain, function(err, saved) {
            expect(err).to.not.exist;
            activitystreamId = saved.activity_stream.uuid;
            community = saved;
            done();
          });
        });
      });

      describe('GET /api/activitystreams/:uuid/unreadcount', function() {

        it('should send back 401 when not logged in', function(done) {
          this.helpers.api.requireLogin(app, 'get', '/api/activitystreams/' + activitystreamId + '/unreadcount', done);
        });

        it('should send back 404 if the activity stream is not found', function(done) {
          this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            loggedInAsUser(request(app).get('/api/activitystreams/178629182-19278128/unreadcount'))
              .expect(404, done);
          });
        });

        it('should send back 200 with 0 unread timeline entries when get the number for the first time', function(done) {
          this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            const req = loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '/unreadcount'));

            req.expect(200);
            req.end(function(err, res) {
              expect(err).to.not.exist;

              const expectedObject = {
                _id: activitystreamId,
                unread_count: 0
              };

              expect(res.body).to.shallowDeepEqual(expectedObject);
              done();
            });
          });
        });
      });

      it('should send back 200 with 3 unread timeline entries', function(done) {
        const self = this;

        // Login
        this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          // Add one Timeline Entry
          self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 1, 'post', function(err) {
            expect(err).to.not.exist;

            // Get the Activity Stream (will update the last unread Timeline Entry)
            let req = loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId));

            req.expect(200);
            req.end(function(err) {
              expect(err).to.not.exist;

              // Add 3 new Timeline Entries
              self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err) {
                expect(err).to.not.exist;

                // Get the number of unread Timeline Entries
                req = loggedInAsUser(request(app).get(
                    '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                req.expect(200);
                req.end(function(err, res) {
                  expect(err).to.not.exist;

                  const expectedObject = {
                    _id: activitystreamId,
                    unread_count: 3
                  };

                  expect(res.body).to.shallowDeepEqual(expectedObject);
                  done();
                });
              });
            });
          });
        });
      });

      describe('when there is an update timelineentry', function() {
        it('should send back 200 with 3 unread timeline entries', function(done) {
          const self = this;

          // Login
          this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
            // Add one Timeline Entry
            self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 1, 'post', function(err) {
              expect(err).to.not.exist;

              // Get the Activity Stream (will update the last unread Timeline Entry)
              let req = loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId));

              req.expect(200);
              req.end(function(err) {
                expect(err).to.not.exist;

                // Add 3 new Timeline Entries
                self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err, models) {
                  expect(err).to.not.exist;
                  // add an update on the second timeline entry
                  self.helpers.api.recordNextTimelineEntry(models.timelineEntries[1], 'update', function(err) {
                    expect(err).to.not.exist;
                    // Get the number of unread Timeline Entries
                    req = loggedInAsUser(request(app).get(
                      '/api/activitystreams/' + activitystreamId + '/unreadcount'));
                    req.expect(200);
                    req.end(function(err, res) { // eslint-disable-line
                      expect(err).to.not.exist;

                      const expectedObject = {
                        _id: activitystreamId,
                        unread_count: 3
                      };

                      expect(res.body).to.shallowDeepEqual(expectedObject);
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });

      it('should send back 200 with 0 unread TimelineEntry for new user in community', function(done) {
        const self = this;

        const communityCore = this.helpers.requireBackend('core/community');

        // Login
        this.helpers.api.loginAsUser(app, user.emails[0], password, function() {
          // Add three Timeline Entry
          self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err) {
            expect(err).to.not.exist;

            // Add the second user to the community
            communityCore.member.join(community, user2, user2, 'user', function(err) {
              expect(err).to.not.exist;

              self.helpers.api.loginAsUser(app, user2.emails[0], password, function(err, loggedInAsUser2) {
                // Get the number of unread Timeline Entries for the second user
                const req = loggedInAsUser2(request(app).get('/api/activitystreams/' + activitystreamId + '/unreadcount'));

                req.expect(200);
                req.end(function(err, res) {
                  expect(err).to.not.exist;

                  const expectedObject = {
                    _id: activitystreamId,
                    unread_count: 0
                  };

                  expect(res.body).to.shallowDeepEqual(expectedObject);
                  done();
                });
              });
            });
          });
        });
      });

      it('should send back 200 with 3 unread timeline entries ' +
        'when there are 4 timeline entries but with 1 own by the user', function(done) {
        var self = this;

        var TimelineEntry = this.mongoose.model('TimelineEntry');

        // Login
        this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
          // Add one Timeline Entry (helper is not used because we must set a user id)
          new TimelineEntry({
            verb: 'post',
            language: 'en',
            actor: {
              objectType: 'user',
              _id: user._id,
              image: '123456789',
              displayName: 'foo bar baz'
            },
            object: {
              objectType: 'message',
              _id: self.mongoose.Types.ObjectId()
            },
            target: [
              {
                objectType: 'activitystream',
                _id: activitystreamId
              }
            ]
          }).save(function(err) {
              expect(err).to.not.exist;

              // Add 3 new Timeline Entries
              self.helpers.api.applyMultipleTimelineEntries(activitystreamId, 3, 'post', function(err) {
                expect(err).to.not.exist;

                // Get the number of unread Timeline Entries
                const req = loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '/unreadcount'));

                req.expect(200);
                req.end(function(err, res) {
                  expect(err).to.not.exist;

                  const expectedObject = {
                    _id: activitystreamId,
                    unread_count: 3
                  };

                  expect(res.body).to.shallowDeepEqual(expectedObject);
                  done();
                });
              });
            });
        });
      });
    });
  });

  describe('Mock Tests', function() {
    let user;
    let domain;
    let tracker;
    let activitystreamId;

    beforeEach(function(done) {
      tracker = {
        countSinceLastTimelineEntry: function(userId, activityStreamUuid, callback) {
          return callback(new Error('server error'));
        }
      };
      mockery.registerMock('../../core/activitystreams/tracker', {getTracker: function() {return tracker;}});

      const self = this;

      this.testEnv.initCore(function(err) {
        expect(err).to.not.exist;
        app = self.helpers.requireBackend('webserver').webserver.application;

        self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
          expect(err).to.not.exist;

          domain = models.domain;
          user = models.users[0];

          self.helpers.api.createCommunity('Node', user, domain, function(err, saved) {
            expect(err).to.not.exist;
            activitystreamId = saved.activity_stream.uuid;
            done();
          });
        });
      });
    });

    it('should send back 500 if server error', function(done) {
      this.helpers.api.loginAsUser(app, user.emails[0], password, function(err, loggedInAsUser) {
        loggedInAsUser(request(app).get('/api/activitystreams/' + activitystreamId + '/unreadcount'))
          .expect(500, done);
      });
    });
  });
});
