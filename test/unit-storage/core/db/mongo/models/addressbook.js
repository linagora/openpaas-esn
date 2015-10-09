'use strict';

var expect = require('chai').expect;
var mongodb = require('mongodb');

describe('The AddressBook model', function() {
  var AddressBook, ABName, User, userFixtures;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.helpers.requireBackend('core/db/mongo/models/addressbook');
    this.helpers.requireBackend('core/db/mongo/models/user');
    AddressBook = this.mongoose.model('AddressBook');
    User = this.mongoose.model('User');
    userFixtures = this.helpers.requireFixture('models/users.js')(User);
    ABName = 'Professional';

    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  it('should save an addressbook', function(done) {
    var mongoUrl = this.testEnv.mongoUrl;
    function testSavedAB(savedAB) {
      mongodb.MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
          return done(err);
        }
        db.collection('addressbooks').findOne({_id: savedAB._id}, function(err, ab) {
          if (err) {
            return done(err);
          }
          expect(ab).to.be.not.null;
          expect(ab.name).to.equal(ABName);
          db.close(done);
        });
      });
    }

    userFixtures.newDummyUser(['foo@bar.net']).save(function(err, savedUser) {
      if (err) {
        return done(err);
      }
      var ab = new AddressBook({name: ABName, creator: savedUser._id});

      ab.save(function(err, savedAB) {
        if (err) { return done(err); }
        testSavedAB(savedAB);
      });
    });
  });

  afterEach(function(done) {
    var callback = function(item, fn) {
      item.remove(fn);
    };

    var async = require('async');
    async.parallel([
      function(cb) {
        AddressBook.find().exec(function(err, ab) {
          async.forEach(ab, callback, cb);
        });
      }
    ], function() {
      this.mongoose.disconnect(done);
    }.bind(this));
  });
});
