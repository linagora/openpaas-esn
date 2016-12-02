'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var q = require('q');

describe('The twitter contact importer', function() {

  var deps, dependencies;
  var twitterClient = {
    get: function() {
    }
  };
  var twitterClientMocks = function() {
      return twitterClient;
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
        info: function() {},
        error: function() {},
        debug: function() {},
        warn: function() {}
      },
      pubsub: {
        local: {
          topic: function() {
            return {
              forward: function() {}
            };
          }
        }
      },
      'contact-import': {
        constants: {
          CONTACT_IMPORT_ERROR: {
            ACCOUNT_ERROR: 'contact:import:account:error',
            API_CLIENT_ERROR: 'contact:import:api:error',
            CONTACT_CLIENT_ERROR: 'contact:import:contact:error'
          }
        },
        lib: {
          import: {
            buildErrorMessage: function() {
              return {};
            },
            createContact: function() {
              return q.resolve({});
            }
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

      followingIdList = [{ids: [123, 234, 345], next_cursor: 0}];
      longIdList = [{ids: [123, 234, 345, 567, 789, 890], next_cursor: 2345}];
      followingInfoList =
        [[
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
        ]];
      options = {
        addressbook: {
          id: 1234
        },
        account: {
          type: 'oauth',
          data: {
            username: 'linagora',
            provider: 'twitter',
            token: 456,
            token_secret: 'abc'
          }
        },
        esnToken: 123,
        user: { _id: 'myId' }
      };

      mockery.registerMock('twit', twitterClientMocks);
    });

    it('should return promise reject if can not get oauth config', function(done) {
      dependencies['esn-config'] = function() {
        return {
          get: function(callback) {
           return callback(null, null);
          }
        };
      };
      getImporter().importContact(options).then(null, function(err) {
          expect(err).to.deep.equal('Can not get oauth configuration for twitter importer');
          return done();
        });
    });

    it('should get following ids for the first step', function(done) {
      twitterClient.get = function(value) {
        if (value === '/friends/ids') {
          return done();
        } else {
          return done(new Error());
        }
      };
      getImporter().importContact(options);
    });

    it('should lookup for following info for the 2nd step', function(done) {
      twitterClient.get = function(value, option, callback) {
        if (value === '/friends/ids') {
          return callback(null, followingIdList);
        }
        if (value === '/users/lookup') {
          return done();
        }
        return done(new Error('Bad value', value));
      };
      getImporter().importContact(options);
    });

    it('should get at most 18000 following ids', function(done) {
      var count = 0;
      twitterClient.get = function(value, option, callback) {
        if (value === '/friends/ids') {
          count++;
          return callback(null, longIdList);
        } else {
          return callback(new Error());
        }
      };
      getImporter().importContact(options).then(null, function() {
        expect(count).to.equal(3000);
        return done();
      });
    });

    it('should create contact when following info is received', function(done) {
      var count = 0;
      twitterClient.get = function(value, option, callback) {
        if (value === '/friends/ids') {
          return callback(null, followingIdList);
        }
        if (value === '/users/lookup') {
          return callback(null, followingInfoList);
        }
      };

      dependencies['contact-import'].lib.import.createContact = function() {
        count++;
        if (count === 3) {
          return done();
        }
      };
      getImporter().importContact(options);
    });
  });
});
