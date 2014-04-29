'use strict';

var expect = require('chai').expect,
    mongodb = require('mongodb'),
    mockery = require('mockery');

describe('recordUser method', function() {
  var User = null;
  var userModule = null;

  beforeEach(function() {
    User = function User(user) {
      this.name = user.name;
      this.emails = ['email1', 'email2'];
    };
    User.prototype.save = function(callback) {
      callback();
    };
    var mongooseMocked = {
      model: function(model) {
        return User;
      }
    };
    mockery.registerMock('mongoose', mongooseMocked);
    userModule = require(this.testEnv.basePath + '/backend/core').user;
  });

  it('should save a user if it is not an instance of User model', function(done) {
    userModule.recordUser({name: 'aName'}, done);
  });

  it('should also save a user if it is an instance of User model', function(done) {
    userModule.recordUser(new User({name: 'aName'}), done);
  });
});

describe('The user core module', function() {
  var userModule = null;

  beforeEach(function(done) {
    var self = this;
    var template = require(this.testEnv.fixtures + '/user-template').simple();
    this.testEnv.writeDBConfigFile();
    var core = this.testEnv.initCore();
    userModule = core.user;
    this.mongoose = require('mongoose');
    this.mongoose.connection.collection('templates').insert(template, function() {
      userModule = require(self.testEnv.basePath + '/backend/core').user;
      done();
    });
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('provisionUser method', function() {

    it('should record a user with the template informations', function(done) {
      userModule.provisionUser({emails: ['test@linagora.com']}, function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user._id).to.exist;
        expect(user.emails).to.exist;
        expect(user.emails).to.be.an.array;
        expect(user.emails).to.have.length(1);
        expect(user.emails[0]).to.equal('test@linagora.com');
        expect(user.firstname).to.equal('john');
        expect(user.lastname).to.equal('doe');
        done();
      });
    });

    it('should add a schemaVersion to the user object', function(done) {
      userModule.provisionUser({emails: ['test@linagora.com']}, function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user.schemaVersion).to.exist;
        expect(user.schemaVersion).to.be.a.number;
        expect(user.schemaVersion).to.be.at.least(1);
        done();
      });
    });

    it('should add a timestamps.creation to the user object', function(done) {
      userModule.provisionUser({emails: ['test@linagora.com']}, function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user.timestamps).to.exist;
        expect(user.timestamps.creation).to.exist;
        expect(user.timestamps.creation).to.be.a.Date;
        done();
      });
    });


    it('should return an error if the user does not have an emails property', function(done) {
      userModule.provisionUser({foo: 'bar'}, function(err, user) {
        expect(err).to.not.be.null;
        expect(err.name).to.exist;
        expect(err.name).to.equal('ValidationError');
        done();
      });

    });

    it('should return an error if some user with the same email is already in the database', function(done) {
      userModule.provisionUser({emails: ['test@linagora.com']}, function(err, user) {
        expect(err).to.be.null;
        userModule.provisionUser({emails: ['test@linagora.com']}, function(err, user) {
          expect(err).to.not.be.null;
          expect(err.name).to.be.a.string;
          expect(err.name).to.equal('MongoError');
          expect(err.code).to.equal(11000);
          done();
        });
      });
    });

    it('should return an error if some user with the same email is already in the database (multi values)', function(done) {
      userModule.provisionUser({emails: ['test@linagora.com', 'test2@linagora.com']}, function(err, user) {
        expect(err).to.be.null;
        userModule.provisionUser({emails: ['test3@linagora.com', 'test@linagora.com']}, function(err, user) {
          expect(err).to.not.be.null;
          expect(err.name).to.be.a.string;
          expect(err.name).to.equal('MongoError');
          expect(err.code).to.equal(11000);
          done();
        });
      });
    });

    it('should return an error if the email array is empty', function(done) {
      userModule.provisionUser({emails: []}, function(err, user) {
        expect(err).to.not.be.not.null;
        expect(err.name).to.be.a.string;
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });

    it('should return an error if some email is invalid', function(done) {
      userModule.provisionUser({emails: ['test1@linagora.com', 'invalid', 'test2@linagora.com']}, function(err, user) {
        expect(err).to.not.be.not.null;
        expect(err.name).to.be.a.string;
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });
  });

  describe('findByEmail method', function() {

    it('should find a user when we provide an email address', function(done) {
      var user = {
        emails: ['test1@linagora.com', 'test2@linagora.com']
      };

      var finduser = function() {
        userModule.findByEmail('test2@linagora.com', function(err, user) {
          expect(err).to.be.null;
          expect(user).to.exist;
          expect(user).to.be.an.object;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.include('test2@linagora.com');
          done();
        });
      };

      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('users').insert(user, finduser);
      });
    });

    it('should find a user when we provide an array of email addresses', function(done) {
      var user = {
        emails: ['test1@linagora.com', 'test2@linagora.com']
      };

      var finduser = function() {
        userModule.findByEmail(['test2@linagora.com'], function(err, user) {
          expect(err).to.be.null;
          expect(user).to.exist;
          expect(user).to.be.an.object;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.include('test2@linagora.com');
          done();
        });
      };

      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('users').insert(user, finduser);
      });
    });

    it('should not find a user if we provide an non existing email addresses', function(done) {
      var user = {
        emails: ['test1@linagora.com', 'test2@linagora.com']
      };

      var finduser = function() {
        userModule.findByEmail(['test22@linagora.com'], function(err, user) {
          expect(err).to.be.null;
          expect(user).to.be.null;
          done();
        });
      };

      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('users').insert(user, finduser);
      });
    });
  });

  describe('get method', function() {

    it('should return a user from its uuid', function(done) {
      var user = {
        emails: ['test1@linagora.com']
      };

      var finduser = function(err, saved) {
        userModule.get(saved[0]._id, function(err, user) {
          expect(err).to.be.null;
          expect(user).to.exist;
          expect(user).to.be.an.object;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.include('test1@linagora.com');
          done();
        });
      };

      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('users').insert(user, finduser);
      });
    });
  });

  describe('updateProfile fn', function() {

    it('should send back an error when user is undefined', function(done) {
      userModule.updateProfile(null, 'param', 'value', function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back an error when param is undefined', function(done) {
      userModule.updateProfile('1223', null, 'value', function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back an error when value is undefined', function(done) {
      userModule.updateProfile('1223', 'param', null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should update the firstname', function(done) {
      var firstname = 'John';
      var database;

      var user = {
        firstname: 'foo',
        emails: ['test1@linagora.com']
      };

      var updateUser = function(err, saved) {
        userModule.updateProfile(saved[0]._id, 'firstname', firstname, function(err) {
          expect(err).to.be.null;
          database.collection('users').findOne({_id: saved[0]._id}, function(err, updated) {
            if (err) {
              return done(err);
            }
            expect(updated.firstname).to.equal(firstname);
            done();
          });
        });
      };

      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        database = db;
        db.collection('users').insert(user, updateUser);
      });
    });

    it('should update the firstname even if value is the empty string', function(done) {
      var database;

      var user = {
        firstname: 'foo',
        emails: ['test2@linagora.com']
      };

      var updateUser = function(err, saved) {
        userModule.updateProfile(saved[0]._id, 'firstname', '', function(err) {
          expect(err).to.be.null;
          database.collection('users').findOne({_id: saved[0]._id}, function(err, updated) {
            if (err) {
              return done(err);
            }
            expect(updated.firstname).to.equal('');
            done();
          });
        });
      };

      mongodb.MongoClient.connect(this.testEnv.mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        database = db;
        db.collection('users').insert(user, updateUser);
      });
    });

  });
});
