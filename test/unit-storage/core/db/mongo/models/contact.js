'use strict';

var expect = require('chai').expect;
var mongodb = require('mongodb');

describe('The Contact model', function() {
  var Contact, User, AddressBook, ABName, emails, userEmails, email, email2, email_ci, email2_ci, name;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/contact');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/addressbook');

    Contact = this.mongoose.model('Contact');
    User = this.mongoose.model('User');
    AddressBook = this.mongoose.model('AddressBook');

    ABName = 'Professional';
    emails = [];
    userEmails = [];
    email = 'foo@linagora.com';
    email_ci = 'FOO@LiNaGoRa.com ';
    email2 = 'bar@linagora.com';
    email2_ci = '   bAR@linagora.com';
    name = 'pipoName';

    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  it('should save an user contact into an addressbook', function(done) {
    emails.push(email_ci);
    userEmails.push(email2_ci);

    var u = new User({ firstname: 'foo', lastname: 'bar', emails: userEmails});
    var ab;

    var mongoUrl = this.testEnv.mongoUrl;

    function testSavedAB(savedAB) {
      mongodb.MongoClient.connect(mongoUrl, function(err, db) {
        if (err) { return done(err); }
        db.collection('addressbooks').findOne({_id: savedAB._id}, function(err, ab) {
          if (err) { return done(err); }
          expect(ab).to.be.not.null;
          expect(ab.name).to.equal(ABName);
        });
      });
    }

    function testSavedUser(savedContact) {
      mongodb.MongoClient.connect(mongoUrl, function(err, db) {
        if (err) { return done(err); }
        db.collection('users').findOne({_id: savedContact._id}, function(err, user) {
          if (err) { return done(err); }
          expect(user).to.be.not.null;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.have.length(1);
          expect(user.emails[0]).to.equal(email2);
        });
      });
    }

    function testSavedContact(savedContact, savedUser, savedEB) {
      mongodb.MongoClient.connect(mongoUrl, function(err, db) {
        if (err) { return done(err); }
        db.collection('contacts').findOne({_id: savedContact._id}, function(err, contact) {
          if (err) { return done(err); }
          expect(contact).to.be.not.null;
          expect(contact.emails).to.be.an.array;
          expect(contact.emails).to.have.length(1);
          expect(contact.emails[0]).to.equal(email);

          expect(contact.owner + '').to.equal(savedUser._id + '');

          expect(contact.given_name).to.equal(name);

          expect(contact.addressbooks).to.be.an.array;
          expect(contact.addressbooks).to.have.length(1);
          expect(contact.addressbooks[0] + '').to.equal(savedEB._id + '');
          db.close(done);
        });
      });
    }

    u.save(function(err, savedUser) {
      if (err) { return done(err); }

      testSavedUser(savedUser);
      ab = new AddressBook({name: ABName, creator: savedUser._id});
      ab.save(function(err, savedAB) {
        if (err) { return done(err); }

        testSavedAB(savedAB);

        var abs = [];
        abs.push(savedAB._id);

        var c = new Contact({emails: emails, owner: savedUser._id, addressbooks: abs, given_name: name});

        c.save(function(err, savedContact) {
          if (err) { return done(err); }
          testSavedContact(savedContact, savedUser, savedAB);
        });

      });
    });
  });

  afterEach(function(done) {
    emails = [];
    userEmails = [];

    var callback = function(item, fn) {
      item.remove(fn);
    };

    var async = require('async');
    async.parallel([
      function(cb) {
        User.find().exec(function(err, users) {
          async.forEach(users, callback, cb);
        });
      }
    ], function() {
      this.mongoose.disconnect(done);
    }.bind(this));
  });

});
