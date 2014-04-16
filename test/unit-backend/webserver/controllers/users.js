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
});
