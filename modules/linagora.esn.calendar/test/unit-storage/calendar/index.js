'use strict';

var expect = require('chai').expect;

describe('The calendar core module', function() {
  var domain;
  var community;
  var user, user2;

  var TimelineEntry;

  beforeEach(function(done) {
    var self = this;
    this.testEnv.writeDBConfigFile();
    this.mongoose = require('mongoose');

    TimelineEntry = self.helpers.requireBackend('core/db/mongo/models/timelineentry');

    this.testEnv.initCore(function(err) {
      if (err) { return done(err); }

      self.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        domain = models.domain;
        user = models.users[0];
        user2 = models.users[1];

        function changeCommunityTypeToPrivate(community) {
          community.type = 'private';
          return community;
        }

        self.helpers.api.createCommunity('Community', user, domain, changeCommunityTypeToPrivate, function(err, communitySaved) {
          if (err) { return done(err); }

          community = communitySaved;
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    this.helpers.mongo.dropDatabase(done);
  });

  describe('the dispatch fn', function() {

    it('should return false if the user does not have write permission', function(done) {
      var data = {
        user: user2,
        collaboration: community,
        event: {
          event_id: '1234567',
          type: 'created'
        }
      };

      var calendar = this.helpers.requireBackend('core/calendar');
      calendar.dispatch(data, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).to.be.false;
        done();
      });
    });

    it('should create a timeline entry in the community', function(done) {
      var data = {
        user: user,
        collaboration: community,
        event: {
          event_id: '1234567',
          type: 'created'
        }
      };

      var calendar = this.helpers.requireBackend('core/calendar');
      calendar.dispatch(data, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result._id).to.exist;
        expect(result.objectType).to.equal('event');
        var timer = setInterval(function() {
          TimelineEntry.find(function(err, results) {
            expect(results).to.have.length(1);
            expect(results[0].target[0]._id).to.equal(community.activity_stream.uuid);
            clearInterval(timer);
            done();
          });
        }, 10);
      });
    });

    it('should create a timeline entry in the community with user id and community id', function(done) {
      var data = {
        user: user._id.toString(),
        collaboration: community._id.toString(),
        objectType: 'community',
        event: {
          event_id: '1234567',
          type: 'created'
        }
      };

      var calendar = this.helpers.requireBackend('core/calendar');
      calendar.dispatch(data, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result._id).to.exist;
        expect(result.objectType).to.equal('event');
        var timer = setInterval(function() {
          TimelineEntry.find(function(err, results) {
            expect(results).to.have.length(1);
            expect(results[0].target[0]._id).to.equal(community.activity_stream.uuid);
            clearInterval(timer);
            done();
          });
        }, 10);
      });
    });
  });
});
