'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('the TimelineEntriesTracker module', function() {
  var ReadTimelineEntriesTracker;
  var tracker;

  var ObjectId = require('bson').ObjectId;
  var userId = new ObjectId('538d87b37779021a1acf1b10');
  var activityStreamUuid = '46e2250b-29c7-49c6-aae4-12e6574ea911';
  var timelineEntryId = new ObjectId('538d87b37779021a1acf1b12');

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    ReadTimelineEntriesTracker = this.helpers.requireBackend('core/db/mongo/models/read-timelineentriestracker');
    tracker = this.helpers.requireBackend('core/activitystreams/tracker').getTracker('read');
    this.testEnv.writeDBConfigFile();
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('should create a new TimelineEntriesTracker with the init values', function(done) {
    tracker.updateLastTimelineEntry(userId, activityStreamUuid, timelineEntryId, function(err, saved) {
      expect(err).to.not.exist;
      expect(saved).to.exist;
      expect(userId.equals(saved._id)).to.be.true;
      expect(timelineEntryId.equals(saved.timelines[activityStreamUuid])).to.be.true;
      done();
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

      var timelineEntryId_2 = new ObjectId('538d87b37779021a1acf1b13');
      tracker.updateLastTimelineEntry(userId, activityStreamUuid, timelineEntryId_2, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.exist;
        expect(userId.equals(saved._id)).to.be.true;
        expect(timelineEntryId_2.equals(saved.timelines[activityStreamUuid])).to.be.true;
        done();
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

          tracker.updateLastTimelineEntry(models.users[0]._id, models2.activityStreamUuid, models2.timelineEntries[2], function(err, saved) {
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

          tracker.updateLastTimelineEntry(models.users[0]._id, models2.activityStreamUuid, models2.timelineEntries[2], function(err, saved) {
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

          tracker.updateLastTimelineEntry(models.users[0]._id, models2.activityStreamUuid, models2.timelineEntries[0], function(err, saved) {
            if (err) {
              return done(err);
            }

            var TimelineEntry = self.helpers.requireBackend('core/db/mongo/models/timelineentry');
            TimelineEntry.update({_id: models2.timelineEntries[1]._id }, {$set: {verb: 'remove'}}, function(err, numAffected) {
              if (err) {
                return done(err);
              }
              TimelineEntry.update({_id: models2.timelineEntries[2]._id }, {$set: {verb: 'remove'}}, function(err, numAffected) {
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
});
