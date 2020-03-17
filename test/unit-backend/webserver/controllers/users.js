const { expect } = require('chai');
const mockery = require('mockery');
const q = require('q');

describe('The User controller', function() {

  beforeEach(function(done) {
    this.testEnv.initCore(done);
  });

  describe('The logout fn', function() {
    it('should call req.logout()', function(done) {
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        logout: done
      };
      const res = {
        redirect: function() {}
      };

      users.logout(req, res);
    });
    it('should redirect to "/"', function(done) {
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        logout: function() {}
      };
      const res = {
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
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        user: {
          emails: ['foo@bar.com']
        }
      };
      const res = {
        redirect: function(path) {
          expect(path).to.equal('/');
          done();
        }
      };

      users.logmein(req, res);
    });

    it('should return HTTP 500 if user email is not defined', function(done) {
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        user: {
        }
      };
      const res = this.helpers.express.response(
        function(status) {
          expect(status).to.equal(500);
          done();
        }
      );

      users.logmein(req, res);
    });

    it('should return HTTP 500 if user is not set in request', function(done) {
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {};
      const res = this.helpers.express.response(
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
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        user: {
          accounts: [{
            type: 'email',
            emails: ['foo@bar.com']
          }]
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.shallowDeepEqual(req.user);

          done();
        }
      );

      users.user(req, res);
    });

    it('should return HTTP 404 if user is not defined in the request', function(done) {
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
      };
      const res = this.helpers.express.jsonResponse(
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

      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        user: {id: this.helpers.objectIdMock('1')},
        params: {}
      };
      const res = this.helpers.express.jsonResponse(
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
      const error = {
        message: 'error message'
      };
      const moduleMock = {
        user: {
          get: (uuid, callback) => callback(error),
          updateProfile: (user, profile, callback) => callback()
        }
      };

      mockery.registerMock('../../core', moduleMock);

      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        user: {id: this.helpers.objectIdMock('123')},
        params: {
          uuid: '123'
        }
      };
      const res = this.helpers.express.jsonResponse(
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
      const moduleMock = {
        user: {
          get: (uuid, callback) => callback(),
          updateProfile: (user, profile, callback) => callback()
        }
      };

      mockery.registerMock('../../core', moduleMock);

      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        user: {id: this.helpers.objectIdMock('123')},
        params: {
          uuid: '123'
        }
      };
      const res = this.helpers.express.jsonResponse(
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
      const user = {
        _id: '123',
        firstname: 'Dali',
        lastname: 'Dali'
      };
      const moduleMock = {
        user: {
          get: (uuid, callback) => callback(null, user),
          updateProfile: (user, profile, callback) => callback()
        }
      };

      mockery.registerMock('../denormalize/user', {
        denormalize: function(user) {
          return q(user);
        }
      });

      mockery.registerMock('../../core', moduleMock);

      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        user: {
          _id: '123'
        },
        params: {
          uuid: '123'
        }
      };
      const res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.shallowDeepEqual(user);

          done();
        }
      );

      users.profile(req, res);
    });
  });

  describe('The updateUserProfileOnReq fn', function() {

    beforeEach(function() {
      const mock = {
        user: {
          updateProfile: (user, profile, callback) => callback()
        }
      };

      mockery.registerMock('../../core', mock);
    });

    it('should be OK if profile is set with valid values', function(done) {
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
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
      const res = {
        json: function() {
          done();
        },
        status: function(code) {
          expect(code).to.equal(200);

          return this;
        }
      };

      users.updateUserProfileOnReq('user')(req, res);
    });
  });

  describe('postProfileAvatar() function', function() {
    it('should call the image.recordAvatar method', function(done) {
      const imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          expect(avatarId).to.have.property('toHexString');
          expect(mimetype).to.equal('image/png');
          expect(avatarRecordResponse).to.be.a.function;
          done();
        }
      };

      mockery.registerMock('./image', imageMock);
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      const res = {
      };

      users.postProfileAvatar(req, res);
    });

    it('should set the current user as avatar creator', function(done) {
      const user = {
        _id: 123
      };

      const imageMock = {
        recordAvatar: function(avatarId, mimetype, opts) {
          expect(opts).to.exist;
          expect(opts.creator).to.exist;
          expect(opts.creator.objectType).to.equal('user');
          expect(opts.creator.id).to.equal(user._id);
          done();
        }
      };

      mockery.registerMock('./image', imageMock);
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {user: user, query: {mimetype: 'image/png', size: 42}};
      const res = {
      };

      users.postProfileAvatar(req, res);
    });

    it('should return 500 if the recordAvatar response is a datastore failure', function(done) {
      const imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          const err = new Error('yolo');

          err.code = 1;
          avatarRecordResponse(err);
        }
      };

      mockery.registerMock('./image', imageMock);
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      const res = this.helpers.express.jsonResponse(
        (code, data) => {
          expect(code).to.equal(500);
          expect(data.error).to.shallowDeepEqual({
            code: 500,
            message: 'Server Error',
            details: 'Error while updating user avatar: failed to store avatar'
          });

          done();
        }
      );

      users.postProfileAvatar(req, res);
    });

    it('should return 500 if the recordAvatar response is an image manipulation failure', function(done) {
      const imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          const err = new Error('yolo');

          err.code = 2;
          avatarRecordResponse(err);
        }
      };

      mockery.registerMock('./image', imageMock);
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      const res = this.helpers.express.jsonResponse(
        (code, data) => {
          expect(code).to.equal(500);
          expect(data.error).to.shallowDeepEqual({
            code: 500,
            message: 'Server Error',
            details: 'Error while updating user avatar: failed to process avatar'
          });

          done();
        }
      );

      users.postProfileAvatar(req, res);
    });

    it('should return 500 if the recordAvatar response is a generic error', function(done) {
      const imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          const err = new Error('yolo');

          avatarRecordResponse(err);
        }
      };

      mockery.registerMock('./image', imageMock);
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      const res = this.helpers.express.jsonResponse(
        (code, data) => {
          expect(code).to.equal(500);
          expect(data.error).to.shallowDeepEqual({
            code: 500,
            message: 'Server Error',
            details: 'Error while updating user avatar'
          });

          done();
        }
      );

      users.postProfileAvatar(req, res);
    });

    it('should return 412 if the object recorded size is not the size provided by the user agent', function(done) {
      const imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          avatarRecordResponse(null, 666);
        }
      };

      mockery.registerMock('./image', imageMock);
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      const res = this.helpers.express.jsonResponse(
        (code, data) => {
          expect(code).to.equal(412);
          expect(data.error).to.shallowDeepEqual({
            code: 412,
            message: 'Precondition Failed',
            details: 'Avatar size given by user agent is 42 and avatar size returned by storage system is 666'
          });

          done();
        }
      );

      users.postProfileAvatar(req, res);
    });

    it('should call the update function of the user module to update user', function(done) {
      const usermock = {
        avatars: [],
        currentAvatar: undefined
      };
      const moduleMock = {
        user: {
          update: function() {
            expect(usermock.avatars).to.have.length(1);
            expect(usermock.currentAvatar).to.equal(usermock.avatars[0]);
            done();
          },
          updateProfile: (user, profile, callback) => callback()
        },
        image: {
          recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
            avatarRecordResponse(null, 42);
          }
        }
      };

      mockery.registerMock('../../core', moduleMock);

      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {user: usermock, query: {mimetype: 'image/png', size: 42}};
      const res = this.helpers.express.jsonResponse(
        function() {
        }
      );

      users.postProfileAvatar(req, res);
    });

    it('should return 500 if the model cannot be saved', function(done) {
      const moduleMock = {
        user: {
          update: function(user, callback) {
            const err = new Error('yolo');

            callback(err);
          },
          updateProfile: (user, profile, callback) => callback()
        },
        image: {
          recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
            avatarRecordResponse(null, 42);
          }
        },
        logger: {
          error: () => {}
        }
      };

      mockery.registerMock('../../core', moduleMock);

      const users = this.helpers.requireBackend('webserver/controllers/users');

      const usermock = {
        avatars: [],
        currentAvatar: undefined
      };
      const req = {user: usermock, query: {mimetype: 'image/png', size: 42}};
      const res = this.helpers.express.jsonResponse(
        (code, data) => {
          expect(code).to.equal(500);
          expect(data.error).to.shallowDeepEqual({
            code: 500,
            message: 'Server Error',
            details: 'Error while updating user avatar'
          });

          done();
        }
      );

      users.postProfileAvatar(req, res);
    });

    it('should return 200 and the avatar id, if recording is successfull', function(done) {
      const moduleMock = {
        user: {
          update: function(user, callback) {
            callback();
          },
          updateProfile: (user, profile, callback) => callback()
        },
        image: {
          recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
            avatarRecordResponse(null, 42);
          }
        }
      };

      mockery.registerMock('../../core', moduleMock);

      const users = this.helpers.requireBackend('webserver/controllers/users');

      const usermock = {
        avatars: [],
        currentAvatar: undefined
      };
      const req = {user: usermock, query: {mimetype: 'image/png', size: 42}};
      const res = this.helpers.express.jsonResponse(
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
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {};
      const res = this.helpers.express.jsonResponse(
        function(code, data) {
          expect(code).to.equal(404);
          expect(data).to.deep.equal({error: 404, message: 'Not found', details: 'User not found'});
          done();
        }
      );

      users.getProfileAvatar(req, res);
    });

    it('should redirect to default avatar the image Module return an error', function(done) {
      const imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback(new Error('error !'));
        },
        getMeta: function(id, callback) {
          return callback(null, {});
        }
      };

      mockery.registerMock('./image', imageModuleMock);
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        user: {
          currentAvatar: 'id'
        },
        query: {}
      };
      const res = {
        redirect: function() {
          done();
        }
      };

      users.getProfileAvatar(req, res);
    });

    it('should redirect to default avatar the image Module does not return the stream', function(done) {
      const imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback();
        },
        getMeta: function(id, callback) {
          return callback(null, {});
        }
      };

      mockery.registerMock('./image', imageModuleMock);
      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        user: {
          currentAvatar: 'id'
        },
        query: {}
      };
      const res = {
        redirect: function() {
          done();
        }
      };

      users.getProfileAvatar(req, res);
    });

    it('should return 200 and the stream even if meta data can not be found', function(done) {
      const image = {
        stream: 'test',
        pipe: function(res) {
          expect(res.header['Last-Modified']).to.not.exist;
          expect(res.code).to.equal(200);
          done();
        }
      };

      const imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback(null, null, image);
        }
      };

      mockery.registerMock('./image', imageModuleMock);

      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
        headers: {
        },
        user: {
          _id: '_id',
          currentAvatar: 'id'
        },
        query: {
        }
      };
      const res = {
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
      const image = {
        stream: 'test',
        pipe: function(res) {
          expect(res.header['Last-Modified']).to.exist;
          expect(res.code).to.equal(200);
          done();
        }
      };

      const imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback(null,
            {
              meta: 'data',
              uploadDate: new Date('Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)')
            }, image);
        }
      };

      mockery.registerMock('./image', imageModuleMock);

      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
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
      const res = {
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
      const image = {
        stream: 'test',
        pipe: function() {
          throw new Error();
        }
      };

      const imageModuleMock = {
        getAvatar: function(defaultAvatar, format, callback) {
          return callback(null,
            {
              meta: 'data',
              uploadDate: new Date('Thu Apr 17 2014 11:13:15 GMT+0200 (CEST)')
            }, image);
        }
      };

      mockery.registerMock('./image', imageModuleMock);

      const users = this.helpers.requireBackend('webserver/controllers/users');
      const req = {
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
      const res = this.helpers.express.response(
        function(code) {
          expect(code).to.equal(304);
          done();
        }
      );

      users.getProfileAvatar(req, res);
    });
  });
});
