'use strict';

var expect = require('chai').expect;

describe('The link middleware', function() {

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('The trackProfileView fn', function() {

    it('should not send an error if request does not content a user', function(done) {
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/link');
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/link').trackProfileView;
      var req = {
      };
      var res = {};
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });

    it('should not send an error if request does not content a profile uuid', function(done) {
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/link');
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/link').trackProfileView;
      var req = {
        user: {},
        params: {}
      };
      var res = {};
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });

    it('should create a profile link between the request user and the target user', function(done) {
      var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      var Link = require(this.testEnv.basePath + '/backend/core/db/mongo/models/link');

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/link').trackProfileView;

      var foouser = new User({
        emails: ['foo@bar.com']
      });

      var baruser = new User({
        emails: ['bar@bar.com']
      });

      function saveUser(user, cb) {
        user.save(function(err, saved) {
          if (saved) {
            user._id = saved._id;
          }
          return cb(err, saved);
        });
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          saveUser(baruser, callback);
        }
      ],
      function(err) {
        if (err) {
          return done(err);
        }

        var req = {
          user: foouser,
          params: {
            uuid: '' + baruser._id
          }
        };
        var res = {
          json: function() {
            done(new Error('Should not be called'));
          }
        };
        var next = function() {
          Link.find({user: foouser._id}, function(err, links) {
            expect(err).to.not.exist;
            expect(links).to.exist;
            expect(links.length).to.equal(1);
            expect(links[0].type).to.equal('profile');
            expect(links[0].target).to.exist;
            expect(links[0].target.resource).to.deep.equal(baruser._id);
            expect(links[0].target.type).to.equal('User');
            done();
          });
        };
        middleware(req, res, next);
      });
    });
  });
});
