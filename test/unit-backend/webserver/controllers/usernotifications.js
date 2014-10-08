'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The user notifications controller', function() {
  describe('The list fn', function() {

    it('should call notification#getForUser with the limit query parameter', function(done) {

      var limit = 15;
      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          expect(query).to.exist;
          expect(query.limit).to.equal(limit);
          done();
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function(name) {
          if (name === 'limit') {
            return '' + limit;
          }
        }
      };
      controller.list(req, {});
    });

    it('should call notification#getForUser without limit if query parameter is a not number', function(done) {

      var limit = 'ABC';
      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          expect(query).to.exist;
          expect(query.limit).to.not.exist;
          done();
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function(name) {
          if (name === 'limit') {
            return '' + limit;
          }
        }
      };
      controller.list(req, {});
    });

    it('should call notification#getForUser with the offset query parameter', function(done) {

      var offset = 10;
      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          expect(query).to.exist;
          expect(query.offset).to.equal(offset);
          done();
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function(name) {
          if (name === 'offset') {
            return '' + offset;
          }
        }
      };
      controller.list(req, {});
    });

    it('should call notification#getForUser without the offset parameter if the query parameter is not a number', function(done) {

      var offset = 'AZE';
      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          expect(query).to.exist;
          expect(query.offset).to.not.exist;
          done();
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function(name) {
          if (name === 'offset') {
            return '' + offset;
          }
        }
      };
      controller.list(req, {});
    });

    it('should call notification#getForUser with read=true query parameter', function(done) {

      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          expect(query).to.exist;
          expect(query.read).to.be.true;
          done();
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function(name) {
          if (name === 'read') {
            return 'true';
          }
        }
      };
      controller.list(req, {});
    });

    it('should call notification#getForUser with read=false query parameter', function(done) {

      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          expect(query).to.exist;
          expect(query.read).to.be.false;
          done();
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function(name) {
          if (name === 'read') {
            return 'false';
          }
        }
      };
      controller.list(req, {});
    });

    it('should call notification#getForUser with read=undefined query parameter', function(done) {

      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          expect(query).to.exist;
          expect(query.read).to.be.undefined;
          done();
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function(name) {
          if (name === 'read') {
            return '123';
          }
        }
      };
      controller.list(req, {});
    });

    it('should send back HTTP 500 if notification#getForUser sends back error', function(done) {

      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          return callback(new Error());
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function() {
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      controller.list(req, res);
    });

    it('should call notification#countForUser when notifications are found', function(done) {

      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          return callback(null, [1, 2, 3]);
        },
        countForUser: function(user, query, callback) {
          done();
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function() {
        }
      };

      controller.list(req, {});
    });

    it('should send back the current number of notifications if count fails', function(done) {

      var notifications = [1, 2, 3];

      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          return callback(null, notifications);
        },
        countForUser: function(user, query, callback) {
          return callback(new Error());
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function() {
        }
      };

      var res = {
        json: function() {
          done();
        },

        header: function(name, value) {
          expect(name).to.equal('X-ESN-Items-Count');
          expect(value).to.equal(notifications.length);
        }
      };
      controller.list(req, res);
    });

    it('should send back an empty array if notifications can not be found', function(done) {

      var notifications = null;

      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          return callback(null, notifications);
        },
        countForUser: function(user, query, callback) {
          return callback(null, 101);
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function() {
        }
      };

      var res = {
        json: function(code, value) {
          expect(code).to.equal(200);
          expect(value).to.exist;
          expect(value).to.be.an.array;
          expect(value.length).to.equal(0);
          done();
        },

        header: function(name, value) {
        }
      };
      controller.list(req, res);
    });

    it('should send back the notifications and the number of notifications', function(done) {

      var notifications = [1, 2, 3, 4];
      var total = 20;

      mockery.registerMock('../../core/notification/user', {
        getForUser: function(user, query, callback) {
          return callback(null, notifications);
        },
        countForUser: function(user, query, callback) {
          return callback(null, total);
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        user: {
          _id: 1
        },
        param: function() {
        }
      };

      var res = {
        json: function(code, value) {
          expect(code).to.equal(200);
          expect(value).to.exist;
          expect(value).to.be.an.array;
          expect(value).to.deep.equal(notifications);
          done();
        },

        header: function(name, value) {
          expect(name).to.equal('X-ESN-Items-Count');
          expect(value).to.equal(total);
        }
      };
      controller.list(req, res);
    });
  });

  describe('load method', function() {

    it('should return 400 if req.params.id is not defined', function(done) {
      var req = {
        params: {}
      };
      var res = {
        json: function(code, message) {
          expect(code).to.equal(400);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(400);
          expect(message.error.details).to.exists;
          done();
        }
      };
      var userNotificationModuleMocked = {};
      mockery.registerMock('../../core/notification/user', userNotificationModuleMocked);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      controller.load(req, res, {});
    });

    it('should return 404 if usernotification not found', function(done) {
      var userNotificationModuleMocked = {
        get: function(id, callback) {
          callback(null, null);
        }
      };
      mockery.registerMock('../../core/notification/user', userNotificationModuleMocked);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        params: {
          id: 123456
        }
      };
      var res = {
        json: function(code, message) {
          expect(code).to.equal(404);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(404);
          expect(message.error.details).to.exists;
          done();
        }
      };
      controller.load(req, res, {});
    });

    it('should return 500 if cannot get a usernotification', function(done) {
      var userNotificationModuleMocked = {
        get: function(id, callback) {
          callback(new Error());
        }
      };
      mockery.registerMock('../../core/notification/user', userNotificationModuleMocked);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        params: {
          id: 123456
        }
      };
      var res = {
        json: function(code, message) {
          expect(code).to.equal(500);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(500);
          expect(message.error.details).to.exists;
          done();
        }
      };
      controller.load(req, res, {});
    });

    it('should get a usernotification, set it into req then call next', function(done) {
      var userNotificationModuleMocked = {
        get: function(id, callback) {
          callback(null, 'usernotification');
        }
      };
      mockery.registerMock('../../core/notification/user', userNotificationModuleMocked);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        params: {
          id: 123456
        }
      };
      var next = function() {
        expect(req.usernotification).to.equal('usernotification');
        done();
      };
      controller.load(req, {}, next);
    });
  });

  describe('setRead method', function() {

    it('should return 400 if req.body is undefined', function(done) {
      mockery.registerMock('../../core/notification/user', {});
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        usernotification: 'usernotification'
      };
      var res = {
        json: function(code, message) {
          expect(code).to.equal(400);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(400);
          expect(message.error.details).to.exists;
          done();
        }
      };
      controller.setRead(req, res);
    });

    it('should return 400 if req.body.value is undefined', function(done) {
      mockery.registerMock('../../core/notification/user', {});
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        usernotification: 'usernotification',
        body: {}
      };
      var res = {
        json: function(code, message) {
          expect(code).to.equal(400);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(400);
          expect(message.error.details).to.exists;
          done();
        }
      };
      controller.setRead(req, res);
    });

    it('should return 500 if module.setRead return an error', function(done) {
      var userNotificationModuleMocked = {
        setRead: function(usernotification, read, callback) {
          callback(new Error());
        }
      };
      mockery.registerMock('../../core/notification/user', userNotificationModuleMocked);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        usernotification: 'usernotification',
        body: {
          value: true
        }
      };
      var res = {
        json: function(code, message) {
          expect(code).to.equal(500);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(500);
          expect(message.error.details).to.exists;
          done();
        }
      };
      controller.setRead(req, res);
    });

    it('should return 205 if module.setRead is a success', function(done) {
      var readArgs;
      var userNotificationModuleMocked = {
        setRead: function(usernotification, read, callback) {
          readArgs = read;
          callback(null);
        }
      };
      mockery.registerMock('../../core/notification/user', userNotificationModuleMocked);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        usernotification: 'usernotification',
        body: {
          value: true
        }
      };
      var res = {
        send: function(code) {
          expect(code).to.equal(205);
          expect(readArgs).to.be.true;
          done();
        }
      };
      controller.setRead(req, res);
    });
  });

  describe('setAcknowledged method', function() {

    it('should return 400 if req.body is undefined', function(done) {
      mockery.registerMock('../../core/notification/user', {});
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        usernotification: 'usernotification'
      };
      var res = {
        json: function(code, message) {
          expect(code).to.equal(400);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(400);
          expect(message.error.details).to.exists;
          done();
        }
      };
      controller.setAcknowledged(req, res);
    });

    it('should return 400 if req.body.value is undefined', function(done) {
      mockery.registerMock('../../core/notification/user', {});
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        usernotification: 'usernotification',
        body: {}
      };
      var res = {
        json: function(code, message) {
          expect(code).to.equal(400);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(400);
          expect(message.error.details).to.exists;
          done();
        }
      };
      controller.setAcknowledged(req, res);
    });

    it('should return 500 if module.setRead return an error', function(done) {
      var userNotificationModuleMocked = {
        setAcknowledged: function(usernotification, read, callback) {
          callback(new Error());
        }
      };
      mockery.registerMock('../../core/notification/user', userNotificationModuleMocked);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        usernotification: 'usernotification',
        body: {
          value: true
        }
      };
      var res = {
        json: function(code, message) {
          expect(code).to.equal(500);
          expect(message.error).to.exists;
          expect(message.error.status).to.equal(500);
          expect(message.error.details).to.exists;
          done();
        }
      };
      controller.setAcknowledged(req, res);
    });

    it('should return 205 if module.setAcknowledged is a success', function(done) {
      var readArgs;
      var userNotificationModuleMocked = {
        setAcknowledged: function(usernotification, read, callback) {
          readArgs = read;
          callback(null);
        }
      };
      mockery.registerMock('../../core/notification/user', userNotificationModuleMocked);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/usernotifications');
      var req = {
        usernotification: 'usernotification',
        body: {
          value: true
        }
      };
      var res = {
        send: function(code) {
          expect(code).to.equal(205);
          expect(readArgs).to.be.true;
          done();
        }
      };
      controller.setAcknowledged(req, res);
    });
  });

});
