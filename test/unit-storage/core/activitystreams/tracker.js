'use strict';

var chai = require('chai');
var expect = chai.expect;
var async = require('async');

describe('the TimelineEntriesTracker module', function() {
  var ReadTimelineEntriesTracker;
  var tracker;

  var ObjectId;
  var userId;
  var activityStreamUuid;
  var timelineEntryId;

  beforeEach(function(done) {
    ObjectId = require('bson').ObjectId;
    userId = new ObjectId('538d87b37779021a1acf1b10');
    activityStreamUuid = '46e2250b-29c7-49c6-aae4-12e6574ea911';
    timelineEntryId = '538d87b37779021a1acf1b12';

    this.mongoose = require('mongoose');
    this.helpers.requireBackend('core/db/mongo/models/timelineentry');
    this.helpers.requireBackend('core/db/mongo/models/domain');
    this.helpers.requireBackend('core/db/mongo/models/user');
    this.helpers.requireBackend('core/db/mongo/models/community');
    this.helpers.requireBackend('core/db/mongo/models/community-archive');
    this.helpers.requireBackend('core/db/mongo/models/notification');
    this.helpers.requireBackend('core/db/mongo/models/usernotification');
    this.helpers.requireBackend('core/db/mongo/models/authtoken');
    this.helpers.requireBackend('core/db/mongo/models/resource-link');
    this.helpers.requireBackend('core/db/mongo/models/passwordreset');
    this.helpers.requireBackend('core/community');
    ReadTimelineEntriesTracker = this.helpers.requireBackend('core/db/mongo/models/read-timelineentriestracker');
    tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
    this.testEnv.writeDBConfigFile();

    this.connectMongoose(this.mongoose, done);
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  it('should create a new TimelineEntriesTracker with the init values', function(done) {
    tracker.updateLastTimelineEntry(userId, activityStreamUuid, timelineEntryId, function(err) {
      expect(err).to.not.exist;

      ReadTimelineEntriesTracker.findOne(userId, function(err, doc) {
        expect(err).to.not.exist;
        var expectedDoc = {_id: userId + '', timelines: {}};
        expectedDoc.timelines[activityStreamUuid] = timelineEntryId;
        expect(doc).to.shallowDeepEqual(expectedDoc);
        done();
      });
    });
  });

  it('should update the existing TimelineEntriesTracker with the new TimelineEntry', function(done) {
    var timelineEntriesTracker = {
      _id: userId,
      timelines: {}
    };
    timelineEntriesTracker.timelines[activityStreamUuid] = timelineEntryId;

    this.helpers.mongo.saveDoc('timelineEntriesTrackers', timelineEntriesTracker, function(err) {
      if (err) { done(err); }

      var timelineEntryId_2 = '538d87b37779021a1acf1b13';
      tracker.updateLastTimelineEntry(userId, activityStreamUuid, timelineEntryId_2, function(err) {
        expect(err).to.not.exist;

        ReadTimelineEntriesTracker.findOne(userId, function(err, doc) {
          expect(err).to.not.exist;
          var expectedDoc = {_id: userId + '', timelines: {}};
          expectedDoc.timelines[activityStreamUuid] = timelineEntryId_2;
          expect(doc).to.shallowDeepEqual(expectedDoc);
          done();
        });
      });
    });
  });

  it('should return 0 unread TimelineEntry when update to the last TimelineEntry', function(done) {
    var self = this;

    this.helpers.api.applyDomainDeployment('linagora_test_cases', function(err, models) {
      if (err) { return done(err); }

      self.helpers.api.createCommunity('Node', models.users[0], models.domain, function(err, community) {
        if (err) {
          return done(err);
        }

        self.helpers.api.applyMultipleTimelineEntries(community.activity_stream.uuid, 3, 'post', function(err, models2) {
          if (err) {
            return done(err);
          }

          tracker.updateLastTimelineEntry(models.users[0]._id, models2.activityStreamUuid, models2.timelineEntries[2], function(err) {
            if (err) {
              return done(err);
            }

            tracker.countSinceLastTimelineEntry(models.users[0]._id, models2.activityStreamUuid, function(err, count) {
              expect(err).to.not.exist;
              expect(count).to.exist;
              expect(count).to.deep.equal(0);
              done();
            });
          });
        });
      });
    });
  });

  it('should return 4 unread TimelineEntry when add 3 TimelineEntries, update last and add 4 TimelineEntries', function(done) {
    var self = this;

    this.helpers.api.applyDomainDeployment('linagora_test_cases', function(err, models) {
      if (err) { return done(err); }

      self.helpers.api.createCommunity('Node', models.users[0], models.domain, function(err, community) {
        if (err) {
          return done(err);
        }

        self.helpers.api.applyMultipleTimelineEntries(community.activity_stream.uuid, 3, 'post', function(err, models2) {
          if (err) {
            return done(err);
          }

          tracker.updateLastTimelineEntry(models.users[0]._id, models2.activityStreamUuid, models2.timelineEntries[2], function(err) {
            if (err) {
              return done(err);
            }

            tracker.countSinceLastTimelineEntry(models.users[0]._id, models2.activityStreamUuid, function(err, count) {
              expect(err).to.not.exist;
              expect(count).to.exist;
              expect(count).to.deep.equal(0);

              self.helpers.api.applyMultipleTimelineEntries(community.activity_stream.uuid, 4, 'post', function(err, models3) {
                if (err) {
                  return done(err);
                }

                tracker.countSinceLastTimelineEntry(models.users[0]._id, models3.activityStreamUuid, function(err, count) {
                  expect(err).to.not.exist;
                  expect(count).to.exist;
                  expect(count).to.deep.equal(4);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  it('should return 2 unread TimelineEntry when add 5 TimelineEntries, update last read to the first added and change verb to "remove" for 2 of them', function(done) {
    var self = this;

    this.helpers.api.applyDomainDeployment('linagora_test_cases', function(err, models) {
      if (err) { return done(err); }

      self.helpers.api.createCommunity('Node', models.users[0], models.domain, function(err, community) {
        if (err) {
          return done(err);
        }

        self.helpers.api.applyMultipleTimelineEntries(community.activity_stream.uuid, 5, 'post', function(err, models2) {
          if (err) {
            return done(err);
          }

          tracker.updateLastTimelineEntry(models.users[0]._id, models2.activityStreamUuid, models2.timelineEntries[0], function(err) {
            if (err) {
              return done(err);
            }

            var TimelineEntry = self.helpers.requireBackend('core/db/mongo/models/timelineentry');
            TimelineEntry.update({_id: models2.timelineEntries[1]._id }, {$set: {verb: 'remove'}}, function(err) {
              if (err) {
                return done(err);
              }
              TimelineEntry.update({_id: models2.timelineEntries[2]._id }, {$set: {verb: 'remove'}}, function(err) {
                if (err) {
                  return done(err);
                }

                tracker.countSinceLastTimelineEntry(models.users[0]._id, models2.activityStreamUuid, function(err, count) {
                  expect(err).to.not.exist;
                  expect(count).to.exist;
                  expect(count).to.deep.equal(2);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  it('should rebuild the threads with their responses', function(done) {

    var self = this;

    var createTimeline = function(uuid, size, callback) {
      self.helpers.api.applyMultipleTimelineEntriesWithReplies(uuid, size, callback);
    };

    this.helpers.api.applyDomainDeployment('linagora_test_cases', function(err, models) {
      if (err) {
        return done(err);
      }

      self.helpers.api.createCommunity('Node', models.users[0], models.domain, function(err, community) {
        if (err) {
          return done(err);
        }

        async.parallel([
          function(callback) {
            createTimeline(community.activity_stream.uuid, 1, callback);
          },
          function(callback) {
            createTimeline(community.activity_stream.uuid, 5, callback);
          },
          function(callback) {
            createTimeline(community.activity_stream.uuid, 10, callback);
          },
          function(callback) {
            createTimeline(community.activity_stream.uuid, 15, callback);
          }
        ], function(err, results) {
          if (err) {
            return done(err);
          }

          tracker.updateLastTimelineEntry(models.users[0]._id, community.activity_stream.uuid, results[0].timelineEntries[0], function(err) {
            if (err) {
              return done(err);
            }

            tracker.buildThreadViewSinceLastTimelineEntry(models.users[0]._id, community.activity_stream.uuid, function(err, threads) {
              if (err) {
                return done(err);
              }

              expect(threads).to.exists;
              expect(threads[results[1].inReplyToMessageId].responses).to.have.length(results[1].timelineEntries.length);
              expect(threads[results[2].inReplyToMessageId].responses).to.have.length(results[2].timelineEntries.length);
              expect(threads[results[3].inReplyToMessageId].responses).to.have.length(results[3].timelineEntries.length);
              done();
            });
          });
        });
      });
    });
  });
});
