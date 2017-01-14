'use strict';

var expect = require('chai').expect,
    request = require('supertest'),
    mockery = require('mockery');

describe('The twitter API', function() {

  var self,
      user,
      password = 'secret',
      moduleName = 'linagora.esn.unifiedinbox',
      modelsFixture;

  function createUserAccountThen(provider, accountId, callback) {
    user.accounts.push({
      data: {
        provider: provider,
        id: accountId
      }
    });

    return user.save(callback);
  }

  function startExpressApp() {
    var expressApp = require('../../backend/webserver/application')(self.helpers.modules.current.deps);
    expressApp.use('/', self.helpers.modules.current.lib.api.twitter);
    self.app = self.helpers.modules.getWebServer(expressApp);
  }

  function initMidway(done) {
    self.helpers.modules.initMidway(moduleName, function(err) {
      if (err) {
        return done(err);
      }

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        modelsFixture = models;
        user = modelsFixture.users[0];
        startExpressApp();
        done();
      });
    });
  }

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(modelsFixture, done);
  });

  var twitter = {
    get: function() {
    }
  };
  var twitterClientMocks = function() {
      return twitter;
  };

  describe('GET /api/inbox/tweets', function() {

    var ENDPOINT = '/api/inbox/tweets';

    it('should return 401 if not logged in', function(done) {
      self = this;
      initMidway(function() {
        self.helpers.api.requireLogin(self.app, 'get', ENDPOINT, done);
      });
    });

    describe('When the request is malformed', function() {

      it('should return 400 if the request has no query params', function(done) {
        self = this;
        initMidway(function() {

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
            var req = requestAsMember(request(self.app).get(ENDPOINT));
            req.expect(400, function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.deep.equal({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'account_id is required'
                }
              });
              done();
            });
          });

        });
      });

      it('should return 400 if the request has no account_id in query params', function(done) {
        self = this;
        initMidway(function() {

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
            var req = requestAsMember(request(self.app).get(ENDPOINT).query({ other_account_id: '123' }));
            req.expect(400, function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.deep.equal({
                error: {
                  code: 400,
                  message: 'Bad Request',
                  details: 'account_id is required'
                }
              });
              done();
            });
          });
        });

      });
    });

    describe('When the request asks for a wrong account', function() {

      it('should return 404 when the account type is not twitter', function(done) {
        self = this;
        initMidway(function() {

          createUserAccountThen('other provider', '123', function(createError) {
            expect(createError).to.not.exist;

            self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
              var req = requestAsMember(request(self.app).get(ENDPOINT).query({ account_id: '123' }));
              req.expect(404, function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.deep.equal({
                  error: {
                    code: 404,
                    message: 'Not found',
                    details: 'No twitter account has been found for account 123'
                  }
                });
                done();
              });
            });
          });

        });
      });

      it('should return 404 when the account id mismatches', function(done) {
        self = this;
        initMidway(function() {

          createUserAccountThen('twitter', 'other account id', function(createError) {
            expect(createError).to.not.exist;

            self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
              var req = requestAsMember(request(self.app).get(ENDPOINT).query({ account_id: '123' }));
              req.expect(404, function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.deep.equal({
                  error: {
                    code: 404,
                    message: 'Not found',
                    details: 'No twitter account has been found for account 123'
                  }
                });
                done();
              });
            });
          });

        });
      });

    });

    describe('when the server and the request are ok', function() {

      it('should return 500 when the mentions request is rejected', function(done) {
        self = this;

        twitter.get = function(value, options, callback) {
          if (value === '/statuses/mentions_timeline') {
            return callback(new Error('expected message'));
          }
        };

        mockery.registerMock('twit', twitterClientMocks);
        initMidway(function() {

          var conf = self.helpers.modules.current.deps('esn-config')('oauth');
          conf.store({twitter: true}, function() {

            createUserAccountThen('twitter', '123', function(createError) {
              expect(createError).to.not.exist;

              self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
                var req = requestAsMember(request(self.app).get(ENDPOINT).query({ account_id: '123' }));
                req.expect(500, function(err, res) {
                  expect(err).to.not.exist;
                  expect(res.body).to.deep.equal({
                    error: {
                      code: 500,
                      message: 'Error when trying to fetch tweets',
                      details: 'expected message'
                    }
                  });
                  done();
                });
              });
            });
          });

        });
      });

      it('should return 500 when the dm request is rejected', function(done) {
        self = this;

        twitter.get = function(value, options, callback) {
          if (value === '/direct_messages') {
            return callback(new Error('expected message'));
          }
        };

        mockery.registerMock('twit', twitterClientMocks);
        initMidway(function() {

          var conf = self.helpers.modules.current.deps('esn-config')('oauth');
          conf.store({twitter: true}, function() {

            createUserAccountThen('twitter', '123', function(createError) {
              expect(createError).to.not.exist;

              self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
                var req = requestAsMember(request(self.app).get(ENDPOINT).query({ account_id: '123' }));
                req.expect(500, function(err, res) {
                  expect(err).to.not.exist;
                  expect(res.body).to.deep.equal({
                    error: {
                      code: 500,
                      message: 'Error when trying to fetch tweets',
                      details: 'expected message'
                    }
                  });
                  done();
                });
              });
            });
          });

        });
      });

      it('should return 200 when mentions and dm return nothing', function(done) {
        self = this;

        twitter.get = function(value, options, callback) {
            return callback(null, [[]]);
        };

        mockery.registerMock('twit', twitterClientMocks);

        initMidway(function() {

          var conf = self.helpers.modules.current.deps('esn-config')('oauth');
          conf.store({twitter: true}, function() {

            createUserAccountThen('twitter', '123', function(createError) {
              expect(createError).to.not.exist;

              self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
                var req = requestAsMember(request(self.app).get(ENDPOINT).query({ account_id: '123' }));
                req.expect(200, function(err, res) {
                  expect(err).to.not.exist;
                  expect(res.body).to.deep.equal([]);
                  done();
                });
              });
            });
          });

        });
      });

      it('should return 200 when mentions and dm return data', function(done) {
        self = this;

        twitter.get = function(value, options, callback) {

            if (value === '/statuses/mentions_timeline') {
              return callback(null, [[{
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
            }
            if (value === '/direct_messages') {
              return callback(null, [[{
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
            }

        };

        mockery.registerMock('twit', twitterClientMocks);

        initMidway(function() {

          var conf = self.helpers.modules.current.deps('esn-config')('oauth');
          conf.store({twitter: true}, function() {

            createUserAccountThen('twitter', '123', function(createError) {
              expect(createError).to.not.exist;

              self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, requestAsMember) {
                var req = requestAsMember(request(self.app).get(ENDPOINT).query({ account_id: '123' }));
                req.expect(200, function(err, res) {
                  expect(err).to.not.exist;
                  expect(res.body).to.deep.equal([{
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
                  }, {
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
              });
            });
          });

        });
      });

    });

  });
});
