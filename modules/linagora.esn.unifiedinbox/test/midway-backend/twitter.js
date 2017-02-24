'use strict';

const expect = require('chai').expect,
      request = require('supertest'),
      mockery = require('mockery');

describe('The Twitter API', function() {

  let helpers, models, app, twit;

  beforeEach(function(done) {
    helpers = this.helpers;

    helpers.modules.initMidway('linagora.esn.unifiedinbox', helpers.callbacks.noErrorAnd(() => {
      helpers.api.applyDomainDeployment('linagora_test_domain', helpers.callbacks.noErrorAnd(deployedModels => {
        models = deployedModels;

        done();
      }));
    }));

    twit = {
      get: () => {}
    };
    mockery.registerMock('twit', function() { return twit; });
  });

  beforeEach(function() {
    app = require('../../backend/webserver/application')(helpers.modules.current.deps);
  });

  afterEach(function(done) {
    helpers.requireBackend('core/esn-config')('oauth').store(null, helpers.callbacks.noErrorAnd(() => {
      helpers.api.cleanDomainDeployment(models, done);
    }));
  });

  describe('GET /api/inbox/twitter/directmessages', function() {

    it('should return 401 if the user is not authenticated', function(done) {
      request(app)
        .get('/api/inbox/twitter/directmessages')
        .expect(401)
        .end(done);
    });

    it('should return 400 if the request has no query params', function(done) {
      request(app)
        .get('/api/inbox/twitter/directmessages')
        .auth('user1@lng.net', 'secret')
        .expect(400)
        .end(done);
    });

    it('should return 400 if the request has no account_id in query params', function(done) {
      request(app)
        .get('/api/inbox/twitter/directmessages?foo=bar')
        .auth('user1@lng.net', 'secret')
        .expect(400)
        .end(done);
    });

    it('should return 404 when the account type is not twitter', function(done) {
      request(app)
        .get('/api/inbox/twitter/directmessages?account_id=googleAccountId')
        .auth('user1@lng.net', 'secret')
        .expect(404)
        .end(done);
    });

    it('should return 404 when the account does not exist', function(done) {
      request(app)
        .get('/api/inbox/twitter/directmessages?account_id=nonExistentAccountId')
        .auth('user1@lng.net', 'secret')
        .expect(404)
        .end(done);
    });

    it('should return 503 when there is no OAuth configuration for Twitter', function(done) {
      request(app)
        .get('/api/inbox/twitter/directmessages?account_id=twitterAccountId')
        .auth('user1@lng.net', 'secret')
        .expect(503)
        .end(done);
    });

    it('should return 500 when the DM request is rejected', function(done) {
      twit.get = (endpoint, options, callback) => {
        expect(endpoint).to.equal('/direct_messages');

        callback(new Error('WTF'));
      };

      helpers.requireBackend('core/esn-config')('oauth').store({ twitter: true }, this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/api/inbox/twitter/directmessages?account_id=twitterAccountId')
          .auth('user1@lng.net', 'secret')
          .expect(500)
          .end(done);
      }));
    });

    it('should return 200 with an empty list when there is no DM', function(done) {
      twit.get = (endpoint, options, callback) => callback(null, [[]]);

      helpers.requireBackend('core/esn-config')('oauth').store({ twitter: true }, this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/api/inbox/twitter/directmessages?account_id=twitterAccountId')
          .auth('user1@lng.net', 'secret')
          .expect(200, '[]')
          .end(done);
      }));
    });

    it('should return 200 with transformed DM', function(done) {
      twit.get = (value, options, callback) => {
        callback(null, [[{
          created_at: 'Mon Aug 20 17:21:03 +0000 2012',
          id: 420136858829479936,
          user: {
            id: 4242,
            name: 'Captain Crochet',
            profile_image_url_https: 'https://si0.twimg.com/profile_images/1751506047/dead_sexy_normal.JPG',
            screen_name: 'CallMeCaptain'
          },
          text: 'Hey @me'
        }]]);
      };

      helpers.requireBackend('core/esn-config')('oauth').store({ twitter: true }, this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/api/inbox/twitter/directmessages?account_id=twitterAccountId')
          .auth('user1@lng.net', 'secret')
          .expect(200)
          .then(res => {
            expect(JSON.parse(res.text)).to.deep.equal([{
              author: {
                avatar: 'https://si0.twimg.com/profile_images/1751506047/dead_sexy_normal.JPG',
                displayName: 'Captain Crochet',
                id: 4242,
                screenName: '@CallMeCaptain'
              },
              date: '2012-08-20T17:21:03.000Z',
              id: 420136858829479940,
              text: 'Hey @me'
            }]);

            done();
          });
      }));
    });

  });

  describe('GET /api/inbox/twitter/mentions', function() {

    it('should return 401 if the user is not authenticated', function(done) {
      request(app)
        .get('/api/inbox/twitter/mentions')
        .expect(401)
        .end(done);
    });

    it('should return 400 if the request has no query params', function(done) {
      request(app)
        .get('/api/inbox/twitter/mentions')
        .auth('user1@lng.net', 'secret')
        .expect(400)
        .end(done);
    });

    it('should return 400 if the request has no account_id in query params', function(done) {
      request(app)
        .get('/api/inbox/twitter/mentions?foo=bar')
        .auth('user1@lng.net', 'secret')
        .expect(400)
        .end(done);
    });

    it('should return 404 when the account type is not twitter', function(done) {
      request(app)
        .get('/api/inbox/twitter/mentions?account_id=googleAccountId')
        .auth('user1@lng.net', 'secret')
        .expect(404)
        .end(done);
    });

    it('should return 404 when the account does not exist', function(done) {
      request(app)
        .get('/api/inbox/twitter/mentions?account_id=nonExistentAccountId')
        .auth('user1@lng.net', 'secret')
        .expect(404)
        .end(done);
    });

    it('should return 503 when there is no OAuth configuration for Twitter', function(done) {
      request(app)
        .get('/api/inbox/twitter/mentions?account_id=twitterAccountId')
        .auth('user1@lng.net', 'secret')
        .expect(503)
        .end(done);
    });

    it('should return 500 when the mentions request is rejected', function(done) {
      twit.get = (endpoint, options, callback) => {
        expect(endpoint).to.equal('/statuses/mentions_timeline');

        callback(new Error('WTF'));
      };

      helpers.requireBackend('core/esn-config')('oauth').store({ twitter: true }, this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/api/inbox/twitter/mentions?account_id=twitterAccountId')
          .auth('user1@lng.net', 'secret')
          .expect(500)
          .end(done);
      }));
    });

    it('should return 200 with an empty list when there is no mentions', function(done) {
      twit.get = (endpoint, options, callback) => callback(null, [[]]);

      helpers.requireBackend('core/esn-config')('oauth').store({ twitter: true }, this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/api/inbox/twitter/mentions?account_id=twitterAccountId')
          .auth('user1@lng.net', 'secret')
          .expect(200, '[]')
          .end(done);
      }));
    });

    it('should return 200 with transformed mentions', function(done) {
      twit.get = (value, options, callback) => {
        callback(null, [[{
          created_at: 'Mon Aug 27 17:21:03 +0000 2012',
          id: 240136858829479936,
          recipient: {
            id: 776627022,
            name: 'Mick Jagger',
            profile_image_url_https: 'https://si0.twimg.com/profile_images/2550226257/y0ef5abcx5yrba8du0sk_normal.jpeg',
            screen_name: 's0c1alm3dia'
          },
          sender: {
            id: 38895958,
            name: 'Sean Cook',
            profile_image_url_https: 'https://si0.twimg.com/profile_images/1751506047/dead_sexy_normal.JPG',
            screen_name: 'theSeanCook'
          },
          text: 'booyakasha'
        }]]);
      };

      helpers.requireBackend('core/esn-config')('oauth').store({ twitter: true }, this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/api/inbox/twitter/mentions?account_id=twitterAccountId')
          .auth('user1@lng.net', 'secret')
          .expect(200)
          .then(res => {
            expect(JSON.parse(res.text)).to.deep.equal([{
              author: {
                avatar: 'https://si0.twimg.com/profile_images/1751506047/dead_sexy_normal.JPG',
                displayName: 'Sean Cook',
                id: 38895958,
                screenName: '@theSeanCook'
              },
              date: '2012-08-27T17:21:03.000Z',
              id: 240136858829479940,
              rcpt: {
                avatar: 'https://si0.twimg.com/profile_images/2550226257/y0ef5abcx5yrba8du0sk_normal.jpeg',
                displayName: 'Mick Jagger',
                id: 776627022,
                screenName: '@s0c1alm3dia'
              },
              text: 'booyakasha'
            }]);

            done();
          });
      }));
    });

  });

});
