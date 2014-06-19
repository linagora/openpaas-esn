'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The OAuth Core Module', function() {

  it('findUserByToken should send back error when OAuthAccessToken#find fails', function(done) {
    var mongoose = {
      model: function() {
        return {
          find: function() {
            return {
              populate: function() {
                return {
                  exec: function(callback) {
                    return callback(new Error());
                  }
                };
              }
            };
          }
        };
      }
    };
    mockery.registerMock('mongoose', mongoose);
    var oauth = require(this.testEnv.basePath + '/backend/core/auth/oauth');

    oauth.findUserByToken('', function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('findUserByToken should send user when returned by OAuthAccessToken#find', function(done) {
    var user = {
      name: 'foo'
    };

    var mongoose = {
      model: function() {
        return {
          find: function() {
            return {
              populate: function() {
                return {
                  exec: function(callback) {

                    return callback(null, {userId: user});
                  }
                };
              }
            };
          }
        };
      }
    };
    mockery.registerMock('mongoose', mongoose);
    var oauth = require(this.testEnv.basePath + '/backend/core/auth/oauth');

    oauth.findUserByToken('', function(err, u) {
      expect(err).to.not.exist;
      expect(u).to.exist;
      expect(u).to.deep.equal(user);
      done();
    });
  });

  it('findUserByToken should send back nothing when user is not returned by OAuthAccessToken#find', function(done) {
    var mongoose = {
      model: function() {
        return {
          find: function() {
            return {
              populate: function() {
                return {
                  exec: function(callback) {
                    return callback(null, {});
                  }
                };
              }
            };
          }
        };
      }
    };
    mockery.registerMock('mongoose', mongoose);
    var oauth = require(this.testEnv.basePath + '/backend/core/auth/oauth');

    oauth.findUserByToken('', function(err, u) {
      expect(err).to.not.exist;
      expect(u).to.not.exist;
      done();
    });
  });
});
