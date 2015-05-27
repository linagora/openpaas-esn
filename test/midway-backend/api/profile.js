'use strict';

var request = require('supertest'),
  async = require('async'),
  expect = require('chai').expect;

describe('The profile API', function() {
  var app;
  var User;
  var foouser, baruser;
  var password = 'secret';
  var imagePath;

  beforeEach(function(done) {
    var self = this;
    imagePath = this.helpers.getFixturePath('image.png');

    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');
      self.mongoose = require('mongoose');
      User = self.helpers.requireBackend('core/db/mongo/models/user');

      foouser = new User({
        firstname: 'John',
        username: 'Foo',
        password: password,
        emails: ['foo@bar.com']
      });

      baruser = new User({
        username: 'Bar',
        password: password,
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

      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          saveUser(baruser, callback);
        }
      ],
      function(err) {
        done(err);
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });


  describe('GET /api/users/:userId/profile route', function() {

    it('should return 401 if not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/users/' + baruser._id + '/profile', done);
    });

    it('should create a profile link when authenticated user looks at a user profile', function(done) {
      var Link = this.mongoose.model('Link');
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/' + baruser._id + '/profile'));
        req.expect(200)
          .end(function(err) {
            expect(err).to.not.exist;
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
          });
      });
    });

    it('should return 404 if the user does not exist', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/notauserid/profile'));
        req.expect(404).end(self.helpers.callbacks.error(done));
      });
    });

    it('should return 200 with the profile of the user', function(done) {
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/' + baruser._id + '/profile'));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(baruser._id.toString()).to.equal(res.body._id);
          done();
        });
      });
    });

  });

  describe('PUT /api/users/profile/:parameter route', function() {

    it('should return 401 if not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'put', '/api/user/profile/firstname', done);
    });

    it('should return 400 if the request body is not well formed', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).put('/api/user/profile/firstname'));
        req.send({pipo: 'oho'}).expect(400).end(self.helpers.callbacks.error(done));
      });
    });

    it('should return 400 if the parameter does not exist', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).put('/api/user/profile/notarealparameter'));
        req.send({value: 'firstname'}).expect(400).end(self.helpers.callbacks.noError(done));
      });
    });

    it('should return 200 and update his profile', function(done) {
      var User = this.mongoose.model('User');
      var firstname = 'foobarbaz';

      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).put('/api/user/profile/firstname'));
        req.send({value: firstname}).expect(200).end(function(err) {
          expect(err).to.not.exist;
          User.findOne({_id: foouser._id}, function(err, user) {
            if (err) {
              return done(err);
            }
            expect(user.firstname).to.equal(firstname);
            done();
          });
        });
      });
    });

    it('should return 200 and erase property if the request has no body', function(done) {
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).put('/api/user/profile/firstname'));
        req.send().expect(200).end(function(err) {
          expect(err).to.not.exist;
          User.findOne({_id: foouser._id}, function(err, user) {
            if (err) {
              return done(err);
            }
            expect(user.firstname).to.equal('');
            done();
          });
        });
      });
    });

  });

  describe('GET /api/users/:userId route', function() {

    it('should return 401 if not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/users/' + baruser._id, done);
    });

    it('should return 404 if the user does not exist', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/notauserid'));
        req.expect(404).end(self.helpers.callbacks.error(done));
      });
    });

    it('should return 200 with the profile of the user', function(done) {
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/' + baruser._id));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(baruser._id.toString()).to.equal(res.body._id);
          done();
        });
      });
    });

  });

  describe('GET /api/users/:uuid/profile/avatar route', function() {

    it('should return 404 if the user does not exist', function(done) {
      var self = this;
      var req = request(app).get('/api/users/notauserid/profile/avatar');
      req.expect(404).end(self.helpers.callbacks.noError(done));
    });

    it('should redirect to the default avatar image if the user has no image', function(done) {
      var req = request(app).get('/api/users/' + foouser._id + '/profile/avatar');
      req.expect(302).end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.headers.location).to.equal('/images/user.png');
        done();
      });
    });

    it('should return 200 with the stream of the user avatar', function(done) {
      var imageModule = this.helpers.requireBackend('core/image');
      var readable = require('fs').createReadStream(imagePath);

      var avatarId = new require('mongoose').Types.ObjectId();
      var opts = {
        creator: {objectType: 'user', id: foouser._id}
      };
      imageModule.recordAvatar(avatarId, 'image/png', opts, readable, function(err) {
        if (err) {
          return done(err);
        }
        foouser.avatars = [avatarId];
        foouser.currentAvatar = avatarId;
        foouser.save(function(err) {
          if (err) {
            return done(err);
          }
          var req = request(app).get('/api/users/' + foouser._id + '/profile/avatar');
          req.expect(200).end(function(err, res) {
            expect(err).to.not.exist;
            expect(res).to.exist;
            done();
          });
        });
      });
    });
  });

  describe('POST /api/user/profile/avatar route', function() {

    it('should return 401 if not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'post', '/api/user/profile/avatar', done);
    });

    it('should return 400 if the "mimetype" query string is missing', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).post('/api/user/profile/avatar?size=123'));
        req.send().expect(400).end(self.helpers.callbacks.noError(done));
      });
    });

    it('should return 400 if the "size" query string is missing', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).post('/api/user/profile/avatar?mimetype=image%2Fpng'));
        req.send().expect(400).end(self.helpers.callbacks.noError(done));
      });
    });

    it('should return 400 if the "mimetype" query string is not an accepted mime type', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).post('/api/user/profile/avatar?mimetype=notAGoodType&size=123'));
        req.send().expect(400).end(self.helpers.callbacks.noError(done));
      });
    });

    it('should return 400 if the "size" query string is not a number', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).post('/api/user/profile/avatar?mimetype=image%2Fpng&size=notanumber'));
        req.send().expect(400).end(self.helpers.callbacks.noError(done));
      });
    });

    it('should return 412 if the "size" query string is not equal to the actual image size', function(done) {
      var fileContent = require('fs').readFileSync(imagePath).toString();
      var self = this;
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).post('/api/user/profile/avatar'));
        req.query({ 'size': 123, 'mimetype': 'image/png'})
          .set('Content-Type', 'image/png')
          .send(fileContent).expect(412).end(self.helpers.callbacks.error(done));
      });
    });

  });

  describe('GET /api/user/profile/avatar route', function() {

    it('should return 401 if not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/user/profile/avatar', done);
    });

    it('should redirect to the default avatar image if the user has no image', function(done) {
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/user/profile/avatar'));
        req.expect(302).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.headers.location).to.equal('/images/user.png');
          done();
        });
      });
    });

    it('should return 200 with the stream of the user avatar', function(done) {
      var imageModule = this.helpers.requireBackend('core/image');
      var readable = require('fs').createReadStream(imagePath);

      var avatarId = new require('mongoose').Types.ObjectId();
      var opts = {
        creator: {objectType: 'user', id: foouser._id}
      };
      var self = this;
      imageModule.recordAvatar(avatarId, 'image/png', opts, readable, function(err) {
        if (err) {
          done(err);
        }
        foouser.avatars = [avatarId];
        foouser.currentAvatar = avatarId;
        foouser.save(function(err) {
          if (err) {
            done(err);
          }
          self.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              done(err);
            }
            var req = loggedInAsUser(request(app).get('/api/user/profile/avatar'));
            req.expect(200).end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.text).to.exist;
              done();
            });
          });
        });
      });
    });

  });

});

