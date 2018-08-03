'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');

describe('The User controller', function() {

  beforeEach(function(done) {
    this.testEnv.initCore(done);
  });

  describe('The logout fn', function() {
    it('should call req.logout()', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        logout: done
      };
      var res = {
        redirect: function() {}
      };
      users.logout(req, res);
    });
    it('should redirect to "/"', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        logout: function() {}
      };
      var res = {
        redirect: function(path) {
          expect(path).to.equal('/');
          done();
        }
      };
      users.logout(req, res);
    });
  });

  describe('The logmein fn', function() {
    it('should redirect to / if user is set in request', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        redirect: function(path) {
          expect(path).to.equal('/');
          done();
        }
      };
      users.logmein(req, res);
    });

    it('should return HTTP 500 if user email is not defined', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        user: {
        }
      };
      var res = this.helpers.express.response(
        function(status) {
          expect(status).to.equal(500);
          done();
        }
      );
      users.logmein(req, res);
    });

    it('should return HTTP 500 if user is not set in request', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {};
      var res = this.helpers.express.response(
        function(status) {
          expect(status).to.equal(500);
          done();
        }
      );
      users.logmein(req, res);
    });
  });

  describe('The user fn', function() {
    it('should return the request user if available', function(done) {
      mockery.registerMock('../denormalize/user', {
        denormalize: function(user) {
          return q(user);
        }
      });
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        user: {
          accounts: [{
            type: 'email',
            emails: ['foo@bar.com']
          }]
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.shallowDeepEqual(req.user);

          done();
        }
      );
      users.user(req, res);
    });

    it('should return HTTP 404 if user is not defined in the request', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
      };
      var res = this.helpers.express.jsonResponse(
        function(status) {
          expect(status).to.equal(404);
          done();
        }
      );
      users.user(req, res);
    });
  });

  describe('The profile function', function() {
    it('should return HTTP 400 if the uuid is missing', function(done) {

      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        user: {id: this.helpers.objectIdMock('1')},
        params: {}
      };
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(400);
          expect(data.error.code).to.equal(400);
          expect(data.error.message).to.equal('Bad parameters');
          expect(data.error.details).to.equal('User ID is missing');

          done();
        }
      );

      users.profile(req, res);
    });

    it('should return HTTP 500 if there is an error', function(done) {
      var error = {
        message: 'error message'
      };
      var moduleMock = {
        user: {
          get: function(uuid, callback) {
            callback(error);
          }
        }
      };

      mockery.registerMock('../../core', moduleMock);

      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        user: {id: this.helpers.objectIdMock('123')},
        params: {
          uuid: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(500);
          expect(data.error).to.equal(500);
          expect(data.message).to.equal('Error while loading user 123');
          expect(data.details).to.equal(error.message);

          done();
        }
      );

      users.profile(req, res);
    });

    it('should return HTTP 404 if user does not exist', function(done) {
      var moduleMock = {
        user: {
          get: function(uuid, callback) {
            callback();
          }
        }
      };

      mockery.registerMock('../../core', moduleMock);

      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        user: {id: this.helpers.objectIdMock('123')},
        params: {
          uuid: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(404);
          expect(data.error).to.equal(404);
          expect(data.message).to.equal('User not found');
          expect(data.details).to.equal('User 123 has not been found');

          done();
        }
      );

      users.profile(req, res);
    });

    it('should return HTTP 200 if the user is returned', function(done) {
      var user = {
        _id: '123',
        firstname: 'Dali',
        lastname: 'Dali'
      };
      var moduleMock = {
        user: {
          get: function(uuid, callback) {
            callback(null, user);
          }
        }
      };

      mockery.registerMock('../denormalize/user', {
        denormalize: function(user) {
          return q(user);
        }
      });

      mockery.registerMock('../../core', moduleMock);

      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        user: {
          _id: '123'
        },
        params: {
          uuid: '123'
        }
      };
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.shallowDeepEqual(user);

          done();
        }
      );

      users.profile(req, res);
    });
  });

  describe('The updateProfile fn', function() {

    beforeEach(function() {
      var mock = {
        user: {
          updateProfile: function(user, profile, callback) {
            return callback();
          }
        }
      };
      mockery.registerMock('../../core', mock);
    });

    it('should send back 404 if user is not set', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
      };
      var res = {
        json: function() {
          done();
        },
        status: function(code) {
          expect(code).to.equal(404);
          return this;
        }
      };
      users.updateProfile(req, res);
    });

    it('should not send back error if profile is not set', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        profile: {},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function() {
          done();
        },
        status: function(code) {
          expect(code).to.equal(400);
          return this;
        }
      };
      users.updateProfile(req, res);
    });

    it('should be OK if profile is set with valid values', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        body: {
          firstname: 'James',
          lastname: 'Amaly',
          job_title: 'Engineer',
          service: 'IT',
          building_location: 'Tunis',
          office_location: 'France',
          main_phone: '123456789',
          decription: 'This is my description'
        },
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function() {
          done();
        },
        status: function(code) {
          expect(code).to.equal(200);
          return this;
        }
      };
      users.updateProfile(req, res);
    });
  });

  describe('postProfileAvatar() function', function() {
    it('should return 404 if the user is not actually logged in', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(404);
          expect(data.error).to.equal(404);
          expect(data.message).to.equal('Not found');
          expect(data.details).to.equal('User not found');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should return 400 if the mimetype argument is not set', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: {}, query: {}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(400);
          expect(data.error).to.equal(400);
          expect(data.message).to.equal('Parameter missing');
          expect(data.details).to.equal('mimetype parameter is required');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should return 400 if the mimetype argument is not an image mimetype', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'application/yolo'}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(400);
          expect(data.error).to.equal(400);
          expect(data.message).to.equal('Bad parameter');
          expect(data.details).to.equal('mimetype application/yolo is not acceptable');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should return 400 if the size argument is not set', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png'}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(400);
          expect(data.error).to.equal(400);
          expect(data.message).to.equal('Parameter missing');
          expect(data.details).to.equal('size parameter is required');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should return 400 if the size argument is not an integer', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 'yolo'}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(400);
          expect(data.error).to.equal(400);
          expect(data.message).to.equal('Bad parameter');
          expect(data.details).to.equal('size parameter should be an integer');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should call the image.recordAvatar method', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          expect(avatarId).to.have.property('toHexString');
          expect(mimetype).to.equal('image/png');
          expect(avatarRecordResponse).to.be.a.function;
          done();
        }
      };
      mockery.registerMock('./image', imageMock);
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      var res = {
      };
      users.postProfileAvatar(req, res);
    });

    it('should set the current user as avatar creator', function(done) {
      var user = {
        _id: 123
      };

      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts) {
          expect(opts).to.exist;
          expect(opts.creator).to.exist;
          expect(opts.creator.objectType).to.equal('user');
          expect(opts.creator.id).to.equal(user._id);
          done();
        }
      };
      mockery.registerMock('./image', imageMock);
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: user, query: {mimetype: 'image/png', size: 42}};
      var res = {
      };
      users.postProfileAvatar(req, res);
    });

    it('should return 500 if the recordAvatar response is a datastore failure', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          var err = new Error('yolo');
          err.code = 1;
          avatarRecordResponse(err);
        }
      };
      mockery.registerMock('./image', imageMock);
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(500);
          expect(data.error).to.equal(500);
          expect(data.message).to.equal('Datastore failure');
          expect(data.details).to.equal('yolo');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should return 500 if the recordAvatar response is an image manipulation failure', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          var err = new Error('yolo');
          err.code = 2;
          avatarRecordResponse(err);
        }
      };
      mockery.registerMock('./image', imageMock);
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(500);
          expect(data.error).to.equal(500);
          expect(data.message).to.equal('Image processing failure');
          expect(data.details).to.equal('yolo');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should return 500 if the recordAvatar response is a generic error', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          var err = new Error('yolo');
          avatarRecordResponse(err);
        }
      };
      mockery.registerMock('./image', imageMock);
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(500);
          expect(data.error).to.equal(500);
          expect(data.message).to.equal('Internal server error');
          expect(data.details).to.equal('yolo');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should return 412 if the object recorded size is not the size provided by the user agent', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          avatarRecordResponse(null, 666);
        }
      };
      mockery.registerMock('./image', imageMock);
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(412);
          expect(data.error).to.equal(412);
          expect(data.message).to.equal('Image size does not match');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should call the update function of the user module to update user', function(done) {
      var usermock = {
        avatars: [],
        currentAvatar: undefined
      };
      var moduleMock = {
        user: {
          update: function() {
            expect(usermock.avatars).to.have.length(1);
            expect(usermock.currentAvatar).to.equal(usermock.avatars[0]);
            done();
          }
        },
        image: {
          recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
            avatarRecordResponse(null, 42);
          }
        }
      };
      mockery.registerMock('../../core', moduleMock);

      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {user: usermock, query: {mimetype: 'image/png', size: 42}};
      var res = this.helpers.express.jsonResponse(
        function() {
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should return 500 if the model cannot be saved', function(done) {
      var moduleMock = {
        user: {
          update: function(user, callback) {
            var err = new Error('yolo');
            callback(err);
          }
        },
        image: {
          recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
            avatarRecordResponse(null, 42);
          }
        }
      };
      mockery.registerMock('../../core', moduleMock);

      var users = this.helpers.requireBackend('webserver/controllers/users');

      var usermock = {
        avatars: [],
        currentAvatar: undefined
      };
      var req = {user: usermock, query: {mimetype: 'image/png', size: 42}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(500);
          expect(data.error).to.equal(500);
          expect(data.message).to.equal('Datastore failure');
          expect(data.details).to.equal('yolo');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });

    it('should return 200 and the avatar id, if recording is successfull', function(done) {
      var moduleMock = {
        user: {
          update: function(user, callback) {
            callback();
          }
        },
        image: {
          recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
            avatarRecordResponse(null, 42);
          }
        }
      };
      mockery.registerMock('../../core', moduleMock);

      var users = this.helpers.requireBackend('webserver/controllers/users');

      var usermock = {
        avatars: [],
        currentAvatar: undefined
      };
      var req = {user: usermock, query: {mimetype: 'image/png', size: 42}};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(200);
          expect(data._id).to.exist;
          expect(data._id).to.have.property('toHexString');
          done();
        }
      );
      users.postProfileAvatar(req, res);
    });
  });

  describe('the getProfileAvatar function', function() {
    it('should return 404 if the user is not logged in', function(done) {
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {};
      var res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(404);
          expect(data).to.deep.equal({error: 404, message: 'Not found', details: 'User not found'});
          done();
        }
      );
      users.getProfileAvatar(req, res);
    });

    it('should redirect to default avatar the image Module return an error', function(done) {
      var imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback(new Error('error !'));
        },
        getMeta: function(id, callback) {
          return callback(null, {});
        }
      };
      mockery.registerMock('./image', imageModuleMock);
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        user: {
          currentAvatar: 'id'
        },
        query: {}
      };
      var res = {
        redirect: function() {
          done();
        }
      };

      users.getProfileAvatar(req, res);
    });

    it('should redirect to default avatar the image Module does not return the stream', function(done) {
      var imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback();
        },
        getMeta: function(id, callback) {
          return callback(null, {});
        }
      };
      mockery.registerMock('./image', imageModuleMock);
      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        user: {
          currentAvatar: 'id'
        },
        query: {}
      };
      var res = {
        redirect: function() {
          done();
        }
      };

      users.getProfileAvatar(req, res);
    });

    it('should return 200 and the stream even if meta data can not be found', function(done) {
      var image = {
        stream: 'test',
        pipe: function(res) {
          expect(res.header['Last-Modified']).to.not.exist;
          expect(res.code).to.equal(200);
          done();
        }
      };

      var imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback(null, null, image);
        }
      };
      mockery.registerMock('./image', imageModuleMock);

      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        headers: {
        },
        user: {
          _id: '_id',
          currentAvatar: 'id'
        },
        query: {
        }
      };
      var res = {
        status: function(code) {
          this.code = code;

          return res;
        },
        header: function(header, value) {
          this.header[header] = value;
        }
      };

      users.getProfileAvatar(req, res);
    });

    it('should return 200, add to the cache, and the stream of the avatar file if all is ok', function(done) {
      var image = {
        stream: 'test',
        pipe: function(res) {
          expect(res.header['Last-Modified']).to.exist;
          expect(res.code).to.equal(200);
          done();
        }
      };

      var imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback(null,
            {
              meta: 'data',
              uploadDate: new Date('Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)')
            }, image);
        }
      };
      mockery.registerMock('./image', imageModuleMock);

      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        headers: {
          'if-modified-since': 'Thu Apr 17 2013 11:13:15 GMT+0200 (CEST)'
        },
        user: {
          _id: '_id',
          currentAvatar: 'id'
        },
        query: {
        }
      };
      var res = {
        status: function(code) {
          this.code = code;

          return res;
        },
        header: function(header, value) {
          this.header[header] = value;
        }
      };

      users.getProfileAvatar(req, res);
    });

    it('should return 304 if the avatar has not changed til the last GET', function(done) {
      var image = {
        stream: 'test',
        pipe: function() {
          throw new Error();
        }
      };

      var imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback(null,
            {
              meta: 'data',
              uploadDate: new Date('Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)')
            }, image);
        }
      };
      mockery.registerMock('./image', imageModuleMock);

      var users = this.helpers.requireBackend('webserver/controllers/users');
      var req = {
        headers: {
          'if-modified-since': 'Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)'
        },
        user: {
          _id: '_id',
          currentAvatar: 'id'
        },
        query: {
        }
      };
      var res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(304);
          done();
        }
      );

      users.getProfileAvatar(req, res);
    });
  });
});
