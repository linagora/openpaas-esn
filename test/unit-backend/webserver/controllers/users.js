'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The User controller', function() {

  beforeEach(function(done) {
    this.testEnv.initCore(done);
  });

  describe('The logmein fn', function() {
    it('should redirect to / if user is set in request', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
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
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
        user: {
        }
      };
      var res = {
        send: function(status) {
          expect(status).to.equal(500);
          done();
        }
      };
      users.logmein(req, res);
    });

    it('should return HTTP 500 if user is not set in request', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {};
      var res = {
        send: function(status) {
          expect(status).to.equal(500);
          done();
        }
      };
      users.logmein(req, res);
    });
  });

  describe('The user fn', function() {
    it('should return the request user if available', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.deep.equal(req.user);
          done();
        }
      };
      users.user(req, res);
    });

    it('should return HTTP 404 if user is not defined in the request', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(404);
          done();
        }
      };
      users.user(req, res);
    });
  });

  describe('The updateProfile fn', function() {

    beforeEach(function() {
      var mock = {
        user: {
          updateProfile: function(user, parameter, value, callback) {
            return callback();
          }
        }
      };
      mockery.registerMock('../../core', mock);
    });

    it('should send back 404 if user is not set', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(404);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if parameter is not set', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
        params: {},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if parameter is unknown', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
        params: {
          attribute: 'foobarbazqix'
        },
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.details).to.match(/No value defined/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if firstname is not set in body', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'firstname'
        },
        body: {},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if firstname is too short', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'firstname'
        },
        body: {value: ''},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if firstname is too long', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'firstname'
        },
        body: {value: new Array(1000).join('a')},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should be OK if firstname is set with valid value', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'firstname'
        },
        body: {value: 'John'},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    // lastname

    it('should send back error if lastname is not set in body', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'lastname'
        },
        body: {},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if lastname is too short', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'lastname'
        },
        body: {value: ''},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if lastname is too long', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'lastname'
        },
        body: {value: new Array(1000).join('a')},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should be OK if lastname is set with valid value', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'lastname'
        },
        body: {value: 'Doe'},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    // job_title

    it('should send back error if job_title is not set in body', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'job_title'
        },
        body: undefined,
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if job_title is too short', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'job_title'
        },
        body: {value: ''},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if job_title is too long', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'job_title'
        },
        body: {value: new Array(1000).join('a')},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should be OK if job_title is set with valid value', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'job_title'
        },
        body: {value: 'Node Hacker'},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    // service

    it('should send back error if service is not set in body', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'service'
        },
        body: undefined,
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if service is too short', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'service'
        },
        body: {value: ''},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if service is too long', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'service'
        },
        body: {value: new Array(1000).join('a')},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should be OK if service is set with valid value', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'service'
        },
        body: {value: 'Development Team'},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    // building_location

    it('should send back error if building_location is not set in body', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'building_location'
        },
        body: undefined,
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if building_location is too short', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'building_location'
        },
        body: {value: ''},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if building_location is too long', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'building_location'
        },
        body: {value: new Array(1000).join('a')},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should be OK if building_location is set with valid value', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'building_location'
        },
        body: {value: '80, rue Roque de Fillol - 92800 Puteaux'},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    // office_location

    it('should send back error if office_location is not set in body', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'office_location'
        },
        body: undefined,
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if office_location is too short', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'office_location'
        },
        body: {value: ''},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if office_location is too long', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'office_location'
        },
        body: {value: new Array(1000).join('a')},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should be OK if office_location is set with valid value', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'building_location'
        },
        body: {value: 'First floor, Room 123456789'},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    // main_phone

    it('should send back error if main_phone is not set in body', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'main_phone'
        },
        body: undefined,
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if main_phone is too short', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'main_phone'
        },
        body: {value: ''},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should send back error if office_location is too long', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'main_phone'
        },
        body: {value: new Array(1000).join('a')},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code, error) {
          expect(code).to.equal(400);
          expect(error).to.exist;
          expect(error.error).to.exist;
          expect(error.error.message).to.match(/Bad Request/);
          done();
        }
      };
      users.updateProfile(req, res);
    });

    it('should be OK if main_phone is set with valid value', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');

      var req = {
        params: {
          attribute: 'building_location'
        },
        body: {value: '+33645560000'},
        user: {
          emails: ['foo@bar.com']
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      users.updateProfile(req, res);
    });
  });

  describe('the postProfileAvatar function', function() {
    it('should return 404 if the user is not actually logged in', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(404);
          expect(data.error).to.equal(404);
          expect(data.message).to.equal('Not found');
          expect(data.details).to.equal('User not found');
          done();
        }
      };
      users.postProfileAvatar(req, res);
    });

    it('should return 400 if the mimetype argument is not set', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: {}, query: {}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(400);
          expect(data.error).to.equal(400);
          expect(data.message).to.equal('Parameter missing');
          expect(data.details).to.equal('mimetype parameter is required');
          done();
        }
      };
      users.postProfileAvatar(req, res);
    });

    it('should return 400 if the mimetype argument is not an image mimetype', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'application/yolo'}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(400);
          expect(data.error).to.equal(400);
          expect(data.message).to.equal('Bad parameter');
          expect(data.details).to.equal('mimetype application/yolo is not acceptable');
          done();
        }
      };
      users.postProfileAvatar(req, res);
    });

    it('should return 400 if the size argument is not set', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png'}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(400);
          expect(data.error).to.equal(400);
          expect(data.message).to.equal('Parameter missing');
          expect(data.details).to.equal('size parameter is required');
          done();
        }
      };
      users.postProfileAvatar(req, res);
    });

    it('should return 400 if the size argument is not an integer', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 'yolo'}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(400);
          expect(data.error).to.equal(400);
          expect(data.message).to.equal('Bad parameter');
          expect(data.details).to.equal('size parameter should be an integer');
          done();
        }
      };
      users.postProfileAvatar(req, res);
    });

    it('should call the image.recordAvatar method', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          expect(avatarId).to.match(/^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/);
          expect(mimetype).to.equal('image/png');
          expect(avatarRecordResponse).to.be.a.function;
          done();
        }
      };
      mockery.registerMock('./image', imageMock);
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
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
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(500);
          expect(data.error).to.equal(500);
          expect(data.message).to.equal('Datastore failure');
          expect(data.details).to.equal('yolo');
          done();
        }
      };
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
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(500);
          expect(data.error).to.equal(500);
          expect(data.message).to.equal('Image processing failure');
          expect(data.details).to.equal('yolo');
          done();
        }
      };
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
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(500);
          expect(data.error).to.equal(500);
          expect(data.message).to.equal('Internal server error');
          expect(data.details).to.equal('yolo');
          done();
        }
      };
      users.postProfileAvatar(req, res);
    });

    it('should return 412 if the object recorded size is not the size provided by the user agent', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          avatarRecordResponse(null, 666);
        }
      };
      mockery.registerMock('./image', imageMock);
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: {}, query: {mimetype: 'image/png', size: 42}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(412);
          expect(data.error).to.equal(412);
          expect(data.message).to.equal('Image size does not match');
          done();
        }
      };
      users.postProfileAvatar(req, res);
    });

    it('should call the save function of the user model', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          avatarRecordResponse(null, 42);
        }
      };

      var usermock = {
        avatars: [],
        currentAvatar: undefined,
        save: function() {
          expect(usermock.avatars).to.have.length(1);
          expect(usermock.currentAvatar).to.equal(usermock.avatars[0]);
          done();
        }
      };

      mockery.registerMock('./image', imageMock);
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: usermock, query: {mimetype: 'image/png', size: 42}};
      var res = {
        json: function(code, data) {
        }
      };
      users.postProfileAvatar(req, res);
    });

    it('should return 500 if the model cannot be saved', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          avatarRecordResponse(null, 42);
        }
      };

      var usermock = {
        avatars: [],
        currentAvatar: undefined,
        save: function(callback) {
          var err = new Error('yolo');
          callback(err);
        }
      };

      mockery.registerMock('./image', imageMock);
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: usermock, query: {mimetype: 'image/png', size: 42}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(500);
          expect(data.error).to.equal(500);
          expect(data.message).to.equal('Datastore failure');
          expect(data.details).to.equal('yolo');
          done();
        }
      };
      users.postProfileAvatar(req, res);
    });

    it('should return 200 and the avatar id, if recording is successfull', function(done) {
      var imageMock = {
        recordAvatar: function(avatarId, mimetype, opts, req, avatarRecordResponse) {
          avatarRecordResponse(null, 42);
        }
      };

      var usermock = {
        avatars: [],
        currentAvatar: undefined,
        save: function(callback) {
          callback();
        }
      };

      mockery.registerMock('./image', imageMock);
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {user: usermock, query: {mimetype: 'image/png', size: 42}};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data._id).to.exist;
          expect(data._id).to.match(/^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/);
          done();
        }
      };
      users.postProfileAvatar(req, res);
    });
  });

  describe('the getProfilAvatar function', function() {
    it('should return 404 if the user is not logged in', function(done) {
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {};
      var res = {
        json: function(code, data) {
          expect(code).to.equal(404);
          expect(data).to.deep.equal({error: 404, message: 'Not found', details: 'User not found'});
          done();
        }
      };
      users.getProfileAvatar(req, res);
    });

    it('should return 500 if the image Module return an error', function(done) {
      var imageModuleMock = {
        getAvatar: function(defaultAvatar, callback) {
          return callback(new Error('error !'));
        }
      };
      mockery.registerMock('./image', imageModuleMock);
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
        user: {
          defaultAvatar: 'id'
        }
      };
      var res = {
        json: function(code, data) {
          expect(code).to.equal(500);
          expect(data).to.deep.equal({error: 500, message: 'Internal server error', details: 'error !'});
          done();
        }
      };
      users.getProfileAvatar(req, res);
    });

    it('should return 200 and the stream of the avatar file if all is ok', function(done) {
      var image = {
        stream: 'test',
        pipe: function(res) {
          expect(res.code).to.equal(200);
          done();
        }
      };
      var imageModuleMock = {
        getAvatar: function(defaultAvatar, callback) {
          return callback(null, {meta:'data'}, image);
        }
      };
      mockery.registerMock('./image', imageModuleMock);
      var users = require(this.testEnv.basePath + '/backend/webserver/controllers/users');
      var req = {
        user: {
          defaultAvatar: 'id'
        }
      };
      var res = {
        status: function(code) {
          this.code = code;
        }
      };

      users.getProfileAvatar(req, res);
    });

    it('should return 304 if the avatar has not changed til the last GET', function() {

    });
  });
});
