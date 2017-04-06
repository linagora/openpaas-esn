'use strict';

var request = require('supertest'),
    expect = require('chai').expect;

describe('The profile API', function() {
  var app, foouser, baruser, baruserExpectedKeys, baruserForbiddenKeys, WCUtils, checkKeys, imagePath, domain_id, mongoose;
  var password = 'secret';

  beforeEach(function(done) {
    var self = this;

    imagePath = this.helpers.getFixturePath('image.png');

    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');
      mongoose = require('mongoose');

      WCUtils = self.helpers.rewireBackend('webserver/controllers/utils');

      self.helpers.api.applyDomainDeployment('foo_and_bar_users', function(err, models) {
        if (err) {
          return done(err);
        }

        domain_id = models.domain._id;
        foouser = models.users[0];
        baruser = models.users[1];
        baruserExpectedKeys = [];
        WCUtils.__get__('publicKeys').forEach(function(key) {
          if (baruser[key]) {
            baruserExpectedKeys.push(key);
          }
        });
        baruserForbiddenKeys = [];
        WCUtils.__get__('privateKeys').forEach(function(key) {
          if (baruser[key]) {
            baruserForbiddenKeys.push(key);
          }
        });

        done();
      });
    });

    checkKeys = function(userToCheck, expectedKeys, forbiddenKeys) {
      if (forbiddenKeys) {
        forbiddenKeys.forEach(function(key) {
          expect(userToCheck[key]).not.to.exist;
        });
      }
      if (expectedKeys) {
        expectedKeys.forEach(function(key) {
          expect(userToCheck[key]).to.exist;
        });
      }
    };

  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/users/:userId/profile route', function() {

    it('should return 401 if not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/users/' + baruser._id + '/profile', done);
    });

    it('should create a profile link when authenticated user looks at a user profile', function(done) {
      var Link = mongoose.model('ResourceLink');
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/' + baruser._id + '/profile'));
        req.expect(200)
          .end(function(err) {
            expect(err).to.not.exist;
            Link.find({}, function(err, links) {
              expect(err).to.not.exist;
              expect(links).to.shallowDeepEqual([
                {
                  type: 'profile',
                  source: {
                    id: String(foouser._id),
                    objectType: 'user'
                  },
                  target: {
                    id: String(baruser._id),
                    objectType: 'user'
                  }
                }
              ]);
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
        var req = loggedInAsUser(request(app).get('/api/users/577cfa973dfc55eb231bba37/profile'));
        req.expect(404).end(self.helpers.callbacks.noError(done));
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

    it('should return 200 with the profile of the user including its private informations if the user is the client himself', function(done) {

      this.helpers.api.loginAsUser(app, baruser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/' + baruser._id + '/profile'));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;

          checkKeys(res.body, baruserExpectedKeys.concat(baruserForbiddenKeys), null);

          done();
        });
      });
    });

    it('should return 200 with the profile of the user except its private informations if the user is NOT the client himself', function(done) {

      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/' + baruser._id + '/profile'));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;

          checkKeys(res.body, baruserExpectedKeys, baruserForbiddenKeys);

          done();
        });
      });
    });

  });

  describe('PUT /api/user/profile', function() {

    it('should return 401 if not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'put', '/api/user/profile', done);
    });

    it('should return 200 and update his profile', function(done) {
      var User = mongoose.model('User');
      var profile = {
        firstname: 'James',
        lastname: 'Amaly',
        job_title: 'Engineer',
        service: 'IT',
        building_location: 'Tunis',
        office_location: 'France',
        main_phone: '123456789',
        description: 'This is my description'
      };

      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).put('/api/user/profile'));

        req.send(profile).expect(200).end(function(err) {
          expect(err).to.not.exist;

          User.findOne({ _id: foouser._id }, function(err, user) {
            if (err) {
              return done(err);
            }
            expect({
              firstname: user.firstname,
              lastname: user.lastname,
              job_title: user.job_title,
              service: user.service,
              building_location: user.building_location,
              office_location: user.office_location,
              main_phone: user.main_phone,
              description: user.description
            })
            .to.deep.equal(profile);
            done();
          });
        });
      });
    });

    it('should not return an error even if some of sent profile attributes are undefined', function(done) {
      var User = mongoose.model('User');
      var profile = {
        firstname: 'John'
      };

      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var req = loggedInAsUser(request(app).put('/api/user/profile'));

        req.send(profile).expect(200).end(function(err) {
          expect(err).to.not.exist;

          User.findOne({ _id: foouser._id }, function(err, user) {
            if (err) {
              return done(err);
            }

            expect(user.firstname).to.equal('John');
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
        var req = loggedInAsUser(request(app).get('/api/users/577cfa973dfc55eb231bba37'));
        req.expect(404).end(self.helpers.callbacks.noError(done));
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

    it('should return 200 with the profile of the user including its private informations if the user is the client himself', function(done) {

      this.helpers.api.loginAsUser(app, baruser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/' + baruser._id));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;

          checkKeys(res.body, baruserExpectedKeys.concat(baruserForbiddenKeys), null);

          done();
        });
      });
    });

    it('should return 200 with the profile of the user except its private informations if the user is NOT the client himself', function(done) {

      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users/' + baruser._id));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;

          checkKeys(res.body, baruserExpectedKeys, baruserForbiddenKeys);

          done();
        });
      });
    });

    describe('Follow tests', function() {

      it('should send back empty follow stats when user does not follow or is not followed', function(done) {
        this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          loggedInAsUser(request(app).get('/api/users/' + foouser._id))
            .expect(200)
            .end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.shallowDeepEqual({
                followers: 0,
                followings: 0
              });
              expect(res.body.following).not.to.exist;
              done();
            });
        });
      });

      it('should send back nb of followers of the current user', function(done) {
        var self = this;

        function test() {
          self.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            loggedInAsUser(request(app).get('/api/users/' + foouser._id))
              .expect(200)
              .end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.shallowDeepEqual({
                  followers: 0,
                  followings: 1
                });
                expect(res.body.following).to.not.exists;
                done();
              });
          });
        }

        self.helpers.requireBackend('core/user/follow').follow(foouser, baruser).then(test, done);
      });

      it('should send back stats when logged in user follow another user', function(done) {
        var self = this;

        function test() {
          self.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }
            loggedInAsUser(request(app).get('/api/users/' + baruser._id))
              .expect(200)
              .end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.shallowDeepEqual({
                  followers: 1,
                  followings: 0
                });
                expect(res.body.following).to.be.true;
                done();
              });
          });
        }

        self.helpers.requireBackend('core/user/follow').follow(foouser, baruser).then(test, done);
      });
    });
  });

  describe('GET /api/users route', function() {

    it('should return 401 if not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/users?email=admin@open-paas.org', done);
    });

    it('should return 200 with the profiles of the users', function(done) {
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users?email=' + baruser.accounts[0].emails[0]));
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(baruser._id.toString()).to.equal(res.body[0]._id);
          done();
        });
      });
    });

    it('should return 200 with the profile of the user without its private informations', function(done) {
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/users?email=' + baruser.accounts[0].emails[0]));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;

          checkKeys(res.body[0], baruserExpectedKeys, baruserForbiddenKeys);

          done();
        });
      });
    });
  });

  describe('GET /api/users/:uuid/profile/avatar route', function() {

    it('should return 404 if the user does not exist', function(done) {
      var self = this;
      var req = request(app).get('/api/users/577cfa973dfc55eb231bba37/profile/avatar');
      req.expect(404).end(self.helpers.callbacks.noError(done));
    });

    it('should redirect to the generated avatar if the user has no image', function(done) {
      var req = request(app).get('/api/users/' + foouser._id + '/profile/avatar');
      req.expect(302).end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.headers.location).to.equal('/api/avatars?objectType=email&email=foo@bar.com');
        done();
      });
    });

    it('should return 200 with the stream of the user avatar', function(done) {
      var imageModule = this.helpers.requireBackend('core/image');
      var readable = require('fs').createReadStream(imagePath);
      var ObjectId = mongoose.Types.ObjectId;
      var avatarId = new ObjectId();
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
        req.query({size: 123, mimetype: 'image/png'})
          .set('Content-Type', 'image/png')
          .send(fileContent).expect(412).end(self.helpers.callbacks.error(done));
      });
    });

  });

  describe('GET /api/user/profile/avatar route', function() {

    it('should return 401 if not authenticated', function(done) {
      this.helpers.api.requireLogin(app, 'get', '/api/user/profile/avatar', done);
    });

    it('should redirect to the generated avatar if the user has no image', function(done) {
      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        var req = loggedInAsUser(request(app).get('/api/user/profile/avatar'));
        req.expect(302).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.headers.location).to.equal('/api/avatars?objectType=email&email=foo@bar.com');
          done();
        });
      });
    });

    it('should return 200 with the stream of the user avatar', function(done) {
      var imageModule = this.helpers.requireBackend('core/image');
      var readable = require('fs').createReadStream(imagePath);
      var ObjectId = mongoose.Types.ObjectId;
      var avatarId = new ObjectId();
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

  describe('GET /api/user route', function() {

    it('should return 200 with the profile of the user, including his configurations', function(done) {
      var self = this;

      this.helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        var moduleName = 'core';
        var configName = 'homePage';
        var configValue = true;

        self.helpers.requireBackend('core/esn-config')(configName)
          .inModule(moduleName)
          .forUser({ preferredDomainId: domain_id })
          .set(configValue, function(err) {
            expect(err).to.not.exist;
            var req = loggedInAsUser(request(app).get('/api/user'));

            req.expect(200).end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body.configurations).to.shallowDeepEqual({
                modules: [{
                  name: moduleName,
                  configurations: [{
                    name: configName,
                    value: configValue
                  }]
                }]
              });

              done();
            });
          });
      });
    });

  });

});
