'use strict';

var expect = require('chai').expect;
var path = require('path');
var fs = require('fs');
var BASEPATH = '../../../..';
var mongodb = require('mongodb');

var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');

describe('The user core module', function() {
  describe('provisionUser method', function() {
    beforeEach(function(done) {
      var mongo = {hostname: 'localhost', port: 27017, dbname: 'test'};
      process.env.NODE_CONFIG = tmp;
      fs.writeFileSync(tmp + '/db.json', JSON.stringify(mongo));
      var userTemplate = require('../fixtures/user-template').simple();
      mongodb.MongoClient.connect('mongodb://localhost/test', function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('templates').remove({_id: userTemplate._id}, function(err) {
          if (err) {
            return done(err);
          }
          db.collection('templates').insert(userTemplate, function(err) {
            if (err) {
              return done(err);
            }
            db.dropCollection('users', function() {db.close(); done();});
          });
        });
      });
    });

    it('should record a user with the template informations', function(done) {
      var userModule = require(BASEPATH + '/backend/core').user;
      userModule.provisionUser({emails: ['test@linagora.com']}, function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user._id).to.exist;
        expect(user.emails).to.exist;
        expect(user.emails).to.be.an.array;
        expect(user.emails).to.have.length(1);
        expect(user.emails[0]).to.equal('test@linagora.com');
        expect(user.firstname).to.equal('John');
        expect(user.lastname).to.equal('Doe');
        done();
      });
    });

    it('should add a schemaVersion to the user object', function(done) {
      var userModule = require(BASEPATH + '/backend/core').user;
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
      var userModule = require(BASEPATH + '/backend/core').user;
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
      var userModule = require(BASEPATH + '/backend/core').user;
      userModule.provisionUser({foo: 'bar'}, function(err, user) {
        expect(err).to.not.be.null;
        expect(err.name).to.exist;
        expect(err.name).to.equal('ValidationError');
        done();
      });

    });

    it('should return an error if some user with the same email is already in the database', function(done) {
      var userModule = require(BASEPATH + '/backend/core').user;
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
      var userModule = require(BASEPATH + '/backend/core').user;
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
      var userModule = require(BASEPATH + '/backend/core').user;
      userModule.provisionUser({emails: []}, function(err, user) {
        expect(err).to.not.be.not.null;
        expect(err.name).to.be.a.string;
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });

    it('should return an error if some email is invalid', function(done) {
      var userModule = require(BASEPATH + '/backend/core').user;
      userModule.provisionUser({emails: ['test1@linagora.com', 'invalid', 'test2@linagora.com']}, function(err, user) {
        expect(err).to.not.be.not.null;
        expect(err.name).to.be.a.string;
        expect(err.name).to.equal('ValidationError');
        done();
      });
    });

    afterEach(function(done) {
      delete process.env.NODE_CONFIG;
      fs.unlinkSync(tmp + '/db.json');
      mongodb.MongoClient.connect('mongodb://localhost/test', function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('templates').remove({_id: 'user'}, function(err) {
          if (err) {
            return done(err);
          }
          db.collection('users').remove(done);
        });
      });
    });
  });

  describe('findByEmail method', function() {
    beforeEach(function(done) {
      var mongo = {hostname: 'localhost', port: 27017, dbname: 'test'};
      process.env.NODE_CONFIG = tmp;
      fs.writeFileSync(tmp + '/db.json', JSON.stringify(mongo));
      var userTemplate = require('../fixtures/user-template').simple();
      mongodb.MongoClient.connect('mongodb://localhost/test', function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('templates').remove({_id: userTemplate._id}, function(err) {
          if (err) {
            return done(err);
          }
          db.collection('templates').insert(userTemplate, function(err) {
            if (err) {
              return done(err);
            }
            db.dropCollection('users', function() {db.close(); done();});
          });
        });
      });
    });

    it('should find a user when we provide an email address', function(done) {
      var user = {
        emails: ['test1@linagora.com', 'test2@linagora.com']
      };

      var finduser = function() {
        var userModule = require(BASEPATH + '/backend/core').user;
        userModule.findByEmail('test2@linagora.com', function(err, user) {
          expect(err).to.be.null;
          expect(user).to.exist;
          expect(user).to.be.an.object;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.include('test2@linagora.com');
          done();
        });
      };

      mongodb.MongoClient.connect('mongodb://localhost/test', function(err, db) {
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
        var userModule = require(BASEPATH + '/backend/core').user;
        userModule.findByEmail(['test2@linagora.com'], function(err, user) {
          expect(err).to.be.null;
          expect(user).to.exist;
          expect(user).to.be.an.object;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.include('test2@linagora.com');
          done();
        });
      };

      mongodb.MongoClient.connect('mongodb://localhost/test', function(err, db) {
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
        var userModule = require(BASEPATH + '/backend/core').user;
        userModule.findByEmail(['test22@linagora.com'], function(err, user) {
          expect(err).to.be.null;
          expect(user).to.be.null;
          done();
        });
      };

      mongodb.MongoClient.connect('mongodb://localhost/test', function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('users').insert(user, finduser);
      });
    });
  });
});
