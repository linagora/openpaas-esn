'use strict';

const request = require('supertest'),
    expect = require('chai').expect;

describe('The profile API', function() {
  let app, helpers, mongoose, core;
  let foouser, baruser, baruserExpectedKeys, baruserForbiddenKeys, checkKeys, imagePath, domain_id;

  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;
    const self = this;

    imagePath = helpers.getFixturePath('image.png');

    core = self.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      mongoose = require('mongoose');

      const coreUserDenormalize = helpers.rewireBackend('core/user/denormalize');

      helpers.api.applyDomainDeployment('foo_and_bar_users', function(err, models) {
        if (err) {
          return done(err);
        }
        domain_id = models.domain._id;
        foouser = models.users[0];
        baruser = models.users[1];
        baruserExpectedKeys = [];
        coreUserDenormalize.__get__('publicKeys').forEach(function(key) {
          if (baruser[key]) {
            baruserExpectedKeys.push(key);
          }
        });
        baruserForbiddenKeys = [];
        coreUserDenormalize.__get__('privateKeys').forEach(function(key) {
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
    helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/users/:userId/profile route', function() {

    it('should return 401 if not authenticated', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/users/' + baruser._id + '/profile', done);
    });

    it('should create a profile link when authenticated user looks at a user profile', function(done) {
      const Link = mongoose.model('ResourceLink');

      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/users/' + baruser._id + '/profile'));

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
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/users/577cfa973dfc55eb231bba37/profile'));

        req.expect(404).end(helpers.callbacks.noError(done));
      });
    });

    it('should return 200 with the profile of the user', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/users/' + baruser._id + '/profile'));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(baruser._id.toString()).to.equal(res.body._id);
          done();
        });
      });
    });

    it('should return 200 with the profile of the user including its private informations if the user is the client himself', function(done) {

      helpers.api.loginAsUser(app, baruser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/users/' + baruser._id + '/profile'));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;

          checkKeys(res.body, baruserExpectedKeys.concat(baruserForbiddenKeys), null);

          done();
        });
      });
    });

    it('should return 200 with the profile of the user except its private informations if the user is NOT the client himself', function(done) {

      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/users/' + baruser._id + '/profile'));

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
      helpers.api.requireLogin(app, 'put', '/api/user/profile', done);
    });

    it('should return 200 and update his profile', function(done) {
      const User = mongoose.model('User');
      const profile = {
        firstname: 'James',
        lastname: 'Amaly',
        job_title: 'Engineer',
        service: 'IT',
        building_location: 'Tunis',
        office_location: 'France',
        main_phone: '123456789',
        description: 'This is my description'
      };

      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        const req = loggedInAsUser(request(app).put('/api/user/profile'));

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
      const User = mongoose.model('User');
      const profile = {
        firstname: 'John'
      };

      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        const req = loggedInAsUser(request(app).put('/api/user/profile'));

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
      helpers.api.requireLogin(app, 'get', '/api/users/' + baruser._id, done);
    });

    it('should return 404 if the user does not exist', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/users/577cfa973dfc55eb231bba37'));

        req.expect(404).end(helpers.callbacks.noError(done));
      });
    });

    it('should return 200 with the profile of the user', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/users/' + baruser._id));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(baruser._id.toString()).to.equal(res.body._id);
          done();
        });
      });
    });

    it('should return 200 with the profile of the user including its private informations if the user is the client himself', function(done) {

      helpers.api.loginAsUser(app, baruser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/users/' + baruser._id));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;

          checkKeys(res.body, baruserExpectedKeys.concat(baruserForbiddenKeys), null);

          done();
        });
      });
    });

    it('should return 200 with the profile of the user except its private informations if the user is NOT the client himself', function(done) {

      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/users/' + baruser._id));

        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;

          checkKeys(res.body, baruserExpectedKeys, baruserForbiddenKeys);

          done();
        });
      });
    });

    describe('Follow tests', function() {

      it('should send back empty follow stats when user does not follow or is not followed', function(done) {
        helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
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
        function test() {
          helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
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

        helpers.requireBackend('core/user/follow').follow(foouser, baruser).then(test, done);
      });

      it('should send back stats when logged in user follow another user', function(done) {
        function test() {
          helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
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

        helpers.requireBackend('core/user/follow').follow(foouser, baruser).then(test, done);
      });
    });
  });

  describe('GET /api/users route', function() {
    it('should return 401 if not authenticated', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/users?email=admin@open-paas.org', done);
    });

    it('should return 400 if there is no email or search param', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
        loggedInAsUser(request(app).get('/api/users'))
          .expect(400)
          .end(helpers.callbacks.noError(done));
      }));
    });

    describe('Get profiles by email', function() {
      it('should return 200 with empty array if no user found', function(done) {
        helpers.api.loginAsUser(app, foouser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get('/api/users?email=admin@open-paas.org'))
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.headers['x-esn-items-count']).to.equal(`${res.body.length}`);
              expect(res.body).to.be.empty;
              done();
            }));
        }));
      });

      it('should return 200 with the profiles of the users', function(done) {
        helpers.api.loginAsUser(app, foouser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get('/api/users?email=' + baruser.accounts[0].emails[0]))
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.headers['x-esn-items-count']).to.equal(`${res.body.length}`);
              expect(baruser._id.toString()).to.equal(res.body[0]._id);
              done();
            }));
        }));
      });

      it('should return 200 with the profile of the user without its private informations', function(done) {
        helpers.api.loginAsUser(app, foouser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get('/api/users?email=' + baruser.accounts[0].emails[0]))
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.headers['x-esn-items-count']).to.equal(`${res.body.length}`);
              checkKeys(res.body[0], baruserExpectedKeys, baruserForbiddenKeys);
              done();
            }));
        }));
      });
    });

    describe('Get profiles by search', function() {
      beforeEach(done => {
        core.platformadmin
          .addPlatformAdmin(foouser)
          .then(() => done())
          .catch(err => done(err || 'failed to add platformadmin'));
      });

      it('should send back 403 if the logged in user is not platformadmin', function(done) {
        helpers.api.loginAsUser(app, baruser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get('/api/domains?search=a'))
            .expect(403)
            .end(helpers.callbacks.noError(done));
        }));
      });

      it('should return 200 with the profiles of the users', function(done) {
        helpers.api.loginAsUser(app, foouser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get('/api/users?search=' + foouser.emails[0]))
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.headers['x-esn-items-count']).to.equal(`${res.body.length}`);
              expect(foouser.emails[0]).to.equal(res.body[0].emails[0]);
              done();
            }));
        }));
      });

      it('should return 200 with the profile of the user without its private informations', function(done) {
        helpers.api.loginAsUser(app, foouser.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          loggedInAsUser(request(app).get('/api/users?search=' + baruser.emails[0]))
            .expect(200)
            .end(helpers.callbacks.noErrorAnd(res => {
              expect(res.headers['x-esn-items-count']).to.equal(`${res.body.length}`);
              checkKeys(res.body[0], baruserExpectedKeys, baruserForbiddenKeys);
              done();
            }));
        }));
      });
    });
  });

  describe('GET /api/users/:uuid/profile/avatar route', function() {

    it('should return 404 if the user does not exist', function(done) {
      const req = request(app).get('/api/users/577cfa973dfc55eb231bba37/profile/avatar');

      req.expect(404).end(helpers.callbacks.noError(done));
    });

    it('should redirect to the generated avatar if the user has no image', function(done) {
      const req = request(app).get('/api/users/' + foouser._id + '/profile/avatar');

      req.expect(302).end(function(err, res) {
        expect(err).to.not.exist;
        expect(res.headers.location).to.equal('/api/avatars?objectType=email&email=foo@bar.com');
        done();
      });
    });

    it('should return 200 with the stream of the user avatar', function(done) {
      const imageModule = helpers.requireBackend('core/image');
      const readable = require('fs').createReadStream(imagePath);
      const ObjectId = mongoose.Types.ObjectId;
      const avatarId = new ObjectId();
      const opts = {
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
          const req = request(app).get('/api/users/' + foouser._id + '/profile/avatar');

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
      helpers.api.requireLogin(app, 'post', '/api/user/profile/avatar', done);
    });

    it('should return 400 if the "mimetype" query string is missing', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).post('/api/user/profile/avatar?size=123'));

        req.send().expect(400).end(helpers.callbacks.noError(done));
      });
    });

    it('should return 400 if the "size" query string is missing', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).post('/api/user/profile/avatar?mimetype=image%2Fpng'));

        req.send().expect(400).end(helpers.callbacks.noError(done));
      });
    });

    it('should return 400 if the "mimetype" query string is not an accepted mime type', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).post('/api/user/profile/avatar?mimetype=notAGoodType&size=123'));

        req.send().expect(400).end(helpers.callbacks.noError(done));
      });
    });

    it('should return 400 if the "size" query string is not a number', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).post('/api/user/profile/avatar?mimetype=image%2Fpng&size=notanumber'));

        req.send().expect(400).end(helpers.callbacks.noError(done));
      });
    });

    it('should return 412 if the "size" query string is not equal to the actual image size', function(done) {
      const fileContent = require('fs').readFileSync(imagePath).toString();

      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).post('/api/user/profile/avatar'));

        req.query({size: 123, mimetype: 'image/png'})
          .set('Content-Type', 'image/png')
          .send(fileContent).expect(412).end(helpers.callbacks.error(done));
      });
    });

  });

  describe('GET /api/user/profile/avatar route', function() {

    it('should return 401 if not authenticated', function(done) {
      helpers.api.requireLogin(app, 'get', '/api/user/profile/avatar', done);
    });

    it('should redirect to the generated avatar if the user has no image', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }
        const req = loggedInAsUser(request(app).get('/api/user/profile/avatar'));

        req.expect(302).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.headers.location).to.equal('/api/avatars?objectType=email&email=foo@bar.com');
          done();
        });
      });
    });

    it('should return 200 with the stream of the user avatar', function(done) {
      const imageModule = helpers.requireBackend('core/image');
      const readable = require('fs').createReadStream(imagePath);
      const ObjectId = mongoose.Types.ObjectId;
      const avatarId = new ObjectId();
      const opts = {
        creator: {objectType: 'user', id: foouser._id}
      };

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
          helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              done(err);
            }
            const req = loggedInAsUser(request(app).get('/api/user/profile/avatar'));

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

    it('should return 200 with the profile of the user, including his configurations and follows', function(done) {
      helpers.api.loginAsUser(app, foouser.emails[0], password, function(err, loggedInAsUser) {
        if (err) {
          return done(err);
        }

        const moduleName = 'core';
        const configName = 'homePage';
        const configValue = true;

        helpers.requireBackend('core/esn-config')(configName)
          .inModule(moduleName)
          .forUser({ preferredDomainId: domain_id })
          .set(configValue, function(err) {
            expect(err).to.not.exist;
            const req = loggedInAsUser(request(app).get('/api/user'));

            req.expect(200).end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body.isPlatformAdmin).to.be.false;
              expect(res.body.configurations).to.shallowDeepEqual({
                modules: [{
                  name: moduleName,
                  configurations: [{
                    name: configName,
                    value: configValue
                  }]
                }]
              });
              expect(res.body.followers).to.equal(0);
              expect(res.body.followings).to.equal(0);

              done();
            });
          });
      });
    });

    it('should return 200 with isPlatformAdmin true if user is platform admin', function(done) {
      const fixtures = helpers.requireFixture('models/users.js')(helpers.requireBackend('core/db/mongo/models/user'));

      fixtures.newDummyUser(['platformadmin@email.com']).save(helpers.callbacks.noErrorAnd(user => {
        core.platformadmin
          .addPlatformAdmin(user)
          .then(() => {
            helpers.api.loginAsUser(app, 'platformadmin@email.com', password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }

              const req = loggedInAsUser(request(app).get('/api/user'));

              req.expect(200).end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body.isPlatformAdmin).to.be.true;

                done();
              });
            });
          })
          .catch(err => done(err || 'failed to add platformadmin'));
      }));
    });
  });

});
