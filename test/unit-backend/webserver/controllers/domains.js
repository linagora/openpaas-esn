'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The domains controller', function() {

  describe('The getDomain fn', function() {

    it('should return HTTP 404 when domain is not available in the request', function(done) {
      mockery.registerMock('mongoose', {model: function() {
      }});
      var req = {
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(404);
          done();
        }
      };
      var controller = this.helpers.requireBackend('webserver/controllers/domains');
      controller.getDomain(req, res);
    });

    it('should return HTTP 200 when domain is available in the request', function(done) {
      mockery.registerMock('mongoose', {model: function() {}});
      var req = {
        domain: {}
      };
      var res = {
        json: function(status, domain) {
          expect(status).to.equal(200);
          expect(domain).to.exist;
          done();
        }
      };
      var controller = this.helpers.requireBackend('webserver/controllers/domains');
      controller.getDomain(req, res);
    });
  });

  describe('The sendInvitations fn', function() {

    it('should fail if request body is empty', function(done) {
      var mock = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mock);
      var req = {};
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var controller = this.helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should fail if request body is not an array', function(done) {
      var mock = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mock);

      var req = {
        body: {}
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var controller = this.helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should send HTTP 202 if request body is an array', function(done) {
      var mock = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mock);
      mockery.registerMock('../../core/invitation', {});
      mockery.registerMock('./invitation', {getInvitationURL: function() {return 'http://localhost';}});

      var req = {
        body: [],
        user: {
          _id: 123
        },
        domain: {
          _id: 456
        }
      };
      var res = {
        send: function(status) {
          expect(status).to.equal(202);
          done();
        }
      };
      var controller = this.helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should publish a notification to the local pubsub when invitations are sent', function(done) {
      var mock = {
        model: function() {
          return function(invitation) {
            return {
              save: function(callback) {
                return callback(null, invitation);
              }
            };
          };
        }
      };
      mockery.registerMock('mongoose', mock);

      var handlerMock = {
        validate: function(invitation, cb) {
          return cb(null, true);
        },
        init: function(invitation, cb) {
          return cb(null, true);
        }
      };
      mockery.registerMock('../../core/invitation', handlerMock);

      var req = {
        body: ['foo@bar.com', 'bar@baz.com'],
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        },
        get: function() {
          return '';
        },
        openpaas: {
          getBaseURL: function() {return '';}
        }
      };

      var res = {
        send: function() {
        }
      };

      var pubsub = this.helpers.requireBackend('core/pubsub').local;
      pubsub.topic('domain:invitations:sent').subscribe(function(message) {
        expect(message).to.exist;
        expect(message.user).to.exist;
        expect(message.domain).to.exist;
        expect(message.emails).to.exist;
        done();
      });
      var controller = this.helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should publish a notification to the local pubsub even if handler#validate is throwing an error', function(done) {
      var mock = {
        model: function() {
        }
      };
      mockery.registerMock('mongoose', mock);

      var handlerMock = {
        validate: function(invitation, cb) {
          return cb(new Error('Fail!'));
        },
        init: function(invitation, cb) {
          return cb(null, true);
        }
      };
      mockery.registerMock('../../core/invitation', handlerMock);

      var req = {
        body: ['foo@bar.com', 'bar@baz.com'],
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        },
        get: function() {
          return '';
        },
        openpaas: {
          getBaseURL: function() {return '';}
        }
      };

      var res = {
        send: function() {
        }
      };

      var pubsub = this.helpers.requireBackend('core/pubsub').local;
      pubsub.topic('domain:invitations:sent').subscribe(function(message) {
        expect(message).to.exist;
        expect(message.user).to.exist;
        expect(message.domain).to.exist;
        expect(message.emails).to.exist;
        expect(message.emails).to.be.empty;
        done();
      });
      var controller = this.helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should publish a notification to the local pubsub even if handler#init is throwing an error', function(done) {
      var mock = {
        model: function() {
          return function(invitation) {
            return {
              save: function(callback) {
                return callback(null, invitation);
              }
            };
          };
        }
      };
      mockery.registerMock('mongoose', mock);

      var handlerMock = {
        validate: function(invitation, cb) {
          return cb(null, true);
        },
        init: function(invitation, cb) {
          return cb(new Error('Fail!'));
        }
      };
      mockery.registerMock('../../core/invitation', handlerMock);

      var req = {
        body: ['foo@bar.com', 'bar@baz.com'],
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        },
        get: function() {
          return '';
        },
        openpaas: {
          getBaseURL: function() {return '';}
        }
      };

      var res = {
        send: function() {
        }
      };

      var pubsub = this.helpers.requireBackend('core/pubsub').local;
      pubsub.topic('domain:invitations:sent').subscribe(function(message) {
        expect(message).to.exist;
        expect(message.user).to.exist;
        expect(message.domain).to.exist;
        expect(message.emails).to.exist;
        expect(message.emails).to.be.empty;
        done();
      });
      var controller = this.helpers.requireBackend('webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });
  });
});
