'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var q = require('q');

describe('The twitter contact importer', function() {

  var deps, dependencies;
  var twitterClient = {
    getCustomApiCall: function() {
    }
  };
  var twitterClientMocks = {
    Twitter: function() {
      return twitterClient;
    }
  };

  beforeEach(function() {
    dependencies = {
      'esn-config': function() {
        return {
          get: function(callback) {
            return callback(null, {
              twitter: {
                consumer_key: '0123456789',
                consumer_secret: 'abcdefgh'
              }
            });
          }
        };
      },
      logger: {
        error: function() {},
        debug: function() {},
        warn: function() {}
      },
      pubsub: {
        local: {
          topic: function() {
            return {
              publish: function() {}
            };
          }
        }
      },
      contact: {
        lib: {
          client: function() {
            return {
              addressbook: function() {
                return {
                  contacts: function() {
                    return {
                      create: function() {
                        return q([]);
                      }
                    };
                  }
                };
              }
            };
          }
        }
      }
    };
    deps = function(name) {
      return dependencies[name];
    };
  });

  var getImporter = function() {
    return require('../../../backend/lib/importer')(deps);
  };

  describe('The importContact function', function() {

    var options, followingIdList, followingInfoList, longIdList;

    beforeEach(function() {

      followingIdList = '{\"ids\": [123, 234, 345], \"next_cursor\": 0}';
      longIdList = '{\"ids\": [123, 234, 345, 567, 789, 890], \"next_cursor\": 2345}';
      followingInfoList =
        [
          {
            name: 'Twitter User1',
            location: 'San Francisco, CA',
            url: 'http://dev.twitter.ca',
            profile_image_url_https: 'https://image1.png',
            id: 123,
            description: 'Description 1'
          },
          {
            name: 'Twitter User2',
            location: 'Paris, FR',
            url: 'http://dev.twitter.fr',
            profile_image_url_https: 'https://image2.png',
            id: 234,
            description: 'Description 2'
          },
          {
            name: 'Twitter User3',
            location: 'Lyon, FR',
            url: 'http://dev.twitter.fr',
            profile_image_url_https: 'https://image3.png',
            id: 345,
            description: 'Description 3'
          }
        ];
      options = {
        esnToken: 123,
        user: {
          _id: 'myId',
          accounts: [
            {
              type: 'oauth',
              data: {
                provider: 'twitter',
                token: 456,
                token_secret: 'abc'
              }
            }
          ]
        }
      };

      mockery.registerMock('twitter-node-client', twitterClientMocks);
    });

    it('should get all following ids for the first step', function(done) {
      twitterClient.getCustomApiCall = function(value) {
        if (value === '/friends/ids.json') {
          done();
        }
      };
      getImporter().importContact(options);
    });

    it('should get at most 18000 following ids if not done', function(done) {
      var count = 0;
      twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
        if (value === '/friends/ids.json') {
          count++;
          onSuccess(longIdList);
        }
      };
      getImporter().importContact(options).then(function() {
        expect(count).to.equal(3000);
        done();
      });
    });

    it('should return promise reject if can not get oauth config', function(done) {
      dependencies['esn-config'] = function() {
        return {
          get: function(callback) {
            callback(null, null);
          }
        };
      };
      getImporter().importContact(options).then(null, function(err) {
          expect(err).to.deep.equal('Can not get ouath config');
          done();
        });
    });

    it('should return promise resolved if success getting oauth config', function(done) {
      getImporter().importContact(options).then(done);
    });

    it('should lookup for following info for the 2nd step', function() {
      var count = 0;
      twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
        if (value === '/friends/ids.json') {
          onSuccess(followingIdList);
        }
        if (value === '/users/lookup.json') {
          count++;
        }
      };
      getImporter().importContact(options).then(function() {
        expect(count).to.equal(3);
      });
    });

    it('should create contact then pubsub when following info is received', function(done) {
      var count = 0;
      twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
        if (value === '/friends/ids.json') {
          onSuccess(followingIdList);
        }
        if (value === '/users/lookup.json') {
          onSuccess(JSON.stringify(followingInfoList));
        }

      };

      dependencies.pubsub.local.topic = function() {
        return {
          publish: function() {
            count++;
            if (count === 3) {
              done();
            }
          }
        };
      };

      getImporter().importContact(options);
    });
  });
});
