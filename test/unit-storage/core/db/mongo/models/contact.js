'use strict';

var expect = require('chai').expect;

describe('The Contact model', function() {
  var Contact, User, AddressBook, ABName, emails, userEmails, email, email2, email_ci, email2_ci, name, fixtures, helpers;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');

    helpers = this.helpers;
    helpers.requireBackend('core/db/mongo/models/contact');
    helpers.requireBackend('core/db/mongo/models/user');
    helpers.requireBackend('core/db/mongo/models/addressbook');

    Contact = this.mongoose.model('Contact');
    User = this.mongoose.model('User');
    AddressBook = this.mongoose.model('AddressBook');
    fixtures = this.helpers.requireFixture('models/users.js')(User);

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
    fixtures.newDummyUser().save(helpers.callbacks.noErrorAnd(function(user) {
      new AddressBook({ name: ABName, creator: user._id }).save(helpers.callbacks.noErrorAnd(function(book) {
        new Contact({ emails: [email_ci], owner: user._id, addressbooks: [book._id], given_name: name }).save(helpers.callbacks.noErrorAnd(function(c) {
          Contact.findOne({ _id: c._id }, helpers.callbacks.noErrorAnd(function(contact) {
            expect(contact).to.shallowDeepEqual({
              emails: [email],
              owner: user._id,
              addressbooks: [book._id],
              given_name: name
            });

            done();
          }));
        }));
      }));
    }));
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
