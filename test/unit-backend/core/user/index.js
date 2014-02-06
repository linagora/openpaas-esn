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
      mongodb.MongoClient.connect('mongodb://localhost/test', function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('templates').insert(require('../fixtures/user-template').simple(), function() {
          if (err) {
            return done(err);
          }
          db.collection('users').remove(done);
        });
      });
    });

    it('should record a user with the template informations', function(done) {
      var userModule = require(BASEPATH + '/backend/core').user;
      userModule.provisionUser({email: 'test@linagora.com'}, function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user._id).to.exist;
        expect(user.email).to.exist;
        expect(user.email).to.equal('test@linagora.com');
        expect(user.firstname).to.equal('John');
        expect(user.lastname).to.equal('Doe');
        done();
      });
    });

    it('should add a schemaVersion to the user object', function(done) {
      var userModule = require(BASEPATH + '/backend/core').user;
      userModule.provisionUser({email: 'test@linagora.com'}, function(err, user) {
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
      userModule.provisionUser({email: 'test@linagora.com'}, function(err, user) {
        expect(err).to.be.null;
        expect(user).to.exist;
        expect(user.timestamps).to.exist;
        expect(user.timestamps.creation).to.exist;
        expect(user.timestamps.creation).to.be.a.Date;
        done();
      });
    });


    it('should return an error if the user does not have an email property', function(done) {
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
      userModule.provisionUser({email: 'test@linagora.com'}, function(err, user) {
        expect(err).to.be.null;
        userModule.provisionUser({email: 'test@linagora.com'}, function(err, user) {
          expect(err).to.not.be.null;
          expect(err.name).to.be.a.string;
          expect(err.name).to.equal('MongoError');
          expect(err.code).to.equal(11000);
          done();
        });
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
});
