'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;

describe('The notification controller', function() {

  describe('create fn', function() {

    it('should return 500 if notification module #save sends back error', function(done) {

      var mock = {
        save: function(notification, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/notification', mock);

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        body: {},
        user: {_id: 123}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      controller.create(req, res);
    });

    it('should return 201 if notification module #save does not send back error', function(done) {
      var mock = {
        save: function(notification, callback) {
          return callback(null, {});
        }
      };
      mockery.registerMock('../../core/notification', mock);

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        body: {},
        user: {_id: 123}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(201);
          done();
        }
      };
      controller.create(req, res);
    });
  });

  describe('load fn', function() {
    it('should call next when req.params.id is not set', function(done) {
      var mock = {
      };
      mockery.registerMock('../../core/notification', mock);

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        params: {}
      };

      var res = {
      };

      var next = function() {
        done();
      };
      controller.load(req, res, next);
    });

    it('should set the request notification', function(done) {
      var notification = {_id: 1234};
      var mock = {
        get: function(id, callback) {
          return callback(null, notification);
        }
      };
      mockery.registerMock('../../core/notification', mock);

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        params: {
          id: 1
        }
      };

      var res = {
      };

      var next = function() {
        expect(req.notification).to.exist;
        expect(req.notification).to.deep.equal(notification);
        done();
      };
      controller.load(req, res, next);
    });
  });

  describe('get fn', function() {
    it('should send back 200 if notification is in request', function(done) {
      var notification = {_id: 1234};
      var mock = {};
      mockery.registerMock('../../core/notification', mock);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        notification: notification
      };

      var res = {
        json: function(code, notification) {
          expect(code).to.equal(200);
          expect(notification).to.deep.equal(notification);
          done();
        }
      };
      controller.get(req, res);
    });

    it('should send back 404 if notification is not in request', function(done) {
      var mock = {};
      mockery.registerMock('../../core/notification', mock);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      controller.get(req, res);
    });
  });

  describe('created fn', function() {
    it('should send back 200 if notification can be found', function(done) {
      var mock = {
        find: function(options, callback) {
          return callback(null, []);
        }
      };
      mockery.registerMock('../../core/notification', mock);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        user: {
          _id: 123
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      controller.created(req, res);
    });

    it('should send back 500 if notification.find sends back error', function(done) {
      var mock = {
        find: function(options, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/notification', mock);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        user: {
          _id: 123
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      controller.created(req, res);
    });
  });

  describe('list fn', function() {
    it('should send back 200 if notification module sends back notifications', function(done) {
      var mock = {
        find: function(options, callback) {
          return callback(null, []);
        }
      };
      mockery.registerMock('../../core/notification', mock);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        user: {
          _id: 123
        },
        param: function() {
          return '';
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      controller.list(req, res);
    });

    it('should send back 500 if notification module sends back error', function(done) {
      var mock = {
        find: function(options, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/notification', mock);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        user: {
          _id: 123
        },
        param: function() {
          return '';
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
  });

  describe('setAsRead fn', function() {
    it('should send back 404 if notification is not in request', function(done) {
      var mock = {
      };
      mockery.registerMock('../../core/notification', mock);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      controller.setAsRead(req, res);
    });

    it('should send back 205 if notification.setAsRead does not fail', function(done) {
      var mock = {
        setAsRead: function(notification, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../core/notification', mock);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        notification: {_id: 123}
      };

      var res = {
        send: function(code) {
          expect(code).to.equal(205);
          done();
        }
      };
      controller.setAsRead(req, res);
    });

    it('should send back 500 if notification.setAsRead fails', function(done) {
      var mock = {
        setAsRead: function(notification, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/notification', mock);
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/notifications');

      var req = {
        notification: {_id: 123}
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      controller.setAsRead(req, res);
    });

  });
});
