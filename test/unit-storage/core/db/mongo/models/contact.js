'use strict';

var expect = require('chai').expect;
var mongodb = require('mongodb');

describe('The Contact model', function() {
  var Contact, User, AddressBook, ABName, emails, userEmails, email, email2, email_ci, email2_ci, name;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.helpers.requireBackend('core/db/mongo/models/contact');
    this.helpers.requireBackend('core/db/mongo/models/user');
    this.helpers.requireBackend('core/db/mongo/models/addressbook');

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
    var models = {
      user: null,
      contact: null,
      addressbook: null
    };

    var mongoUrl = this.testEnv.mongoUrl;

    function testSavedAB(savedAB, callback) {
      mongodb.MongoClient.connect(mongoUrl, function(err, db) {
        if (err) { return callback(err); }
        db.collection('addressbooks').findOne({_id: savedAB._id}, function(err, ab) {
          if (err) { return callback(err); }
          expect(ab).to.be.not.null;
          expect(ab.name).to.equal(ABName);
          callback();
        });
      });
    }

    function testSavedUser(savedUser, callback) {
      mongodb.MongoClient.connect(mongoUrl, function(err, db) {
        if (err) { return callback(err); }
        db.collection('users').findOne({_id: savedUser._id}, function(err, user) {
          if (err) { return callback(err); }
          expect(user).to.be.not.null;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.have.length(1);
          expect(user.emails[0]).to.equal(email2);
          callback();
        });
      });
    }

    function testSavedContact(savedContact, savedUser, savedEB, callback) {
      mongodb.MongoClient.connect(mongoUrl, function(err, db) {
        if (err) { return callback(err); }
        db.collection('contacts').findOne({_id: savedContact._id}, function(err, contact) {
          if (err) { return callback(err); }
          expect(contact).to.be.not.null;
          expect(contact.emails).to.be.an.array;
          expect(contact.emails).to.have.length(1);
          expect(contact.emails[0]).to.equal(email);

          expect(contact.owner + '').to.equal(savedUser._id + '');

          expect(contact.given_name).to.equal(name);

          expect(contact.addressbooks).to.be.an.array;
          expect(contact.addressbooks).to.have.length(1);
          expect(contact.addressbooks[0] + '').to.equal(savedEB._id + '');
          db.close(callback);
        });
      });
    }

    function saveAddressbook(ab, callback) {
      ab.save(function(err, savedAB) {
        if (err) { return callback(err); }
        models.addressbook = savedAB;
        testSavedAB(savedAB, function(err) {
          if (err) {
            return callback(err);
          }
          callback();
        });
      });
    }

    function saveContact(contact, callback) {
      contact.save(function(err, savedContact) {
        if (err) { return callback(err); }
        models.contact = savedContact;
        testSavedContact(models.contact, models.user, models.addressbook, callback);
      });
    }

    u.save(function(err, savedUser) {
      if (err) { return done(err); }
      models.user = savedUser;
      testSavedUser(savedUser, function(err) {
        if (err) {
          return done(err);
        }
        ab = new AddressBook({name: ABName, creator: savedUser._id});
        saveAddressbook(ab, function(err) {
          if (err) {
            return done(err);
          }
          var c = new Contact({emails: emails, owner: ab.creator, addressbooks: [models.addressbook._id], given_name: name});
          saveContact(c, done);
        });
      });
    });
  });

  it('should allow recording contacts having the same email addresses', function(done) {
    var abid = this.mongoose.Types.ObjectId();
    var ownerid = this.mongoose.Types.ObjectId();
    var emails = ['email1@linagora.com', 'email2@linagora.com'];

    function fetchBackContacts() {
      Contact.find({emails: 'email1@linagora.com'}, function(err, contacts) {
        if (err) {
          return done(err);
        }
        expect(contacts).to.have.length(2);
        var names = contacts.map(function(c) { return c.given_name; });
        expect(names.indexOf('contact1')).to.be.at.least(0);
        expect(names.indexOf('contact2')).to.be.at.least(0);
        done();
      });
    }

    var c1 = new Contact({emails: emails, owner: ownerid, addressbooks: [abid], given_name: 'contact1'});
    var c2 = new Contact({emails: emails, owner: ownerid, addressbooks: [abid], given_name: 'contact2'});
    c1.save(function(err, saved) {
      if (err) {
        return done(err);
      }
      c2.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        fetchBackContacts();
      });
    });
  });

  afterEach(function(done) {
    emails = [];
    userEmails = [];

    var async = require('async');
    async.parallel([
      function(cb) {
        User.remove(cb);
      },
      function(cb) {
        Contact.remove(cb);
      }
    ], function() {
      this.mongoose.disconnect(done);
    }.bind(this));
  });

});
