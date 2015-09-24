'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The avatars controller', function() {

  describe('The get function', function() {

    describe('when when req.query.objectType is not set', function() {
      beforeEach(function() {
        mockery.registerMock('../middleware/collaboration', {});
        mockery.registerMock('./collaborations', {});
        mockery.registerMock('./users', {});
        mockery.registerMock('../../core/user', {});
        mockery.registerMock('../../core/image', {});
      });

      it('should send back 400 when req.query.email is not set', function(done) {
        var req = {
          query: {}
        };

        var res = {
          json: function(code) {
            expect(code).to.equal(400);
            done();
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });


      it('should send back 500 when avatarModule.getAvatarFromEmail sends an error', function(done) {
        var email = 'user@domain';

        mockery.registerMock('../../core/avatar', {
          registerProvider: function() {},
          getAvatarFromEmail: function(mail, callback) {
            expect(mail).to.equal(email);
            return callback(new Error());
          }
        });

        var req = {
          query: {
            email: email
          }
        };

        var res = {
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });

      it('should call the controller returned by avatarModule.getAvatarFromEmail', function(done) {
        var email = 'user@domain';

        var req = {
          query: {
            email: email
          }
        };

        var res = {
          status: 101
        };

        var object = {
          _id: '123'
        };

        var controller = function(o, request, response) {
          expect(o).to.deep.equal(object);
          expect(req).to.deep.equal(request);
          expect(res).to.deep.equal(response);
          done();
        };

        mockery.registerMock('../../core/avatar', {
          registerProvider: function() {},
          getAvatarFromEmail: function(mail, callback) {
            expect(mail).to.equal(email);
            return callback(null, object, controller);
          }
        });

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });
    });

    it('send back HTTP 400 when objectType is not recognized', function(done) {
      mockery.registerMock('../middleware/collaboration', {});
      mockery.registerMock('./collaborations', {});
      mockery.registerMock('./users', {});
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../core/image', {});

      var req = {
        query: {
          objectType: 'notrecognized'
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
      avatars.get(req, res);
    });

    describe('The community objectType', function() {
      it('should send back HTTP 400 when req.query.id is not set', function(done) {
        mockery.registerMock('../middleware/collaboration', {});
        mockery.registerMock('./collaborations', {});
        mockery.registerMock('./users', {});
        mockery.registerMock('../../core/user', {});
        mockery.registerMock('../../core/image', {});

        var req = {
          query: {
            objectType: 'community'
          }
        };

        var res = {
          json: function(code) {
            expect(code).to.equal(400);
            done();
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });

      it('should load the community from its id', function(done) {
        mockery.registerMock('../middleware/collaboration', {
          load: function(req, res, next) {
            return done();
          }
        });
        mockery.registerMock('./collaborations', {});
        mockery.registerMock('./users', {});
        mockery.registerMock('../../core/user', {});
        mockery.registerMock('../../core/image', {});

        var req = {
          query: {
            objectType: 'community',
            id: 123
          },
          params: {}
        };

        var res = {
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });

      it('should send back HTTP 500 when community load fails', function(done) {
        mockery.registerMock('../middleware/collaboration', {
          load: function(req, res, next) {
            return next(new Error());
          }
        });
        mockery.registerMock('./collaborations', {});
        mockery.registerMock('./users', {});
        mockery.registerMock('../../core/user', {});
        mockery.registerMock('../../core/image', {});

        var req = {
          query: {
            objectType: 'community',
            id: 123
          },
          params: {}
        };

        var res = {
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });

      it('should call the getAvatar fn when community is found', function(done) {
        mockery.registerMock('../middleware/collaboration', {
          load: function(req, res, next) {
            return next();
          }
        });
        mockery.registerMock('./collaborations', {
          getAvatar: function() {
            return done();
          }
        });
        mockery.registerMock('./users', {});
        mockery.registerMock('../../core/user', {});
        mockery.registerMock('../../core/image', {});

        var req = {
          query: {
            objectType: 'community',
            id: 123
          },
          params: {}
        };

        var res = {
          json: function() {
            return done(new Error());
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });
    });

    describe('The user objecType', function() {
      it('should redirect to /images/not_a_user.png when user with query email throws back error', function(done) {
        mockery.registerMock('../middleware/collaboration', {});
        mockery.registerMock('./collaborations', {});
        mockery.registerMock('./users', {});
        mockery.registerMock('../../core/user', {
          findByEmail: function(email, callback) {
            return callback(new Error());
          }
        });

        var req = {
          query: {
            objectType: 'user',
            email: 'you@me.com'
          }
        };

        var res = {
          redirect: function(path) {
            expect(path).to.equal('/images/not_a_user.png');
            done();
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);

      });

      it('should redirect to /images/not_a_user.png when user with query email can not be found', function(done) {
        mockery.registerMock('../middleware/collaboration', {});
        mockery.registerMock('./collaborations', {});
        mockery.registerMock('./users', {});
        mockery.registerMock('../../core/user', {
          findByEmail: function(email, callback) {
            return callback();
          }
        });

        var req = {
          query: {
            objectType: 'user',
            email: 'you@me.com'
          }
        };

        var res = {
          redirect: function(path) {
            expect(path).to.equal('/images/not_a_user.png');
            done();
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });

      it('should call users#getProfileAvatar with found user', function(done) {
        var user = {
          _id: 123
        };
        mockery.registerMock('../middleware/collaboration', {});
        mockery.registerMock('./collaborations', {});
        mockery.registerMock('./users', {
          getProfileAvatar: function(req, res) {
            expect(req.user).to.deep.equal(user);
            done();
          }
        });
        mockery.registerMock('../../core/user', {
          findByEmail: function(email, callback) {
            return callback(null, user);
          }
        });

        var req = {
          query: {
            objectType: 'user',
            email: 'you@me.com'
          }
        };

        var res = {
          redirect: function(path) {
            done(new Error());
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });
    });

    describe('The email objecType', function() {
      beforeEach(function() {
        mockery.registerMock('../middleware/collaboration', {});
        mockery.registerMock('./collaborations', {});
        mockery.registerMock('./users', {});
        mockery.registerMock('../../core/user', {});
        this.error400 = function(done) {
          return {
            json: function(code) {
              expect(code).to.equal(400);
              done();
            }
          };
        };
      });

      it('should fail if no email is given as query parameter', function(done) {
        var req = {
          query: {
            objectType: 'email'
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, this.error400(done));
      });

      it('should fail if the email given as query parameter is not a string', function(done) {
        var req = {
          query: {
            objectType: 'email',
            email: {pipo: 'test'}
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, this.error400(done));
      });

      it('should fail if the email given as query parameter is an empty string', function(done) {
        var req = {
          query: {
            objectType: 'email',
            email: ''
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, this.error400(done));
      });

      it('should call the avatar generation module and return the generated avatar', function(done) {
        var req = {
          query: {
            objectType: 'email',
            email: 'toto@toto.fr'
          }
        };

        var generationResult = 'aResult';
        mockery.registerMock('../../core/image', {
          avatarGenerationModule: {
            generateFromText: function(options) {
              expect(options).to.deep.equal({text: 't'});
              return generationResult;
            }
          }
        });

        var res = {
          send: function(content) {
            expect(content).to.deep.equal(generationResult);
            done();
          }
        };

        var avatars = this.helpers.requireBackend('webserver/controllers/avatars');
        avatars.get(req, res);
      });
    });
  });
});
