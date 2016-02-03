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

  var contactClientMock = {
    create: function() {
      return q([]);
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
        info: function() {},
        error: function() {},
        debug: function() {},
        warn: function() {}
      },
      pubsub: {
        global: {
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
              addressbookHome: function() {
                return {
                  addressbook: function() {
                    return {
                      vcard: function() {
                        return contactClientMock;
                      }
                    };
                  }
                };
              }
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

    it('should return promise reject if can not get oauth config', function(done) {
      dependencies['esn-config'] = function() {
        return {
          get: function(callback) {
            callback(null, null);
          }
        };
      };
      getImporter().importContact(options).then(null, function(err) {
          expect(err).to.deep.equal('Can not get oauth configuration for twitter importer');
          done();
        });
    });

    it('should get following ids for the first step', function(done) {
      twitterClient.getCustomApiCall = function(value) {
        if (value === '/friends/ids.json') {
          done();
        }
      };
      getImporter().importContact(options);
    });

    it('should lookup for following info for the 2nd step', function(done) {
      twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
        if (value === '/friends/ids.json') {
          onSuccess(followingIdList);
        }
        if (value === '/users/lookup.json') {
          done();
        }
      };
      getImporter().importContact(options);
    });

    it('should get at most 18000 following ids', function(done) {
      var count = 0;
      twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
        if (value === '/friends/ids.json') {
          count++;
          onSuccess(longIdList);
        } else {
          onError();
        }
      };
      getImporter().importContact(options).then(null, function() {
        expect(count).to.equal(3000);
        done();
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

      dependencies.pubsub.global.topic = function() {
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

    describe('Error handlers', function() {
      var CONTACT_IMPORT_ERROR;
      beforeEach(function() {
        CONTACT_IMPORT_ERROR = dependencies['contact-import'].constants.CONTACT_IMPORT_ERROR;
      });

      it('should pubsub CONTACT_CLIENT_ERROR when contact client reject', function(done) {
        twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
          if (value === '/friends/ids.json') {
            onSuccess(followingIdList);
          }
          if (value === '/users/lookup.json') {
            onSuccess(JSON.stringify(followingInfoList));
          }
        };
        contactClientMock.create = function() {
          return q.reject(new Error('an error'));
        };
        dependencies.pubsub.global.topic = function(topic) {
          expect(topic).to.equal(CONTACT_IMPORT_ERROR.CONTACT_CLIENT_ERROR);
          return {
            publish: function(data) {
              expect(data).to.eql({
                type: CONTACT_IMPORT_ERROR.CONTACT_CLIENT_ERROR,
                provider: options.account.data.provider,
                account: options.account.data.username,
                user: options.user
              });
              done();
            }
          };
        };
        getImporter().importContact(options);
      });

      it('should pubsub ACCOUNT_ERROR when Twitter client return 400 error while getting following IDs', function(done) {
        twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
          if (value === '/friends/ids.json') {
            onError({
              statusCode: 400
            });
          }
          if (value === '/users/lookup.json') {
            onSuccess(JSON.stringify(followingInfoList));
          }
        };
        dependencies.pubsub.global.topic = function(topic) {
          expect(topic).to.equal(CONTACT_IMPORT_ERROR.ACCOUNT_ERROR);
          return {
            publish: function(data) {
              expect(data).to.eql({
                type: CONTACT_IMPORT_ERROR.ACCOUNT_ERROR,
                provider: options.account.data.provider,
                account: options.account.data.username,
                user: options.user
              });
              done();
            }
          };
        };
        getImporter().importContact(options);
      });

      it('should pubsub ACCOUNT_ERROR when Twitter client return 401 error while getting following IDs', function(done) {
        twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
          if (value === '/friends/ids.json') {
            onError({
              statusCode: 401
            });
          }
          if (value === '/users/lookup.json') {
            onSuccess(JSON.stringify(followingInfoList));
          }
        };
        dependencies.pubsub.global.topic = function(topic) {
          expect(topic).to.equal(CONTACT_IMPORT_ERROR.ACCOUNT_ERROR);
          return {
            publish: function(data) {
              expect(data).to.eql({
                type: CONTACT_IMPORT_ERROR.ACCOUNT_ERROR,
                provider: options.account.data.provider,
                account: options.account.data.username,
                user: options.user
              });
              done();
            }
          };
        };
        getImporter().importContact(options);
      });

      it('should pubsub ACCOUNT_ERROR when Twitter client return 403 error while getting following IDs', function(done) {
        twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
          if (value === '/friends/ids.json') {
            onError({
              statusCode: 403
            });
          }
          if (value === '/users/lookup.json') {
            onSuccess(JSON.stringify(followingInfoList));
          }
        };
        dependencies.pubsub.global.topic = function(topic) {
          expect(topic).to.equal(CONTACT_IMPORT_ERROR.ACCOUNT_ERROR);
          return {
            publish: function(data) {
              expect(data).to.eql({
                type: CONTACT_IMPORT_ERROR.ACCOUNT_ERROR,
                provider: options.account.data.provider,
                account: options.account.data.username,
                user: options.user
              });
              done();
            }
          };
        };
        getImporter().importContact(options);
      });

      it('should pubsub API_CLIENT_ERROR when Twitter client return other errors while getting following IDs', function(done) {
        twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
          if (value === '/friends/ids.json') {
            onError({
              statusCode: 503
            });
          }
          if (value === '/users/lookup.json') {
            onSuccess(JSON.stringify(followingInfoList));
          }
        };
        dependencies.pubsub.global.topic = function(topic) {
          expect(topic).to.equal(CONTACT_IMPORT_ERROR.API_CLIENT_ERROR);
          return {
            publish: function(data) {
              expect(data).to.eql({
                type: CONTACT_IMPORT_ERROR.API_CLIENT_ERROR,
                provider: options.account.data.provider,
                account: options.account.data.username,
                user: options.user
              });
              done();
            }
          };
        };
        getImporter().importContact(options);
      });

      it('should pubsub API_CLIENT_ERROR when Twitter client failed to reach API endpoint while getting following IDs', function(done) {
        twitterClient.getCustomApiCall = function(value, option, onError, onSuccess) {
          if (value === '/friends/ids.json') {
            onError(new Error('some error'));
          }
          if (value === '/users/lookup.json') {
            onSuccess(JSON.stringify(followingInfoList));
          }
        };
        dependencies.pubsub.global.topic = function(topic) {
          expect(topic).to.equal(CONTACT_IMPORT_ERROR.API_CLIENT_ERROR);
          return {
            publish: function(data) {
              expect(data).to.eql({
                type: CONTACT_IMPORT_ERROR.API_CLIENT_ERROR,
                provider: options.account.data.provider,
                account: options.account.data.username,
                user: options.user
              });
              done();
            }
          };
        };
        getImporter().importContact(options);
      });

    });

  });
});
