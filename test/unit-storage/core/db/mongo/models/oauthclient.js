'use strict';

var expect = require('chai').expect;
var mongodb = require('mongodb');

describe('The oauthclient model module', function() {
  var User, OAuthClient;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.helpers.requireBackend('core/db/mongo/models/user');
    this.helpers.requireBackend('core/db/mongo/models/oauthclient');
    this.testEnv.writeDBConfigFile();
    User = this.mongoose.model('User');
    OAuthClient = this.mongoose.model('OAuthClient');
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('creator field', function() {
    it('should be set on save', function(done) {
      var userId;
      var mongoUrl = this.testEnv.mongoUrl;
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: ['foo@linagora.com', 'bar@linagora.com']});

      function saveUser(callback) {
        u.save(function(err, savedUser) {
          if (err) {
            return done(err);
          }
          return callback(savedUser);
        });
      }

      function saveOAuthClient(json, callback) {
        var client = new OAuthClient(json);
        client.save(function(err, savedClient) {
          if (err) {
            return done(err);
          }
          return callback(savedClient);
        });
      }

      function test(savedClient) {
        mongodb.MongoClient.connect(mongoUrl, function(err, db) {
          if (err) {
            return done(err);
          }
          db.collection('oauthclients').findOne({_id: savedClient._id}, function(err, client) {
            if (err) {
              return done(err);
            }
            expect(client).to.be.not.null;
            expect(client.creator).to.exist;
            expect(client.creator + '').to.equal(userId + '');
            db.close(done);
          });
        });
      }

      saveUser(function(savedUser) {
        var clientJSON = {
          name: 'anApp',
          creator: savedUser
        };
        userId = savedUser._id;
        saveOAuthClient(clientJSON, test);
      });
    });
  });

  describe('clientId and clientSecret field', function() {
    it('should be generated on save', function(done) {
      var userId;
      var mongoUrl = this.testEnv.mongoUrl;
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: ['foo@linagora.com', 'bar@linagora.com']});

      function saveUser(callback) {
        u.save(function(err, savedUser) {
          if (err) {
            return done(err);
          }
          return callback(savedUser);
        });
      }

      function saveOAuthClient(json, callback) {
        var client = new OAuthClient(json);
        client.save(function(err, savedClient) {
          if (err) {
            return done(err);
          }
          return callback(savedClient);
        });
      }

      function test(savedClient) {
        mongodb.MongoClient.connect(mongoUrl, function(err, db) {
          if (err) {
            return done(err);
          }
          db.collection('oauthclients').findOne({_id: savedClient._id}, function(err, client) {
            if (err) {
              return done(err);
            }
            expect(client).to.be.not.null;
            expect(client.clientId).to.exist;
            expect(client.clientId.length).to.be.equal(20);
            expect(client.clientSecret).to.exist;
            expect(client.clientSecret.length).to.be.equal(40);

            db.close(done);
          });
        });
      }

      saveUser(function(savedUser) {
        var clientJSON = {
          name: 'anApp',
          creator: savedUser
        };
        userId = savedUser._id;
        saveOAuthClient(clientJSON, test);
      });
    });
  });

});
