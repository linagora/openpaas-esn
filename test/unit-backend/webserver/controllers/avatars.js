'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The avatars controller', function() {

  describe('The get function', function() {
    it('should send back 400 when req.query.objectType is not set', function(done) {
      mockery.registerMock('./communities', {});
      mockery.registerMock('./users', {});
      mockery.registerMock('../../core/user', {});
      mockery.registerMock('../../core/image', {});

      var req = {
        query: {}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var avatars = require(this.testEnv.basePath + '/backend/webserver/controllers/avatars');
      avatars.get(req, res);
    });

    it('send back HTTP 400 when objectType is not recognized', function(done) {
      mockery.registerMock('./communities', {});
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

      var avatars = require(this.testEnv.basePath + '/backend/webserver/controllers/avatars');
      avatars.get(req, res);
    });

    describe('The community objectType', function() {
      it('should send back HTTP 400 when req.query.id is not set', function(done) {
        mockery.registerMock('./communities', {});
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

        var avatars = require(this.testEnv.basePath + '/backend/webserver/controllers/avatars');
        avatars.get(req, res);
      });

      it('should load the community from its id', function(done) {
        mockery.registerMock('./communities', {
          load: function(req, res, next) {
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
        };

        var avatars = require(this.testEnv.basePath + '/backend/webserver/controllers/avatars');
        avatars.get(req, res);
      });

      it('should send back HTTP 500 when community load fails', function(done) {
        mockery.registerMock('./communities', {
          load: function(req, res, next) {
            return next(new Error());
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
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        };

        var avatars = require(this.testEnv.basePath + '/backend/webserver/controllers/avatars');
        avatars.get(req, res);
      });

      it('should call the getAvatar fn when community is found', function(done) {
        mockery.registerMock('./communities', {
          load: function(req, res, next) {
            return next();
          },
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

        var avatars = require(this.testEnv.basePath + '/backend/webserver/controllers/avatars');
        avatars.get(req, res);
      });
    });

    describe('The user objecType', function() {
      it('should redirect to /images/not_a_user.png when user with query email throws back error', function(done) {
        mockery.registerMock('./communities', {});
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

        var avatars = require(this.testEnv.basePath + '/backend/webserver/controllers/avatars');
        avatars.get(req, res);

      });

      it('should redirect to /images/not_a_user.png when user with query email can not be found', function(done) {
        mockery.registerMock('./communities', {});
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

        var avatars = require(this.testEnv.basePath + '/backend/webserver/controllers/avatars');
        avatars.get(req, res);
      });

      it('should call users#getProfileAvatar with found user', function(done) {
        var user = {
          _id: 123
        };
        mockery.registerMock('./communities', {});
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

        var avatars = require(this.testEnv.basePath + '/backend/webserver/controllers/avatars');
        avatars.get(req, res);
      });
    });
  });
});
