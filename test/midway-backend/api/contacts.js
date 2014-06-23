'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The contacts controller', function() {

  var Contact, User, AddressBook, Invitation;
  var webserver;

  var email = 'foo@bar.com';
  var password = 'secret';
  var contact, ab;

  before(function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/contact');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/addressbook');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    var self = this;
    this.testEnv.initCore(function() {
      webserver = require(self.testEnv.basePath + '/backend/webserver');

      User = self.mongoose.model('User');
      Contact = self.mongoose.model('Contact');
      AddressBook = self.mongoose.model('AddressBook');
      Invitation = self.mongoose.model('Invitation');

      var user = new User({
        username: 'Foo',
        password: password,
        emails: [email]
      });

      user.save(function(err, u) {
        if (err) { done(err); }
        self.testUser = u;
        self.userId = u._id + '';
        ab = new AddressBook({name: 'Professional', creator: u._id });

        ab.save(function(err, a) {
          if (err) { done(err); }

          contact = new Contact({emails: [email], given_name: 'Coco', addressbooks: [a._id], owner: u._id});
          contact.save(function(err, c) {
            if (err) { done(err); }
            done();
          });
        });
      });
    });
  });

  afterEach(function(done) {
    var self = this;
    self.mongoose.connection.db.dropDatabase(function() {
      self.mongoose.disconnect(done);
    });
  });

  describe('GET /api/contacts', function(done) {

    it('should return a 200 with contacts belonging to the user', function(done) {
      var self = this;
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/contacts').query({owner: self.userId});
          req.cookies = cookies;
          req.expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.headers['x-esn-items-count']).to.equal('1');
            expect(res.body[0].emails[0]).to.equal(email);
            done();
          });
        });
    });

    it('should return a 200 result with contacts of the user addressbook', function(done) {
      var self = this;
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/contacts').query({owner: self.userId, addressbooks: ab._id + ''});
          req.cookies = cookies;
          req.expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.headers['x-esn-items-count']).to.equal('1');
            expect(res.body[0].emails[0]).to.equal(email);
            done();
          });
        });
    });

    it('should return a 200 result with contacts matching search query', function(done) {
      var self = this;
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/contacts').query({owner: self.userId, search: 'Toto'});
          req.cookies = cookies;
          req.expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.headers['x-esn-items-count']).to.equal('0');
            expect(res.body).to.deep.equal([]);
            done();
          });
        });
    });

    it('should return a 200 result with the last 2 contacts of the addressbook', function(done) {
      var self = this;
      var saveContact = function(contact, cb) {
        contact.save(function(err, saved) {
          return cb(err, saved);
        });
      };

      var user = new User({
        username: 'OffsetMan',
        password: password,
        emails: ['offsetman@limit.com']
      });

      user.save(function(err, u) {
        if (err) {
          done(err);
        }

        self.userId = u._id + '';

        var book = new AddressBook({
          name: 'Perso',
          creator: u._id
        });

        book.save(function(err, a) {
          if (err) {
            done(err);
          }

          var foouser = new Contact({emails: ['foouser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Foo'});
          var baruser = new Contact({emails: ['baruser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Bar'});
          var bazuser = new Contact({emails: ['bazuser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Baz'});
          var quxuser = new Contact({emails: ['quxuser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Quxu'});

          var async = require('async');
          async.series([
              function(callback) {
                saveContact(foouser, callback);
              },
              function(callback) {
                saveContact(baruser, callback);
              },
              function(callback) {
                saveContact(bazuser, callback);
              },
              function(callback) {
                saveContact(quxuser, callback);
              }
            ],
            function(err) {
              if (err) {
                return done(err);
              }
              request(webserver.application)
                .post('/api/login')
                .send({username: user.emails[0], password: password, rememberme: false})
                .expect(200)
                .end(function(err, res) {
                  var cookies = res.headers['set-cookie'].pop().split(';')[0];
                  var req = request(webserver.application).get('/api/contacts').query({owner: self.userId, addressbooks: book._id + '', offset: 2});
                  req.cookies = cookies;
                  req.expect(200).end(function(err, res) {
                    expect(err).to.be.null;
                    expect(res.headers['x-esn-items-count']).to.equal('4');
                    expect(res.body.length).to.equal(2);
                    expect(res.body[0].emails[0]).to.equal('foouser@toto.com');
                    expect(res.body[1].emails[0]).to.equal('quxuser@toto.com');
                    done();
                  });
                });
            });
        });
      });
    });

    it('should return a 200 result with the 3 contacts of the addressbook', function(done) {
      var self = this;
      var saveContact = function(contact, cb) {
        contact.save(function(err, saved) {
          return cb(err, saved);
        });
      };

      var user = new User({
        username: 'OffsetMan',
        password: password,
        emails: ['offsetman@limit.com']
      });

      user.save(function(err, u) {
        if (err) {
          done(err);
        }
        self.userId = u._id + '';
        var book = new AddressBook({
          name: 'Perso',
          creator: u._id
        });

        book.save(function(err, a) {
          if (err) {
            done(err);
          }

          var foouser = new Contact({emails: ['foouser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Foo'});
          var baruser = new Contact({emails: ['baruser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Bar'});
          var bazuser = new Contact({emails: ['bazuser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Baz'});
          var quxuser = new Contact({emails: ['quxuser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Quxu'});

          var async = require('async');
          async.series([
              function(callback) {
                saveContact(foouser, callback);
              },
              function(callback) {
                saveContact(baruser, callback);
              },
              function(callback) {
                saveContact(bazuser, callback);
              },
              function(callback) {
                saveContact(quxuser, callback);
              }
            ],
            function(err) {
              if (err) {
                return done(err);
              }
              request(webserver.application)
                .post('/api/login')
                .send({username: user.emails[0], password: password, rememberme: false})
                .expect(200)
                .end(function(err, res) {
                  var cookies = res.headers['set-cookie'].pop().split(';')[0];
                  var req = request(webserver.application).get('/api/contacts').query({owner: self.userId, addressbooks: book._id + '', offset: 2, limit: 1});
                  req.cookies = cookies;
                  req.expect(200).end(function(err, res) {
                    expect(err).to.be.null;
                    expect(res.headers['x-esn-items-count']).to.equal('4');
                    expect(res.body).to.have.length(1);
                    expect(res.body[0].emails[0]).to.equal('foouser@toto.com');
                    done();
                  });
                });
            });
        });
      });
    });

    it('should return a 200 result with the first 2 contacts of the addressbook', function(done) {
      var self = this;
      var saveContact = function(contact, cb) {
        contact.save(function(err, saved) {
          return cb(err, saved);
        });
      };

      var user = new User({
        username: 'username',
        password: password,
        emails: ['username@domain.com']
      });

      user.save(function(err, u) {
        if (err) {
          done(err);
        }
        self.userId = u._id + '';
        var book = new AddressBook({
          name: 'Perso',
          creator: u._id
        });

        book.save(function(err, a) {
          if (err) {
            done(err);
          }

          var foouser = new Contact({emails: ['foouser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Foo'});
          var baruser = new Contact({emails: ['baruser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Bar'});
          var bazuser = new Contact({emails: ['bazuser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Baz'});
          var quxuser = new Contact({emails: ['quxuser@toto.com'], addressbooks: [a._id], owner: u._id, given_name: 'Quxu'});

          var async = require('async');
          async.series([
            function(callback) {
              saveContact(foouser, callback);
            },
            function(callback) {
              saveContact(baruser, callback);
            },
            function(callback) {
              saveContact(bazuser, callback);
            },
            function(callback) {
              saveContact(quxuser, callback);
            }
          ],
            function(err) {
              if (err) {
                return done(err);
              }
              request(webserver.application)
                .post('/api/login')
                .send({username: user.emails[0], password: password, rememberme: false})
                .expect(200)
                .end(function(err, res) {
                  var cookies = res.headers['set-cookie'].pop().split(';')[0];
                  var req = request(webserver.application).get('/api/contacts').query({owner: self.userId, addressbooks: book._id + '', limit: 2});
                  req.cookies = cookies;
                  req.expect(200).end(function(err, res) {
                    expect(err).to.be.null;
                    expect(res.headers['x-esn-items-count']).to.equal('4');
                    expect(res.body).to.have.length(2);
                    expect(res.body[0].emails[0]).to.equal('baruser@toto.com');
                    expect(res.body[1].emails[0]).to.equal('bazuser@toto.com');
                    done();
                  });
                });
            });
        });
      });
    });



    it('should return a 400 result if addressbook parameters is not an ObjectId as a String', function(done) {
      var self = this;
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/contacts').query({owner: self.userId, addressbooks: 'pipoId'});
          req.cookies = cookies;
          req.expect(400).end(function(err, res) {
            done();
          });
        });
    });

    it('should return a 400 result if addressbook parameters is not an array of ObjectId as a String', function(done) {
      var self = this;
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/contacts').query({owner: self.userId, addressbooks: ['537f4f15214b6fbfb046f9c3', 'pipoId']});
          req.cookies = cookies;
          req.expect(400).end(function(err, res) {
            done();
          });
        });
    });

    it('should return 200 result with a contact belonging to all addressbooks in the parameters', function(done) {
      var self = this;
      var saveContact = function(contact, cb) {
        contact.save(function(err, saved) {
          return cb(err, saved);
        });
      };

      var user = new User({
        username: 'OffsetMan',
        password: password,
        emails: ['offsetman@limit.com']
      });

      user.save(function(err, u) {
        if (err) {
          done(err);
        }

        self.userId = u._id + '';

        var book1 = new AddressBook({
          name: 'book1',
          creator: u._id
        });

        book1.save(function(err, ab1) {
          if (err) {
            done(err);
          }

          var book2 = new AddressBook({
            name: 'book2',
            creator: u._id
          });

          book2.save(function(err, ab2) {
            if (err) {
              done(err);
            }

            var user1 = new Contact({emails: ['foouser@toto.com'], addressbooks: [ab1._id], owner: u._id, given_name: 'Foo'});
            var user2 = new Contact({emails: ['baruser@toto.com'], addressbooks: [ab2._id], owner: u._id, given_name: 'Bar'});
            var user12 = new Contact({emails: ['bazuser@toto.com'], addressbooks: [ab1._id, ab2._id], owner: u._id, given_name: 'Baz'});
            var users = [user1, user2, user12];

            var async = require('async');
            async.each(users, saveContact,
              function(err) {
                if (err) {
                  return done(err);
                }
                request(webserver.application)
                  .post('/api/login')
                  .send({username: user.emails[0], password: password, rememberme: false})
                  .expect(200)
                  .end(function(err, res) {
                    var cookies = res.headers['set-cookie'].pop().split(';')[0];
                    var req = request(webserver.application).get('/api/contacts').query({owner: self.userId, addressbooks: [ab2._id + '', ab1._id + '']});
                    req.cookies = cookies;
                    req.expect(200).end(function(err, res) {
                      expect(err).to.be.null;
                      expect(res.headers['x-esn-items-count']).to.equal('3');
                      expect(res.body).to.have.length(3);
                      done();
                    });
                  });
              });
          });
        });
      });
    });

  });

  describe('POST /api/contacts/:id/invitations', function() {

    it('should send HTTP 404 if contact is not found', function(done) {
      var foouser = new Contact({emails: ['foouser@toto.com'], addressbooks: [ab._id], owner: this.userId, given_name: 'Foo'});
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).post('/api/contacts/' + foouser._id + '/invitations');
          req.cookies = cookies;
          req.expect(404).end(done);
        });
    });

    it('should create an invitation and send back HTTP 202', function(done) {
      var foouser = new Contact({emails: ['foouser@toto.com'], addressbooks: [ab._id], owner: this.userId, given_name: 'Foo'});
      foouser.save(function(err, _foouser) {

        var body = {
          domain: 'domain'
        };

        request(webserver.application)
          .post('/api/login')
          .send({username: email, password: password, rememberme: false})
          .expect(200)
          .end(function (err, res) {
            var cookies = res.headers['set-cookie'].pop().split(';')[0];
            var req = request(webserver.application).post('/api/contacts/' + _foouser._id + '/invitations');
            req.cookies = cookies;
            req.send(body);
            req.expect(202).end(done);
          });
      });
    });
  });

  describe('GET /api/contacts/:id/invitations', function() {

    it('should return 404 if contact is not found', function(done) {
      var foouser = new Contact({emails: ['foouser@toto.com'], addressbooks: [ab._id], owner: this.userId, given_name: 'Foo'});
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/contacts/' + foouser._id + '/invitations');
          req.cookies = cookies;
          req.expect(404).end(done);
        });
    });

    it('should return 200 with empty array if contact does not have any invitation', function(done) {
      var foouser = new Contact({emails: ['foouser@toto.com'], addressbooks: [ab._id], owner: this.userId, given_name: 'Foo'});
      foouser.save(function(err, saved) {
        request(webserver.application)
          .post('/api/login')
          .send({username: email, password: password, rememberme: false})
          .expect(200)
          .end(function (err, res) {
            var cookies = res.headers['set-cookie'].pop().split(';')[0];
            var req = request(webserver.application).get('/api/contacts/' + foouser._id + '/invitations');
            req.cookies = cookies;
            req.expect(200).end(function (err, res) {
              expect(err).to.be.null;
              expect(res.body).to.be.an.array;
              expect(res.body).to.be.an.empty.array;
              done();
            });
          });
      });
    });

    it('should return 200 with all the contact invitations', function(done) {
      var foouser = new Contact({emails: ['foouser@toto.com'], addressbooks: [ab._id], owner: this.userId, given_name: 'Foo'});

      var self = this;
      foouser.save(function(err, _foosuer) {
        if (err) {
          return done(err);
        }

        var invitation = new Invitation(
          {
            type: 'addmember',
            data: {
              user: self.testUser,
              email: email,
              contact_id: _foosuer._id.toString()
            }
          });

        invitation.save(function(err, _invitation) {

          if (err) {
            return done(err);
          }

          request(webserver.application)
            .post('/api/login')
            .send({username: email, password: password, rememberme: false})
            .expect(200)
            .end(function (err, res) {
              var cookies = res.headers['set-cookie'].pop().split(';')[0];
              var req = request(webserver.application).get('/api/contacts/' + _foosuer._id + '/invitations');
              req.cookies = cookies;
              req.expect(200).end(function (err, res) {
                expect(err).to.be.null;
                expect(res.body).to.be.an.array;
                expect(res.body.length).to.equal(1);
                done();
              });
            });
        });
      });
    });
  });

  describe('GET /api/contacts/invitations', function() {

    it('should return HTTP 400 if query is not set', function(done) {

      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function (err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/contacts/invitations');
          req.cookies = cookies;
          req.expect(400).end(done);
        });
    });

    it('should return HTTP 200 with the requested invitations', function(done) {

      var invitations = [];
      var self = this;
      var saveContact = function(contact, callback) {
        contact.save(function(err, _saved) {
          var invitation = new Invitation({type: 'addmember', data: {user: self.testUser, email: email, contact_id: _saved._id.toString()}});
          invitation.save(function(err, _invitation) {
            invitations.push(_invitation);
            return callback(err, _saved);
          });
        });
      };

      var user1 = new Contact({emails: ['foouser@toto.com'], addressbooks: [ab._id], owner: self.testUser._id, given_name: 'Foo'});
      var user2 = new Contact({emails: ['baruser@toto.com'], addressbooks: [ab._id], owner: self.testUser._id, given_name: 'Bar'});
      var user12 = new Contact({emails: ['bazuser@toto.com'], addressbooks: [ab._id], owner: self.testUser._id, given_name: 'Baz'});
      var users = [user1, user2, user12];

      var async = require('async');
      async.each(users, saveContact,
        function(err) {
          if (err) {
            return done(err);
          }

          request(webserver.application)
            .post('/api/login')
            .send({username: email, password: password, rememberme: false})
            .expect(200)
            .end(function (err, res) {
              var cookies = res.headers['set-cookie'].pop().split(';')[0];
              var req = request(webserver.application).get('/api/contacts/invitations').query({'ids[]': [users[0]._id.toString(), users[1]._id.toString()]});
              req.cookies = cookies;
              req.expect(200).end(function (err, res) {
                expect(err).to.be.null;
                expect(res.body).to.be.an.array;
                expect(res.body.length).to.equal(2);
                done();
              });
            });
        });
      });
  });
});
