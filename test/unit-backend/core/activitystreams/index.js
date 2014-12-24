'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activity streams core module', function() {
  describe('The getUserStreams fn', function() {

    it('should send back error when user is null', function(done) {
      this.helpers.mock.models({});

      var module = require(this.testEnv.basePath + '/backend/core/activitystreams/index');
      module.getUserStreams(null, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should not fail when domain.getUserDomains and community.getUserCommunities fail', function(done) {
      this.helpers.mock.models({});
      mockery.registerMock('../user/domain', {
        getUserDomains: function(user, cb) {
          return cb(new Error());
        }
      });
      mockery.registerMock('../collaboration', {
        getStreamsForUser: function(user, options, cb) {
          return cb(new Error());
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/activitystreams/index');
      module.getUserStreams({_id: 123}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.length).to.equal(0);
        done();
      });
    });

    it('should send back streams from user communities', function(done) {
      var streams = [
        {
          uuid: 222
        },
        {
          uuid: 444
        }
      ];
      this.helpers.mock.models({});
      mockery.registerMock('../user/domain', {
        getUserDomains: function(user, cb) {
          return cb();
        }
      });
      mockery.registerMock('../collaboration', {
        getStreamsForUser: function(user, options, cb) {
          return cb(null, streams);
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/activitystreams/index');
      module.getUserStreams({_id: 123}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.length).to.equal(2);
        done();
      });
    });

    it('should send back streams from communities', function(done) {
      var streams = [
        {
          uuid: 222
        },
        {
          uuid: 444
        }
      ];
      this.helpers.mock.models({});
      mockery.registerMock('../collaboration', {
        getStreamsForUser: function(user, options, cb) {
          return cb(null, streams);
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/activitystreams/index');
      module.getUserStreams({_id: 123}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.length).to.equal(2);
        done();
      });
    });
  });
});
