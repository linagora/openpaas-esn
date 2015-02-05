'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The addressbooks controller', function() {

  var User, AddressBook;
  var webserver = null;
  var email = 'foo@bar.com';
  var password = 'secret';

  before(function() {
    this.helpers.requireBackend('core/db/mongo/models/contact');
    this.helpers.requireBackend('core/db/mongo/models/user');
    this.helpers.requireBackend('core/db/mongo/models/addressbook');
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    var self = this;
    this.testEnv.initCore(function() {
      webserver = self.helpers.requireBackend('webserver').webserver;

      User = self.mongoose.model('User');
      AddressBook = self.mongoose.model('AddressBook');

      var user = new User({
        username: 'Foo',
        password: password,
        emails: [email]
      });

      user.save(function(err, u) {
        if (err) {
          done(err);
        }

        self.userId = u._id;

        var ab = new AddressBook({
          name: 'Professional',
          creator: u._id
        });

        ab.save(function(err, a) {
          if (err) {
            done(err);
          }
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('GET /api/addressbooks', function(done) {

    it('should return a 200 with addressbooks list', function(done) {
      var userId = this.userId;
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/addressbooks').query({creator: userId + ''});
          req.cookies = cookies;
          req.expect(200).end(function(err, res) {
            expect(res.body.length).to.equal(1);
            expect(res.body[0].name).to.equal('Professional');
            expect(err).to.be.null;
            done();
          });
        });
    });

  });
});
